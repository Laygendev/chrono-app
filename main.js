// main.js
const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path');
require('dotenv').config();

let mainWindow;

function createWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workArea;

    const win = new BrowserWindow({
        width: 280,
        height: 160,
        x: width - 300,         // 20px de marge droite
        y: height - 180,        // 20px de marge bas
        frame: false,           // ❌ pas de barre de fenêtre
        alwaysOnTop: true,
        resizable: false,
        transparent: true,      // 💎 permet un look flottant
        skipTaskbar: true,      // ❌ pas dans le dock (macOS)
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false
        }
    });

    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    win.loadURL(startUrl);

    win.on('closed', () => {
        win = null;
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
  });
  