const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const db = require('./db');

function cheminBdd() {
  return path.join(app.getPath('userData'), 'cash-register.db');
}

function sauvegarder(destinationPath) {
  fs.copyFileSync(cheminBdd(), destinationPath);
}

function restaurer(sourcePath) {
  db.fermer();

  const cible = cheminBdd();
  for (const suffixe of ['', '-wal', '-shm']) {
    const fichier = `${cible}${suffixe}`;
    if (fs.existsSync(fichier)) fs.unlinkSync(fichier);
  }

  fs.copyFileSync(sourcePath, cible);
}

module.exports = { sauvegarder, restaurer, cheminBdd };
