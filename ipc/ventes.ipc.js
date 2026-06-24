const { ipcMain, Notification } = require('electron');
const ventesService = require('../services/ventes.service');
const windowManager = require('../window-manager');

function enregistrer() {
  ipcMain.handle('ventes:enregistrer', (event, panier) => {
    const resultat = ventesService.enregistrerVente(panier);

    if (resultat.ok) {
      new Notification({
        title: 'Vente enregistree',
        body: `#${resultat.venteId} : ${resultat.total.toFixed(2)} EUR`
      }).show();

      windowManager.broadcast('data:ventes-changed');
    }

    return resultat;
  });
}

module.exports = { enregistrer };
