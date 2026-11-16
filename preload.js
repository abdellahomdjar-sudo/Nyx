const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nyx', {
  desktop: true,
  onMedia: (cb) => ipcRenderer.on('media', (_e, action) => cb(action)),
});
