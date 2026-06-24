const { ipcMain, Notification } = require('electron');
const ventesService = require('../services/ventes.service');
const i18nService = require('../services/i18n.service');
const windowManager = require('../window-manager');

function enregistrer() {
  ipcMain.handle('ventes:enregistrer', (event, panier) => {
    const resultat = ventesService.enregistrerVente(panier);

    if (resultat.ok) {
      new Notification({
        title: i18nService.t('notification.vente_titre'),
        body: i18nService.t('notification.vente_corps', {
          id: resultat.venteId,
          total: `${resultat.total.toFixed(2)} EUR`
        })
      }).show();

      windowManager.broadcast('data:ventes-changed');
    }

    return resultat;
  });
}

module.exports = { enregistrer };
