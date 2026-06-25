const { ipcRenderer } = require('electron');

module.exports = {
  resume: () => ipcRenderer.invoke('dashboard:resume')
};
