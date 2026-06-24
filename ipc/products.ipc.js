const { ipcMain, dialog, BrowserWindow } = require('electron');
const productsService = require('../services/products.service');
const i18nService = require('../services/i18n.service');

function fenetreDe(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function enregistrer() {
  ipcMain.handle('products:lister', () => {
    return productsService.lister();
  });

  ipcMain.handle('products:rechercher', (event, criteres) => {
    return productsService.rechercher(criteres);
  });

  ipcMain.handle('products:trouver', (event, id) => {
    return productsService.trouverParId(id);
  });

  ipcMain.handle('products:ajouter', (event, donnees) => {
    return productsService.ajouter(donnees);
  });

  ipcMain.handle('products:modifier', (event, id, donnees) => {
    return productsService.modifier(id, donnees);
  });

  ipcMain.handle('products:supprimer', async (event, id) => {
    const produit = productsService.trouverParId(id);
    if (!produit) return false;

    const { response } = await dialog.showMessageBox(fenetreDe(event), {
      type: 'warning',
      buttons: [i18nService.t('dialog.bouton_annuler'), i18nService.t('dialog.bouton_supprimer')],
      defaultId: 0,
      cancelId: 0,
      message: i18nService.t('dialog.supprimer_produit_message'),
      detail: i18nService.t('dialog.supprimer_produit_detail', {
        nom: produit.nom,
        prix: `${produit.prix.toFixed(2)} EUR`
      })
    });

    if (response !== 1) return false;
    return productsService.supprimer(id);
  });
}

module.exports = { enregistrer };
