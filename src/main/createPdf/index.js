import { dialog } from 'electron'
import fs, { ensureDir, readFile, writeFile } from 'fs-extra'
import path from 'path'
import { PDFDocument } from 'pdf-lib'

export const CreatePdfs = async (formData) => {
  const { uploadedFilePath, pdfPath, filesInfo } = formData

  try {
    // Read the uploaded PDF file
    const pdfBytes = await readFile(uploadedFilePath)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    // console.log('uploadedFilePath pdfPath ===>', uploadedFilePath ,pdfPath )

    // Normalize the PDF path
    const normalizedPdfPath = path.normalize(pdfPath)
    // console.log('normalise path ===>', normalizedPdfPath)
    // Perform operations to create new PDF files based on filesInfo
    // Create a new PDF containing selected pages for each file
    for (const fileInfo of filesInfo) {
      const startPage = parseInt(fileInfo.startPage)
      const endPage = parseInt(fileInfo.endPage)

      if (!startPage || !endPage) {
        throw new Error('Invalid start page or end page')
      }

      if (startPage > endPage || startPage < 1 || endPage > pdfDoc.getPageCount()) {
        throw new Error('Invalid page range')
      }

      // Create a new PDF containing only selected pages
      const newPdfDoc = await PDFDocument.create()

      for (let i = startPage; i <= endPage; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i - 1])
        newPdfDoc.addPage(copiedPage)
      }

      // Serialize the new PDF to bytes
      const newPdfBytes = await newPdfDoc.save()

      // Ensure the directory exists
      await ensureDir(normalizedPdfPath)

      // Define the path for the created PDF file
      const fileName = `${fileInfo.name}.pdf`
      const filePath = path.join(normalizedPdfPath, fileName)

      // Write the PDF bytes to the file system
      await writeFile(filePath, newPdfBytes)
    }
    // Show success message
    await dialog.showMessageBox({
      type: 'info',
      title: 'PDF created',
      message: 'PDF created successfully.'
    })
    // Return a success message
    return 'PDFs created successfully'
  } catch (error) {
    console.error('Error creating folders:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Failed to create PDFs. Please try again.'
    })
  }
}
