const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

let connexion = null;

function init() {
  const chemin = path.join(app.getPath('userData'), 'cash-register.db');
  connexion = new Database(chemin);
  connexion.pragma('foreign_keys = ON');
  connexion.pragma('journal_mode = WAL');

  connexion.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code_barres TEXT    UNIQUE,
      nom         TEXT    NOT NULL,
      prix        REAL    NOT NULL,
      description TEXT,
      source      TEXT    NOT NULL DEFAULT 'manuel'
    );

    CREATE TABLE IF NOT EXISTS ventes (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      date_iso TEXT    NOT NULL,
      total    REAL    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vente_lignes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      vente_id      INTEGER NOT NULL,
      product_id    INTEGER,
      nom_snapshot  TEXT    NOT NULL,
      prix_unitaire REAL    NOT NULL,
      quantite      INTEGER NOT NULL,
      FOREIGN KEY (vente_id)   REFERENCES ventes(id)   ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS preferences (
      cle    TEXT PRIMARY KEY,
      valeur TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_nom         ON products(nom);
    CREATE INDEX IF NOT EXISTS idx_products_code_barres ON products(code_barres);
    CREATE INDEX IF NOT EXISTS idx_ventes_date          ON ventes(date_iso);
    CREATE INDEX IF NOT EXISTS idx_lignes_vente         ON vente_lignes(vente_id);
  `);
}

function obtenir() {
  return connexion;
}

function fermer() {
  if (connexion) {
    connexion.close();
    connexion = null;
  }
}

module.exports = { init, obtenir, fermer };
