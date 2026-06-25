const { app, BrowserWindow } = require('electron');

const db = require('./services/db');
const i18nService = require('./services/i18n.service');
const preferencesService = require('./services/preferences.service');
const menuService = require('./services/menu.service');
const windowManager = require('./window-manager');

const productsIPC = require('./ipc/products.ipc');
const ventesIPC = require('./ipc/ventes.ipc');
const historiqueIPC = require('./ipc/historique.ipc');
const systemeIPC = require('./ipc/systeme.ipc');
const preferencesIPC = require('./ipc/preferences.ipc');
const dashboardIPC = require('./ipc/dashboard.ipc');

if (process.platform === 'win32') {
  app.setAppUserModelId('com.cashregister.app');
}

const verrouInstance = app.requestSingleInstanceLock();
if (!verrouInstance) {
  app.quit();
}

app.on('second-instance', () => {
  const fenetre = windowManager.obtenirFenetre();
  if (fenetre) {
    if (fenetre.isMinimized()) fenetre.restore();
    fenetre.focus();
  }
});

app.whenReady().then(() => {
  db.init();
  i18nService.init();
  i18nService.definirLangue(preferencesService.obtenirAvecDefaut('langue'));

  productsIPC.enregistrer();
  ventesIPC.enregistrer();
  historiqueIPC.enregistrer();
  systemeIPC.enregistrer();
  preferencesIPC.enregistrer();
  dashboardIPC.enregistrer();

  menuService.appliquerMenu();
  windowManager.creerFenetrePrincipale();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.creerFenetrePrincipale();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  db.fermer();
});
