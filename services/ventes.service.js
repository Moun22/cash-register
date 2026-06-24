const db = require('./db');
const { validerVente, calculerTotal } = require('./validation');

function enregistrerVente(panier) {
  const v = validerVente(panier);
  if (!v.valide) return { ok: false, erreurs: v.erreurs };

  const total = calculerTotal(panier);
  const dateIso = new Date().toISOString();
  const base = db.obtenir();

  const insererVente = base.prepare('INSERT INTO ventes (date_iso, total) VALUES (?, ?)');
  const insererLigne = base.prepare(`
    INSERT INTO vente_lignes (vente_id, product_id, nom_snapshot, prix_unitaire, quantite)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = base.transaction((lignes) => {
    const resultat = insererVente.run(dateIso, total);
    const venteId = resultat.lastInsertRowid;

    for (const l of lignes) {
      insererLigne.run(
        venteId,
        l.product_id ?? null,
        l.nom_snapshot,
        Number(l.prix_unitaire),
        Number(l.quantite)
      );
    }

    return venteId;
  });

  const venteId = transaction(panier);
  return { ok: true, venteId, total, date: dateIso };
}

function lister({ dateDebut, dateFin } = {}) {
  const conditions = [];
  const params = [];

  if (dateDebut) {
    conditions.push('v.date_iso >= ?');
    params.push(dateDebut);
  }

  if (dateFin) {
    const lendemain = new Date(dateFin);
    lendemain.setDate(lendemain.getDate() + 1);
    conditions.push('v.date_iso < ?');
    params.push(lendemain.toISOString().slice(0, 10));
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.obtenir().prepare(`
    SELECT v.id, v.date_iso, v.total,
           COALESCE(SUM(l.quantite), 0) AS nb_articles
    FROM ventes v
    LEFT JOIN vente_lignes l ON l.vente_id = v.id
    ${where}
    GROUP BY v.id
    ORDER BY v.date_iso DESC
  `).all(...params);
}

function trouver(id) {
  return db.obtenir().prepare('SELECT * FROM ventes WHERE id = ?').get(id) || null;
}

function listerLignes(venteId) {
  return db.obtenir()
    .prepare('SELECT * FROM vente_lignes WHERE vente_id = ? ORDER BY id ASC')
    .all(venteId);
}

module.exports = { enregistrerVente, lister, trouver, listerLignes };
