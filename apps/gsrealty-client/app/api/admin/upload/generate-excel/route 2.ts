/**
 * Generate Excel API Route
 *
 * PUT /api/admin/upload/generate-excel
 * Generates populated Excel file from uploaded MLS data and subject property
 */

import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      subjectProperty,
      residential15Mile,
      residentialLease15Mile,
      residential3YrDirect,
      residentialLease3YrDirect,
      mcaoData,
      clientName
    } = body

    console.log('[Generate Excel] Creating workbook with data:', {
      hasSubject: !!subjectProperty,
      res15Count: residential15Mile?.length || 0,
      resLease15Count: residentialLease15Mile?.length || 0,
      res3YrCount: residential3YrDirect?.length || 0,
      resLease3YrCount: residentialLease3YrDirect?.length || 0,
      clientName
    })

    // Create workbook
    const workbook = new ExcelJS.Workbook()

    // Add metadata
    workbook.creator = 'GSRealty Upload System'
    workbook.created = new Date()

    // Create MLS-Comps sheet
    const mlsSheet = workbook.addWorksheet('MLS-Comps')

    // Add headers
    const headers = [
      'Property Type',
      'Address',
      'City',
      'State',
      'ZIP',
      'Price',
      'Bedrooms',
      'Bathrooms',
      'Square Feet',
      'Lot Size',
      'Year Built',
      'Status',
      'List Date',
      'Sold Date',
      'DOM',
      'Price Per SF',
      'Source'
    ]

    mlsSheet.addRow(headers)

    // Style header row
    const headerRow = mlsSheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    }

    // Add data sections
    let rowIndex = 2

    // Add section: Residential 1.5 Mile
    if (residential15Mile && residential15Mile.length > 0) {
      mlsSheet.addRow(['=== Residential 1.5 Mile Comps ==='])
      mlsSheet.getRow(rowIndex).font = { bold: true, color: { argb: 'FF0000FF' } }
      rowIndex++

      residential15Mile.forEach((prop: any) => {
        mlsSheet.addRow([
          prop.propertyType || 'Residential',
          prop.address || '',
          prop.city || '',
          prop.state || 'AZ',
          prop.zip || '',
          prop.price || '',
          prop.bedrooms || '',
          prop.bathrooms || '',
          prop.squareFeet || '',
          prop.lotSize || '',
          prop.yearBuilt || '',
          prop.status || '',
          prop.listDate || '',
          prop.soldDate || '',
          prop.dom || '',
          prop.pricePerSF || '',
          '1.5 Mile Comp'
        ])
        rowIndex++
      })
    }

    // Add section: Residential Lease 1.5 Mile
    if (residentialLease15Mile && residentialLease15Mile.length > 0) {
      mlsSheet.addRow(['=== Residential Lease 1.5 Mile Comps ==='])
      mlsSheet.getRow(rowIndex).font = { bold: true, color: { argb: 'FF0000FF' } }
      rowIndex++

      residentialLease15Mile.forEach((prop: any) => {
        mlsSheet.addRow([
          prop.propertyType || 'Residential Lease',
          prop.address || '',
          prop.city || '',
          prop.state || 'AZ',
          prop.zip || '',
          prop.price || '',
          prop.bedrooms || '',
          prop.bathrooms || '',
          prop.squareFeet || '',
          prop.lotSize || '',
          prop.yearBuilt || '',
          prop.status || '',
          prop.listDate || '',
          prop.soldDate || '',
          prop.dom || '',
          prop.pricePerSF || '',
          '1.5 Mile Lease Comp'
        ])
        rowIndex++
      })
    }

    // Add section: Residential 3yr Direct
    if (residential3YrDirect && residential3YrDirect.length > 0) {
      mlsSheet.addRow(['=== Residential 3yr Direct Subdivision Comps ==='])
      mlsSheet.getRow(rowIndex).font = { bold: true, color: { argb: 'FF0000FF' } }
      rowIndex++

      residential3YrDirect.forEach((prop: any) => {
        mlsSheet.addRow([
          prop.propertyType || 'Residential',
          prop.address || '',
          prop.city || '',
          prop.state || 'AZ',
          prop.zip || '',
          prop.price || '',
          prop.bedrooms || '',
          prop.bathrooms || '',
          prop.squareFeet || '',
          prop.lotSize || '',
          prop.yearBuilt || '',
          prop.status || '',
          prop.listDate || '',
          prop.soldDate || '',
          prop.dom || '',
          prop.pricePerSF || '',
          '3yr Direct Comp'
        ])
        rowIndex++
      })
    }

    // Add section: Residential Lease 3yr Direct
    if (residentialLease3YrDirect && residentialLease3YrDirect.length > 0) {
      mlsSheet.addRow(['=== Residential Lease 3yr Direct Subdivision Comps ==='])
      mlsSheet.getRow(rowIndex).font = { bold: true, color: { argb: 'FF0000FF' } }
      rowIndex++

      residentialLease3YrDirect.forEach((prop: any) => {
        mlsSheet.addRow([
          prop.propertyType || 'Residential Lease',
          prop.address || '',
          prop.city || '',
          prop.state || 'AZ',
          prop.zip || '',
          prop.price || '',
          prop.bedrooms || '',
          prop.bathrooms || '',
          prop.squareFeet || '',
          prop.lotSize || '',
          prop.yearBuilt || '',
          prop.status || '',
          prop.listDate || '',
          prop.soldDate || '',
          prop.dom || '',
          prop.pricePerSF || '',
          '3yr Direct Lease Comp'
        ])
        rowIndex++
      })
    }

    // Auto-fit columns
    mlsSheet.columns.forEach(column => {
      column.width = 15
    })

    // Create Full-MCAO-API sheet if subject property data exists
    if (mcaoData && mcaoData.data) {
      const mcaoSheet = workbook.addWorksheet('Full-MCAO-API')

      // Add subject property data
      mcaoSheet.addRow(['Subject Property Data'])
      mcaoSheet.getRow(1).font = { bold: true, size: 14 }

      const subjectData = mcaoData.data
      mcaoSheet.addRow(['APN', subjectData.apn || ''])
      mcaoSheet.addRow(['Address', subjectData.propertyAddress?.fullAddress || ''])
      mcaoSheet.addRow(['Owner', subjectData.ownerName || ''])
      mcaoSheet.addRow(['Assessed Value', subjectData.assessedValue?.total || ''])
      mcaoSheet.addRow(['Property Type', subjectData.propertyType || ''])
      mcaoSheet.addRow(['Land Use', subjectData.landUse || ''])
      mcaoSheet.addRow(['Lot Size', subjectData.lotSize || ''])
      mcaoSheet.addRow(['Year Built', subjectData.yearBuilt || ''])
      mcaoSheet.addRow(['Bedrooms', subjectData.bedrooms || ''])
      mcaoSheet.addRow(['Bathrooms', subjectData.bathrooms || ''])

      mcaoSheet.columns.forEach(column => {
        column.width = 20
      })
    }

    // Create Analysis sheet (placeholder)
    const analysisSheet = workbook.addWorksheet('Analysis')
    analysisSheet.addRow(['Analysis'])
    analysisSheet.getRow(1).font = { bold: true, size: 14 }
    analysisSheet.addRow([''])
    analysisSheet.addRow(['RENOVATE_SCORE Column', 'Enter Y, N, or 0.5 for each property'])
    analysisSheet.addRow(['Property Radar Data', 'Add additional data from Property Radar if available'])
    analysisSheet.addRow([''])
    analysisSheet.addRow(['After completion, save as:', `Complete_${clientName}_${new Date().toISOString().split('T')[0].replace(/-/g, '-')}-${String(new Date().getHours()).padStart(2, '0')}${String(new Date().getMinutes()).padStart(2, '0')}.xlsx`])

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Generate filename
    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const lastName = (clientName || 'Client').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')
    const filename = `Upload_${lastName}_${timestamp}.xlsx`

    console.log('[Generate Excel] Successfully created:', filename)

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('[Generate Excel] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate Excel file'
      },
      { status: 500 }
    )
  }
}
