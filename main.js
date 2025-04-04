// main.js
const { app, BrowserWindow, ipcMain, shell, powerMonitor, globalShortcut } = require('electron');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Dossier contenant tous tes projets Git
const PROJECTS_DIR = config.PROJECTS_DIR || "/Volumes/workspace/";
const GIT_SCAN_DEPTH = parseInt(config.GIT_SCAN_DEPTH || "2", 10);

const log = require('electron-log');

log.transports.file.resolvePath = () =>
    path.join(app.getPath('userData'), 'logs/main.log'); // <- sûr et propre

log.info('App started');

let hasActiveTimer = false;


let cachedRepos = [];
let cachedCommits = [];
// let checkedProjectList = [];
// let allProjectList = [];

// app.setAppUserModelId(app.name);

const {
    initStore,
    setItem,
    getItem,
    clearStore
} = require('./store');

ipcMain.handle('store:set', async (event, key, value) => {
    await setItem(key, value);
});

ipcMain.handle('store:get', async (event, key) => {
    return await getItem(key);
});

ipcMain.handle('store:clear', async () => {
    await clearStore();
});


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
    // log.info('Rafraîchissement des commits...');
    const allCommits = await Promise.all(cachedRepos.map(getCommitsFromRepo));
    cachedCommits = allCommits.flat();
    // log.info('Commits mis à jour:', cachedCommits);
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
    try {

        const client_id = config.CLIENT_ID;
        const client_secret = config.CLIENT_SECRET;
        const redirect_uris = ['http://localhost'];

        if (!client_id || !client_secret) {
            throw new Error("CLIENT_ID ou CLIENT_SECRET manquant dans .env");
        }

        const tokenPath = path.join(__dirname, 'token.json');
        if (!fs.existsSync(tokenPath)) {
            throw new Error("❌ token.json introuvable à : " + tokenPath);
        }

        const token = JSON.parse(fs.readFileSync(tokenPath));

        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token);

        return oAuth2Client;
    } catch (err) {
        log.error('❌ Erreur dans getAuth :', err.message);
        throw err; // Important de relancer l'erreur pour qu’elle soit catchée plus haut
    }
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
        // icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(app.getAppPath(), "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // ✅ indispensable
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
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('stop-all-chronos');
        }
    });

    powerMonitor.on('lock-screen', () => {
        // log.info('🔒 Écran verrouillé');
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('stop-all-chronos');
        }
    });

    powerMonitor.on('unlock-screen', () => {
        log.info('🔓 Écran déverrouillé');
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('notify-unlock-reminder');
        }
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        const isCmdOrCtrlW = (input.key.toLowerCase() === 'w') && (input.control || input.meta);
        if (isCmdOrCtrlW) {
            event.preventDefault(); // 🔥 empêche la fermeture
            console.log('❌ Ctrl+W ou Cmd+W bloqué via before-input-event');
        }
    });
    setupGitCommitListener();

    // mainWindow.webContents.once('did-finish-load', async () => {
    //     await loadProjectsWithHeaderChecks(); // ✅ ici, le renderer est prêt à écouter
    // });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const quitPrompt = (e) => {
    if (e) e.preventDefault();

    if (hasActiveTimer) {
        const { dialog } = require('electron');
        const choice = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Annuler', 'Quitter quand même'],
            defaultId: 0,
            cancelId: 0,
            title: 'Chrono actif',
            message: 'Un chrono est en cours. Êtes-vous sûr de vouloir quitter ?'
        });

        if (choice === 1) {
            hasActiveTimer = false; // on laisse passer la prochaine fois
            app.quit(); // relance volontairement le quit
        }
    } else {
        app.quit();
    }
}

app.on('before-quit', quitPrompt);
ipcMain.on('close-window', () => {
    quitPrompt();
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

        // log.info('✅ Données ajoutées avec succès');
        event.reply('append-to-sheet-success');
    } catch (err) {
        console.error('❌ Erreur ajout Google Sheet:', err);
    }
});

ipcMain.on('open-external-url', (event, url) => {
    shell.openExternal(url);
});

// async function checkProjectSheetHeaders(project) {
//     try {
//         const auth = getAuth();
//         const sheets = google.sheets({ version: 'v4', auth });
//         const res = await sheets.spreadsheets.values.get({
//             spreadsheetId: project.spreadsheetId,
//             range: `${project.sheetName}!A1:F1`,
//         });

//         const headers = res.data.values?.[0] || [];
//         const expected = [
//             "Objet",
//             "Tracker",
//             "Personne",
//             "Date",
//             "Temps passé",
//             "Temps décompté",
//         ];

//         const isValid = expected.every((col, i) => col === headers[i]);

//         return { ...project, hasHeaderIssue: !isValid };
//     } catch (e) {
//         console.warn(`⚠️ Erreur sur ${project.nomProjet} :`, e.message);
//         log.error(`❌ Erreur checkProjectSheetHeaders pour ${project.nomProjet} :`, e.message);
//         return { ...project, hasHeaderIssue: true };
//     }
// }

// // async function loadProjectsWithHeaderChecks() {
// //     const raw = fs.readFileSync(path.join(__dirname, 'projet.json'), 'utf8');
// //     const projects = JSON.parse(raw);

// //     // Affiche tous les projets dans la liste avec un état "en cours"
// //     projects.forEach((project) => {
// //         allProjectList.push({ ...project, isLoading: true, hasHeaderIssue: false });
// //     });

// //     const checked = [];

// //     for (let index = 0; index < projects.length; index++) {
// //         const project = projects[index];

// //         const result = await checkProjectSheetHeaders(project);
// //         checked.push(result);

// //         // Ensuite on envoie le résultat final
// //         mainWindow?.webContents.send("project-status", {
// //             ...result,
// //             isLoading: false
// //         });

// //         await delay(200);
// //     }

// //     checkedProjectList = checked;
// //     mainWindow.webContents.send('app-loaded');
// // }

// ipcMain.handle('get-projects', () => {
//     return allProjectList;
// });

// ipcMain.handle('get-checked-projects', () => {
//     return checkedProjectList;
// });

const auth = getAuth();
const sheets = google.sheets({ version: 'v4', auth });

ipcMain.handle('check-sheet-headers', async (event, spreadsheetId, sheetName) => {
    console.log('Checking sheet headers for', spreadsheetId, sheetName)
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:F1`,
    });

    const expected = ["Objet", "Tracker", "Personne", "Date", "Temps passé", "Temps décompté"];
    const headers = res.data.values?.[0] || [];
    return expected.every((col, i) => col === headers[i]);
});



ipcMain.handle('read-file', async (event, relativePath) => {
    try {
        const filePath = path.join(app.getAppPath(), relativePath);
        const content = fs.readFileSync(filePath, 'utf8');
        return content;
    } catch (err) {
        console.error(`❌ Erreur lecture fichier "${relativePath}" :`, err.message);
        throw new Error(`Impossible de lire ${relativePath}`);
    }
});

ipcMain.on('update-timer-status', (event, status) => {
    hasActiveTimer = status;
});  