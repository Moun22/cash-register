const { ipcMain, dialog, BrowserWindow, shell } = require('electron');
const fs = require('fs');

const openfoodfactsService = require('../services/openfoodfacts.service');
const ventesService = require('../services/ventes.service');
const exportService = require('../services/export.service');

function fenetreDe(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function chargerVentesAvecLignes(filtres) {
  const ventes = ventesService.lister(filtres);
  const lignesParVente = new Map();
  for (const v of ventes) {
    lignesParVente.set(v.id, ventesService.listerLignes(v.id));
  }
  return { ventes, lignesParVente };
}

async function avertirAucuneVente(fenetre) {
  await dialog.showMessageBox(fenetre, {
    type: 'info',
    title: 'Rien a exporter',
    message: 'Aucune vente dans la periode selectionnee.',
    detail: 'Modifiez les filtres ou ajoutez des ventes avant d\'exporter.'
  });
}

function enregistrer() {
  ipcMain.handle('openfoodfacts:lookup', (event, codeBarres) => {
    return openfoodfactsService.lookup(codeBarres);
  });

  ipcMain.handle('systeme:exporter-csv', async (event, filtres) => {
    const fenetre = fenetreDe(event);
    const { ventes, lignesParVente } = chargerVentesAvecLignes(filtres);

    if (ventes.length === 0) {
      await avertirAucuneVente(fenetre);
      return false;
    }

    const { filePath, canceled } = await dialog.showSaveDialog(fenetre, {
      title: 'Exporter les ventes en CSV',
      defaultPath: `ventes-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (canceled || !filePath) return false;

    const contenu = exportService.genererCSV(ventes, lignesParVente);
    fs.writeFileSync(filePath, contenu, 'utf-8');
    shell.showItemInFolder(filePath);
    return true;
  });

  ipcMain.handle('systeme:exporter-pdf', async (event, filtres) => {
    const fenetre = fenetreDe(event);
    const { ventes, lignesParVente } = chargerVentesAvecLignes(filtres);

    if (ventes.length === 0) {
      await avertirAucuneVente(fenetre);
      return false;
    }

    const { filePath, canceled } = await dialog.showSaveDialog(fenetre, {
      title: 'Exporter les ventes en PDF',
      defaultPath: `rapport-ventes-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return false;

    const buffer = await exportService.genererPDF(ventes, lignesParVente, filtres);
    fs.writeFileSync(filePath, buffer);
    shell.showItemInFolder(filePath);
    return true;
  });
}

module.exports = { enregistrer };
