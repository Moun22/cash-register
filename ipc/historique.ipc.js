const { ipcMain } = require('electron');
const ventesService = require('../services/ventes.service');

function enregistrer() {
  ipcMain.handle('historique:lister', (event, filtres) => {
    return ventesService.lister(filtres);
  });

  ipcMain.handle('historique:trouver', (event, id) => {
    return ventesService.trouver(id);
  });

  ipcMain.handle('historique:lister-lignes', (event, venteId) => {
    return ventesService.listerLignes(venteId);
  });
}

module.exports = { enregistrer };
