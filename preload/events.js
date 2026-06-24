const { ipcRenderer } = require('electron');

module.exports = {
  onVentesChanged: (callback) => ipcRenderer.on('data:ventes-changed', () => callback()),
  onMenuNouvelleVente: (callback) => ipcRenderer.on('menu:nouvelle-vente', () => callback()),
  onMenuNouveauProduit: (callback) => ipcRenderer.on('menu:nouveau-produit', () => callback())
};
