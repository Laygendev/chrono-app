// main.js
const { app, BrowserWindow, ipcMain, shell, powerMonitor } = require('electron');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

// Dossier contenant tous tes projets Git
const PROJECTS_DIR = "/Volumes/workspace/"

let cachedRepos = [];
let cachedCommits = [];

// Trouve tous les projets Git
function findGitRepos(basePath) {
  const repos = [];
  const dirs = fs.readdirSync(basePath);
  for (const dir of dirs) {
    const fullPath = path.join(basePath, dir);
    const gitPath = path.join(fullPath, ".git");
    if (fs.existsSync(gitPath) && fs.lstatSync(gitPath).isDirectory()) {
      repos.push(fullPath);
    }
  }
  return repos;
}

// Récupère les commits du jour pour un projet
function getCommitsFromRepo(repoPath) {
  const today = new Date().toISOString().slice(0, 10);
  const command = `git log --since="${today} 00:00" --until="${today} 23:59" --pretty=format:"${path.basename(repoPath)} %h - %s"`;

  return new Promise((resolve) => {
    exec(command, { cwd: repoPath }, (error, stdout) => {
      if (error) return resolve([]);
      const commits = stdout.trim().split("\n").filter(Boolean);
      resolve(commits);
    });
  });
}

// Met à jour les commits en cache
async function refreshCommits() {
  const allCommits = await Promise.all(cachedRepos.map(getCommitsFromRepo));
  cachedCommits = allCommits.flat();
  console.log('Commits mis à jour:', cachedCommits);
}

// Initialise
function setupGitCommitListener() {
  cachedRepos = findGitRepos(PROJECTS_DIR);
  refreshCommits(); // Initial load
  setInterval(refreshCommits, 60 * 1000); // Rafraîchir toutes les minutes
}

// IPC handler
ipcMain.handle("get-todays-commits", async () => {
  return cachedCommits;
});

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
            preload: path.join(app.getAppPath(), "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    const isDev = !app.isPackaged;
    const startUrl = isDev
      ? process.env.ELECTRON_START_URL || 'http://localhost:3000'
      : `file://${path.join(__dirname, 'build', 'index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    powerMonitor.on('suspend', () => {
        // Envoie un signal au renderer pour stopper tous les chronos
        mainWindow.webContents.send('stop-all-chronos');
    });

    powerMonitor.on('lock-screen', () => {
        console.log('🔒 Écran verrouillé');
        mainWindow.webContents.send('stop-all-chronos');
    });

    setupGitCommitListener();
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
