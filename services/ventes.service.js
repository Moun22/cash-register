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

module.exports = { enregistrerVente };
