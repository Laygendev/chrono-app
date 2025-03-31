// main.js
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let mainWindow; // ✅ définie en haut

// auth Google (tu dois avoir credentials.json + token.json)
const getAuth = () => {
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const redirect_uris = ['http://localhost']; // fixe pour app desktop

    const token = JSON.parse(fs.readFileSync('./token.json')); // conservé

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    return oAuth2Client;
};

function createWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workArea;

    mainWindow = new BrowserWindow({
        width: 300,
        height: 260,
        frame: false,
        transparent: true,
        vibrancy: 'sidebar', // ou 'medium-light' / 'ultra-dark' selon ton style
        visualEffectState: 'active',
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', () => {
        mainWindow = null;
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

ipcMain.on('append-to-sheet', async (event, { spreadsheetId, sheetName, values }) => {
    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values,
            },
        });

        console.log('✅ Données ajoutées avec succès');
        event.reply('append-to-sheet-success');
    } catch (err) {
        console.error('❌ Erreur ajout Google Sheet:', err);
    }
});

ipcMain.on('open-external-url', (event, url) => {
  shell.openExternal(url);
});
