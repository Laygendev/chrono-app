const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (...args) => ipcRenderer.send(...args),
    on: (...args) => ipcRenderer.on(...args),
    once: (...args) => ipcRenderer.once(...args),
    removeListener: (...args) => ipcRenderer.removeListener(...args),
    invoke: (...args) => ipcRenderer.invoke(...args)
  },
  getTodaysCommits: () => ipcRenderer.invoke('get-todays-commits'),
  getProjectsWithChecks: () => ipcRenderer.invoke('get-projects-with-checks'),
  getProjects: () => ipcRenderer.invoke('get-projects')
});
