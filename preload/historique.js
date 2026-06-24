const { ipcRenderer } = require('electron');

module.exports = {
  lister: (filtres) => ipcRenderer.invoke('historique:lister', filtres),
  trouver: (id) => ipcRenderer.invoke('historique:trouver', id),
  listerLignes: (venteId) => ipcRenderer.invoke('historique:lister-lignes', venteId)
};
