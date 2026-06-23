const { ipcMain, Notification } = require('electron');
const ventesService = require('../services/ventes.service');

function enregistrer() {
  ipcMain.handle('ventes:enregistrer', (event, panier) => {
    const resultat = ventesService.enregistrerVente(panier);

    if (resultat.ok) {
      new Notification({
        title: 'Vente enregistree',
        body: `#${resultat.venteId} : ${resultat.total.toFixed(2)} EUR`
      }).show();
    }

    return resultat;
  });
}

module.exports = { enregistrer };
