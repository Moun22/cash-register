const { app, BrowserWindow } = require('electron');
const path = require('path');

const db = require('./services/db');
const productsIPC = require('./ipc/products.ipc');

if (process.platform === 'win32') {
  app.setAppUserModelId('com.cashregister.app');
}

let fenetrePrincipale = null;

function creerFenetre() {
  fenetrePrincipale = new BrowserWindow({
    width: 1200,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  fenetrePrincipale.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  fenetrePrincipale.on('closed', () => {
    fenetrePrincipale = null;
  });
}

app.whenReady().then(() => {
  db.init();
  productsIPC.enregistrer();
  creerFenetre();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  db.fermer();
});
