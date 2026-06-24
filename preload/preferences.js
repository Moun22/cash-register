const { ipcRenderer } = require('electron');

module.exports = {
  obtenir: () => ipcRenderer.invoke('preferences:obtenir'),
  definir: (cle, valeur) => ipcRenderer.invoke('preferences:definir', cle, valeur),
  obtenirDictionnaire: (langue) => ipcRenderer.invoke('preferences:obtenir-dictionnaire', langue)
};
