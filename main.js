// main.js
const { app, BrowserWindow, ipcMain, shell, powerMonitor } = require('electron');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

// Dossier contenant tous tes projets Git
const PROJECTS_DIR = process.env.PROJECTS_DIR || "/Volumes/workspace/";
const GIT_SCAN_DEPTH = parseInt(process.env.GIT_SCAN_DEPTH || "2", 10);

app.commandLine.appendSwitch('enable-transparent-visuals');

let cachedRepos = [];
let cachedCommits = [];
let checkedProjectList = [];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));


function findGitRepos(basePath, depth = GIT_SCAN_DEPTH) {
    const repos = [];

    function scan(dir, currentDepth) {
        if (currentDepth > depth) return;

        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (err) {
            console.warn(`⚠️ Impossible de lire ${dir} : ${err.message}`);
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const gitPath = path.join(fullPath, ".git");

            if (entry.isDirectory()) {
                try {
                    if (fs.existsSync(gitPath) && fs.lstatSync(gitPath).isDirectory()) {
                        repos.push(fullPath);
                    } else {
                        scan(fullPath, currentDepth + 1);
                    }
                } catch (err) {
                    console.warn(`⚠️ Impossible de scanner ${fullPath} : ${err.message}`);
                }
            }
        }
    }

    scan(basePath, 0);
    return repos;
}

// Récupère les commits du jour pour un projet
function getCommitsFromRepo(repoPath) {
    const today = new Date().toISOString().slice(0, 10);
    const command = `git log --since="${today} 00:00" --until="${today} 23:59" --pretty=format:"%s"`;

    return new Promise((resolve) => {
        exec(command, { cwd: repoPath }, (error, stdout) => {
            if (error) return resolve([]);

            const commits = stdout
                .trim()
                .split("\n")
                .filter((line) =>
                    line.trim().toLowerCase().includes("refs #") // 👈 filtre côté main
                );

            resolve(commits);
        });
    });
}

// Met à jour les commits en cache
async function refreshCommits() {
    console.log('Rafraîchissement des commits...');
    const allCommits = await Promise.all(cachedRepos.map(getCommitsFromRepo));
    cachedCommits = allCommits.flat();
    console.log('Commits mis à jour:', cachedCommits);
}

// Initialise
function setupGitCommitListener() {
    cachedRepos = findGitRepos(PROJECTS_DIR, GIT_SCAN_DEPTH);
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

async function createWindow() {
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
        backgroundColor: '#00000000', // <– 🔥 Ajoute ça !
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

    mainWindow.webContents.once('did-finish-load', async () => {
        await loadProjectsWithHeaderChecks(); // ✅ ici, le renderer est prêt à écouter
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

async function checkProjectSheetHeaders(project) {
    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: project.spreadsheetId,
            range: `${project.sheetName}!A1:F1`,
        });

        const headers = res.data.values?.[0] || [];
        const expected = [
            "Objet",
            "Tracker",
            "Personne",
            "Date",
            "Temps passé",
            "Temps décompté",
        ];

        const isValid = expected.every((col, i) => col === headers[i]);

        return { ...project, hasHeaderIssue: !isValid };
    } catch (e) {
        console.warn(`⚠️ Erreur sur ${project.nomProjet} :`, e.message);
        return { ...project, hasHeaderIssue: true };
    }
}


async function loadProjectsWithHeaderChecks() {
    const raw = fs.readFileSync('./src/public/projet.json', 'utf8');
    const projects = JSON.parse(raw);

    const checked = [];

    for (let index = 0; index < projects.length; index++) {
        const project = projects[index];
        mainWindow?.webContents.send("project-checking", {
            current: index + 1,
            total: projects.length,
            name: project.nomProjet
        });

        const result = await checkProjectSheetHeaders(project);
        checked.push(result);
        await delay(200);
    }

    checkedProjectList = checked;
    mainWindow.webContents.send('app-loaded');
}

ipcMain.handle('get-checked-projects', () => {
    return checkedProjectList;
});