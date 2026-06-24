const db = require('./db');

const VALEURS_PAR_DEFAUT = {
  langue: 'fr',
  theme: 'clair'
};

function obtenir(cle) {
  const r = db.obtenir().prepare('SELECT valeur FROM preferences WHERE cle = ?').get(cle);
  return r ? r.valeur : null;
}

function definir(cle, valeur) {
  db.obtenir().prepare(`
    INSERT INTO preferences (cle, valeur) VALUES (?, ?)
    ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur
  `).run(cle, String(valeur));
}

function obtenirAvecDefaut(cle) {
  return obtenir(cle) ?? VALEURS_PAR_DEFAUT[cle] ?? null;
}

function obtenirToutes() {
  return {
    langue: obtenirAvecDefaut('langue'),
    theme: obtenirAvecDefaut('theme')
  };
}

module.exports = { obtenir, definir, obtenirAvecDefaut, obtenirToutes };
