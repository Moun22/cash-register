const { BrowserWindow } = require('electron');
const path = require('path');

let fenetrePrincipale = null;

function creerFenetrePrincipale() {
  fenetrePrincipale = new BrowserWindow({
    width: 1200,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  fenetrePrincipale.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  fenetrePrincipale.on('closed', () => {
    fenetrePrincipale = null;
  });

  return fenetrePrincipale;
}

function broadcast(canal, ...args) {
  if (fenetrePrincipale && !fenetrePrincipale.isDestroyed()) {
    fenetrePrincipale.webContents.send(canal, ...args);
  }
}

module.exports = { creerFenetrePrincipale, broadcast };
