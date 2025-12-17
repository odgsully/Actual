import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink, mkdir, readFile, readdir, rmdir } from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import { ZipGenerator } from '@/lib/mcao/zip-generator'
import { MCAOClient } from '@/lib/mcao/client'
import { ExcelGenerator } from '@/lib/mcao/excel-generator'
import * as XLSX from 'xlsx'

export const maxDuration = 900 // 15 minutes for large files
export const dynamic = 'force-dynamic'

// Use system temp directory
const TEMP_DIR = path.join(process.cwd(), 'tmp', 'mcao-bulk')
const SCRIPTS_DIR = path.join(process.cwd(), 'scripts')
const PYTHON_SCRIPT = path.join(SCRIPTS_DIR, 'bulk_apn_lookup.py')

interface PythonMessage {
  status: 'processing' | 'complete' | 'error'
  message?: string
  output_file?: string
  error?: string
}

export async function POST(request: NextRequest) {
  let inputFilePath: string | null = null
  let outputDir: string | null = null

  try {
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      )
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Create temp directories
    await mkdir(TEMP_DIR, { recursive: true })
    const sessionId = Date.now().toString()
    outputDir = path.join(TEMP_DIR, sessionId)
    await mkdir(outputDir, { recursive: true })

    // Save uploaded file to temp location
    const fileExt = fileName.endsWith('.csv') ? '.csv' : '.xlsx'
    inputFilePath = path.join(outputDir, `input${fileExt}`)
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(inputFilePath, Buffer.from(arrayBuffer))

    console.log('Starting Python script for APN lookup...')
    console.log('Input file:', inputFilePath)
    console.log('Output directory:', outputDir)

    // Execute Python script
    const result = await runPythonScript(inputFilePath, outputDir, file.size)

    if (!result.success || !result.outputFile) {
      console.error('Python script failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to process addresses' },
        { status: 500 }
      )
    }

    console.log('Python script completed. Output file:', result.outputFile)

    // Read the generated Excel file
    const apnCompleteBuffer = await readFile(result.outputFile)

    // Parse the APN Excel file to extract addresses and APNs
    const workbook = XLSX.read(apnCompleteBuffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    console.log('Parsed APN file, processing MCAO lookups...')

    // Process MCAO lookups for each APN
    const mcaoClient = new MCAOClient()
    const addressRecords: any[] = []

    // Skip header row if present
    const startIdx = data[0] && typeof data[0][0] === 'string' &&
                     (data[0][0].toLowerCase().includes('address') || data[0][0].toLowerCase().includes('full')) ? 1 : 0

    for (let i = startIdx; i < data.length; i++) {
      const row = data[i]
      const address = row[0] || ''
      const apn = row[1] || ''

      const record: any = {
        address: address,
        apn: apn,
        originalRow: row,
        mcaoData: null
      }

      if (apn && apn.toString().trim()) {
        try {
          console.log(`Looking up MCAO data for APN: ${apn}`)
          const mcaoResult = await mcaoClient.lookupByAPN({ apn: apn.toString().trim() })

          if (mcaoResult.success && mcaoResult.flattenedData) {
            record.mcaoData = mcaoResult.flattenedData
          } else {
            record.error = mcaoResult.error?.message || 'MCAO lookup failed'
          }
        } catch (error) {
          console.error(`Failed to lookup MCAO data for APN ${apn}:`, error)
          record.error = error instanceof Error ? error.message : 'Unknown error'
        }
      } else {
        record.error = 'No APN available'
      }

      addressRecords.push(record)
    }

    console.log(`Completed MCAO lookups for ${addressRecords.length} records`)

    // Create timestamp for file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)

    // Generate MCAO Excel file
    const excelGenerator = new ExcelGenerator()
    const mcaoBuffer = await excelGenerator.generateMCAOFile(addressRecords, timestamp)

    // Create ZIP with all three files
    const zipGenerator = new ZipGenerator()

    const zipBuffer = await zipGenerator.createZip({
      [`APN_Grab_${timestamp}.xlsx`]: apnCompleteBuffer,
      [`MCAO_${timestamp}.xlsx`]: mcaoBuffer,
      [`Original_${file.name}`]: Buffer.from(arrayBuffer),
    })

    // Cleanup temp files
    await cleanup(inputFilePath, outputDir)

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="MCAO_Bulk_${timestamp}.zip"`,
      },
    })

  } catch (error) {
    console.error('Bulk MCAO processing error:', error)

    // Cleanup on error
    if (inputFilePath || outputDir) {
      await cleanup(inputFilePath, outputDir).catch(console.error)
    }

    return NextResponse.json(
      { error: 'Failed to process file. Please ensure Python dependencies are installed.' },
      { status: 500 }
    )
  }
}

async function runPythonScript(
  inputPath: string,
  outputDir: string,
  fileSize: number
): Promise<{ success: boolean; outputFile?: string; error?: string }> {
  return new Promise((resolve) => {
    // Find Python executable
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'

    // Dynamic rate based on file size (larger files use higher rate)
    const rate = fileSize > 1024 * 1024 ? '15.0' : '10.0'  // 15 req/s for files > 1MB

    console.log('Executing Python script:', pythonCmd, PYTHON_SCRIPT, inputPath)
    console.log(`File size: ${(fileSize / 1024).toFixed(2)}KB, Rate limit: ${rate} req/s`)

    const pythonProcess = spawn(pythonCmd, [
      PYTHON_SCRIPT,
      inputPath,
      '--output-dir',
      outputDir,
      '--rate',
      rate,  // Dynamic rate based on file size
    ], {
      cwd: process.cwd()
    })

    let outputFile: string | undefined
    let errorMessage = ''
    let allOutput = ''

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('Python stdout:', output)
      allOutput += output

      // Try to parse JSON messages
      const lines = output.split('\n').filter((l: string) => l.trim())
      for (const line of lines) {
        try {
          const msg: PythonMessage = JSON.parse(line)
          if (msg.status === 'complete' && msg.output_file) {
            outputFile = msg.output_file
            console.log('APN lookup complete, output file:', outputFile)
          } else if (msg.status === 'error') {
            errorMessage = msg.error || 'Unknown error'
            console.error('Python script error:', errorMessage)
          } else if (msg.status === 'processing') {
            console.log('Processing:', msg.message)
          }
        } catch {
          // Not JSON, could be progress updates from the Python script
          console.log('Python output:', line)
        }
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString()
      console.error('Python stderr:', error)
      errorMessage += error
    })

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`)

      if (code === 0 && outputFile) {
        resolve({ success: true, outputFile })
      } else {
        // If we didn't get proper JSON output, include all output in error
        const fullError = errorMessage || allOutput || `Python script exited with code ${code}`
        resolve({
          success: false,
          error: fullError.substring(0, 1000), // Limit error message length
        })
      }
    })

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error)
      if (error.message.includes('ENOENT')) {
        resolve({
          success: false,
          error: 'Python not found. Please ensure Python 3 is installed.',
        })
      } else {
        resolve({
          success: false,
          error: `Failed to start Python process: ${error.message}`,
        })
      }
    })

    // Set timeout (15 minutes for large files)
    setTimeout(() => {
      pythonProcess.kill()
      resolve({
        success: false,
        error: 'Python script timeout after 15 minutes. File may be too large.',
      })
    }, 900000)  // 15 minutes
  })
}

async function cleanup(inputFilePath: string | null, outputDir: string | null) {
  try {
    if (inputFilePath) {
      await unlink(inputFilePath).catch(() => {})
    }
    if (outputDir) {
      // Remove all files in output directory
      try {
        const files = await readdir(outputDir)
        await Promise.all(files.map(f => unlink(path.join(outputDir, f)).catch(() => {})))
        await rmdir(outputDir).catch(() => {})
      } catch {
        // Directory might not exist or already be deleted
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}