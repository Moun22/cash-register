const { ipcRenderer } = require('electron');

module.exports = {
  enregistrerVente: (panier) => ipcRenderer.invoke('ventes:enregistrer', panier)
};
