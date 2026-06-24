const { ipcMain } = require('electron');
const preferencesService = require('../services/preferences.service');
const i18nService = require('../services/i18n.service');
const menuService = require('../services/menu.service');

function enregistrer() {
  ipcMain.handle('preferences:obtenir', () => {
    return preferencesService.obtenirToutes();
  });

  ipcMain.handle('preferences:definir', (event, cle, valeur) => {
    preferencesService.definir(cle, valeur);
    if (cle === 'langue') {
      i18nService.definirLangue(valeur);
      menuService.appliquerMenu();
    }
    return true;
  });

  ipcMain.handle('preferences:obtenir-dictionnaire', (event, langue) => {
    return i18nService.obtenirDictionnaire(langue);
  });
}

module.exports = { enregistrer };
