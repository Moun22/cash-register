const { ipcMain, dialog, BrowserWindow } = require('electron');
const productsService = require('../services/products.service');

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
      buttons: ['Annuler', 'Supprimer'],
      defaultId: 0,
      cancelId: 0,
      message: 'Supprimer ce produit ?',
      detail: `${produit.nom} (${produit.prix.toFixed(2)} EUR)\nL'historique des ventes sera conserve.`
    });

    if (response !== 1) return false;
    return productsService.supprimer(id);
  });
}

module.exports = { enregistrer };
