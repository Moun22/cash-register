const { ipcMain } = require('electron');
const openfoodfactsService = require('../services/openfoodfacts.service');

function enregistrer() {
  ipcMain.handle('openfoodfacts:lookup', (event, codeBarres) => {
    return openfoodfactsService.lookup(codeBarres);
  });
}

module.exports = { enregistrer };
