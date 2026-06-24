const { ipcRenderer } = require('electron');

module.exports = {
  onVentesChanged: (callback) => ipcRenderer.on('data:ventes-changed', () => callback())
};
