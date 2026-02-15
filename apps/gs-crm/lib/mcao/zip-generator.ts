import archiver from 'archiver'
import { PassThrough } from 'stream'

export class ZipGenerator {
  async createZip(files: Record<string, Buffer>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const passThrough = new PassThrough()

      // Collect chunks as they're written
      passThrough.on('data', (chunk) => {
        chunks.push(chunk)
      })

      passThrough.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      // Handle errors
      archive.on('error', (err: Error) => {
        reject(err)
      })

      // Pipe archive to passthrough stream
      archive.pipe(passThrough)

      // Add files to archive
      for (const [fileName, buffer] of Object.entries(files)) {
        archive.append(buffer, { name: fileName })
      }

      // Finalize the archive
      archive.finalize()
    })
  }
}