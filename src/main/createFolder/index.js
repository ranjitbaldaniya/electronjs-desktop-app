import { dialog } from 'electron'
import { ensureDir, pathExists, readdir, remove, writeFile } from 'fs-extra'
import path from 'path'

export const createFolders = async (selectedDoctors, selectedPath) => {
  try {
    const rootDir = path.join(__dirname) // Adjust path as needed
    // console.log('root dir ==>', rootDir)
    // Ensure the selected path exists
    const exists = await pathExists(selectedPath)
    // console.log('exists ==>', exists)

    if (!exists) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Folder not found',
        message: `The selected path ${selectedPath} does not exist. Please select a valid folder.`
      })
      return
    }

    // Get existing folder names
    const existingDoctorNames = await readdir(selectedPath)

    for (const doctor of selectedDoctors) {
      const doctorFolderName = `${doctor.doctorName}`.toUpperCase() // Capitalize folder name

      // Skip if folder already exists
      if (existingDoctorNames.includes(doctorFolderName)) {
        console.log(`${doctorFolderName} already exists, skipping...`)
        continue
      }

      const doctorFolderPath = path.join(selectedPath, doctorFolderName)
      await ensureDir(doctorFolderPath)

      const formattedDate = formatDate(doctor.todaysDate) // Format date
      const dateFolderPath = path.join(doctorFolderPath, formattedDate)
      await ensureDir(dateFolderPath)

      let vendorFolderPath
      if (doctor.vendor === 'Geico') {
        vendorFolderPath = path.join(dateFolderPath, 'GEICO')
      } else {
        const nonGeicoFolderPath = path.join(dateFolderPath, 'NON-GEICO')
        await ensureDir(nonGeicoFolderPath)
        vendorFolderPath = path.join(nonGeicoFolderPath, doctor.vendor.toUpperCase()) // Capitalize vendor name
      }

      const reportType = doctor.reportType === 'Retrospective' ? 'Resrospective' : 'Prospective'
      const reportTypeFolderPath = path.join(vendorFolderPath, reportType.toUpperCase()) // Capitalize report type
      await ensureDir(reportTypeFolderPath)

      const finalFolderPath = path.join(
        reportTypeFolderPath,
        `${doctor.docId} ${doctor.patientName}`.toUpperCase() // Capitalize final folder name
      )
      await ensureDir(finalFolderPath)

      // Copy the .docx files to the final folder (you'll need to adjust this part)
      const docxFilePaths = [
        path.join(__dirname, 'DAIGNOSIS.docx'),
        path.join(__dirname, 'SPECIAL_INSTRUCTIONS.docx')
      ]
      for (const docxFilePath of docxFilePaths) {
        const fileName = path.basename(docxFilePath)
        const destinationPath = path.join(finalFolderPath, fileName)
        await writeFile(destinationPath, '') // Adjust to copy file content
      }
    }

    // Show success message
    await dialog.showMessageBox({
      type: 'info',
      title: 'Folders created',
      message: 'Folders created successfully.'
    })
  } catch (error) {
    console.error('Error creating folders:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: 'Failed to create folders. Please try again.'
    })
  }
}

// Function to format date
function formatDate(dateString) {
  const parts = dateString.match(/(\d+)/g)
  if (parts.length === 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`
  }
  return dateString // Return as is if not in expected format
}
