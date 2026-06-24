const { ipcMain, dialog, BrowserWindow, shell } = require('electron');
const fs = require('fs');

const openfoodfactsService = require('../services/openfoodfacts.service');
const ventesService = require('../services/ventes.service');
const exportService = require('../services/export.service');
const i18nService = require('../services/i18n.service');

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
    title: i18nService.t('dialog.rien_a_exporter_titre'),
    message: i18nService.t('dialog.rien_a_exporter_message'),
    detail: i18nService.t('dialog.rien_a_exporter_detail')
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
      title: i18nService.t('historique.exporter_csv'),
      defaultPath: `ventes-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (canceled || !filePath) return false;

    const contenu = exportService.genererCSV(ventes, lignesParVente, i18nService);
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
      title: i18nService.t('historique.exporter_pdf'),
      defaultPath: `rapport-ventes-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return false;

    const buffer = await exportService.genererPDF(ventes, lignesParVente, filtres, i18nService);
    fs.writeFileSync(filePath, buffer);
    shell.showItemInFolder(filePath);
    return true;
  });
}

module.exports = { enregistrer };
