const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (...args) => ipcRenderer.send(...args),
    on: (...args) => ipcRenderer.on(...args),
    once: (...args) => ipcRenderer.once(...args),
    removeListener: (...args) => ipcRenderer.removeListener(...args),
    invoke: (...args) => ipcRenderer.invoke(...args)
  },
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    clear: () => ipcRenderer.invoke('store:clear'),
  },
  getTodaysCommits: () => ipcRenderer.invoke('get-todays-commits'),
  getGoogleAuth: () => ipcRenderer.invoke('get-auth'),
  getGoogleSheetsClient: (auth) => require('googleapis').google.sheets({ version: 'v4', auth }),
  readFile: (relativePath) => ipcRenderer.invoke('read-file', relativePath),
  checkSheetHeaders: (spreadsheetId, sheetName) =>
    ipcRenderer.invoke('check-sheet-headers', spreadsheetId, sheetName)
});
