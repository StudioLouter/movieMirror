import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
require('dotenv').config()

const isDevelopment = process.env.stage !== 'production'

let mainWindow

function createMainWindow () {
  const window = new BrowserWindow(
    {
      frame: false,
      kiosk: !isDevelopment,
      fullscreen: !isDevelopment,
      width: 1920,
      height: 1080
    }
  )

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  window.loadURL(formatUrl({
    pathname: path.join(__dirname, '../renderer/', 'index.html'),
    protocol: 'file',
    slashes: true
  }))

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })
  return window
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})
app.on('ready', () => {
  mainWindow = createMainWindow()
})
