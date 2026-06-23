const db = require('./db');
const { validerProduit } = require('./validation');

function lister() {
  return db.obtenir().prepare('SELECT * FROM products ORDER BY nom ASC').all();
}

function rechercher({ texte = '' } = {}) {
  const motif = texte.trim();
  if (!motif) return lister();

  const like = `%${motif}%`;
  return db.obtenir().prepare(`
    SELECT * FROM products
    WHERE nom LIKE ? OR code_barres LIKE ? OR description LIKE ?
    ORDER BY nom ASC
  `).all(like, like, like);
}

function trouverParId(id) {
  return db.obtenir().prepare('SELECT * FROM products WHERE id = ?').get(id) || null;
}

function trouverParCodeBarres(codeBarres) {
  return db.obtenir()
    .prepare('SELECT * FROM products WHERE code_barres = ?')
    .get(codeBarres) || null;
}

function ajouter(donnees) {
  const v = validerProduit(donnees);
  if (!v.valide) return { ok: false, erreurs: v.erreurs };

  const codeBarres = donnees.code_barres ? String(donnees.code_barres).trim() : null;

  if (codeBarres && trouverParCodeBarres(codeBarres)) {
    return { ok: false, erreurs: ['Un produit avec ce code-barres existe deja.'] };
  }

  const resultat = db.obtenir().prepare(`
    INSERT INTO products (code_barres, nom, prix, description, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    codeBarres,
    donnees.nom.trim(),
    Number(donnees.prix),
    donnees.description ? String(donnees.description).trim() : null,
    donnees.source || 'manuel'
  );

  return { ok: true, product: trouverParId(resultat.lastInsertRowid) };
}

function modifier(id, donnees) {
  const v = validerProduit(donnees);
  if (!v.valide) return { ok: false, erreurs: v.erreurs };

  const codeBarres = donnees.code_barres ? String(donnees.code_barres).trim() : null;

  if (codeBarres) {
    const autre = trouverParCodeBarres(codeBarres);
    if (autre && autre.id !== id) {
      return { ok: false, erreurs: ['Un autre produit utilise deja ce code-barres.'] };
    }
  }

  const resultat = db.obtenir().prepare(`
    UPDATE products
    SET nom = ?, prix = ?, description = ?, code_barres = ?
    WHERE id = ?
  `).run(
    donnees.nom.trim(),
    Number(donnees.prix),
    donnees.description ? String(donnees.description).trim() : null,
    codeBarres,
    id
  );

  if (resultat.changes === 0) return { ok: false, erreurs: ['Produit introuvable.'] };
  return { ok: true, product: trouverParId(id) };
}

function supprimer(id) {
  const resultat = db.obtenir().prepare('DELETE FROM products WHERE id = ?').run(id);
  return resultat.changes > 0;
}

module.exports = {
  lister,
  rechercher,
  trouverParId,
  trouverParCodeBarres,
  ajouter,
  modifier,
  supprimer
};
