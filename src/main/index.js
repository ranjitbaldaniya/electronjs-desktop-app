import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createFolders } from './createFolder'
import { CreatePdfs } from './createPdf'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false, // Disabling web security for demonstration, consider carefully in production
      allowRunningInsecureContent: true, // Allow loading resources over http/https without CORS
      additionalArguments: ['--disable-web-security'], // Disable web security
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('create-folders', async (event, formData) => {
    // Call the CreateFolder function with the received form data
    await createFolders(formData.selectedDoctors, formData.selectedPath)
  })

  ipcMain.on('create-pdfs', async (event, formData) => {
    // Handle PDF creation or other operations based on formData
    // console.log('Received form data:', formData)

    // Call the CreatePdfs function with the provided formData
    await CreatePdfs(formData)
  })

  // In your Electron main process file

  ipcMain.on('check-internet-connection', async (event) => {
    try {
      const online = await import('is-online')
      const isOnline = (await online.default()) || false
      // console.log('is online ==>', isOnline)
      event.reply('check-internet-connection', isOnline)
    } catch (error) {
      console.error('Error checking internet connection:', error)
      event.reply('internet-connection-status', false)
    }
  })

  ipcMain.on('get-current-time', async (event) => {
    try {
      const response = await fetch('https://worldtimeapi.org/api/ip')
      const data = await response.json()
      const currentTime = data.datetime

      // console.log('current time', currentTime)
      event.reply('current-time', currentTime)
    } catch (error) {
      console.error('Error getting current time:', error)
      event.reply('current-time-error', 'Error getting current time')
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
