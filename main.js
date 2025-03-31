const { app, BrowserWindow } = require('electron');
const path = require('path');
require('dotenv').config();

let win = null;

const createWindow = () => {
  if (win) return;

  win = new BrowserWindow({
    width: 900,
    height: 700,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  win.loadURL(startUrl);

  win.on('closed', () => {
    win = null;
  });
};

// app.on('ready', createWindow);

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) createWindow();
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });
