const { ipcMain, dialog, BrowserWindow, shell, app } = require('electron');
const fs = require('fs');

const openfoodfactsService = require('../services/openfoodfacts.service');
const ventesService = require('../services/ventes.service');
const exportService = require('../services/export.service');
const backupService = require('../services/backup.service');
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

  ipcMain.handle('systeme:exporter-ticket', async (event, idVente) => {
    const vente = ventesService.trouver(idVente);
    if (!vente) return false;

    const lignes = ventesService.listerLignes(idVente);
    const fenetre = fenetreDe(event);

    const { filePath, canceled } = await dialog.showSaveDialog(fenetre, {
      title: i18nService.t('historique.bouton_ticket'),
      defaultPath: `ticket-vente-${vente.id}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return false;

    const buffer = await exportService.genererTicketPDF(vente, lignes, i18nService);
    fs.writeFileSync(filePath, buffer);
    shell.showItemInFolder(filePath);
    return true;
  });

  ipcMain.handle('systeme:sauvegarder', async (event) => {
    const fenetre = fenetreDe(event);
    const horodatage = new Date().toISOString().slice(0, 10);

    const { filePath, canceled } = await dialog.showSaveDialog(fenetre, {
      title: i18nService.t('dashboard.sauvegarder_bouton'),
      defaultPath: `cash-register-backup-${horodatage}.db`,
      filters: [{ name: 'SQLite', extensions: ['db'] }]
    });

    if (canceled || !filePath) return null;

    backupService.sauvegarder(filePath);
    shell.showItemInFolder(filePath);
    return filePath;
  });

  ipcMain.handle('systeme:restaurer', async (event) => {
    const fenetre = fenetreDe(event);

    const { filePaths, canceled } = await dialog.showOpenDialog(fenetre, {
      title: i18nService.t('dashboard.restaurer_bouton'),
      properties: ['openFile'],
      filters: [{ name: 'SQLite', extensions: ['db'] }]
    });

    if (canceled || filePaths.length === 0) return false;

    const { response } = await dialog.showMessageBox(fenetre, {
      type: 'warning',
      buttons: [
        i18nService.t('dialog.bouton_annuler'),
        i18nService.t('dashboard.restaurer_bouton_confirmer')
      ],
      defaultId: 0,
      cancelId: 0,
      message: i18nService.t('dashboard.restaurer_confirmer_message'),
      detail: i18nService.t('dashboard.restaurer_confirmer_detail')
    });

    if (response !== 1) return false;

    backupService.restaurer(filePaths[0]);
    app.relaunch();
    app.exit(0);
    return true;
  });
}

module.exports = { enregistrer };
