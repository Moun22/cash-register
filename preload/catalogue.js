const { ipcRenderer } = require('electron');

module.exports = {
  lister: () => ipcRenderer.invoke('products:lister'),
  rechercher: (criteres) => ipcRenderer.invoke('products:rechercher', criteres),
  trouver: (id) => ipcRenderer.invoke('products:trouver', id),
  ajouter: (donnees) => ipcRenderer.invoke('products:ajouter', donnees),
  modifier: (id, donnees) => ipcRenderer.invoke('products:modifier', id, donnees),
  supprimer: (id) => ipcRenderer.invoke('products:supprimer', id)
};
