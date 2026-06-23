function validerProduit({ nom, prix, code_barres } = {}) {
  const erreurs = [];

  if (!nom || typeof nom !== 'string' || !nom.trim()) {
    erreurs.push('Le nom est requis.');
  }

  const prixNum = Number(prix);
  if (!Number.isFinite(prixNum) || prixNum <= 0) {
    erreurs.push('Le prix doit etre un nombre strictement positif.');
  }

  if (code_barres !== undefined && code_barres !== null && code_barres !== '') {
    if (!/^[0-9]+$/.test(String(code_barres).trim())) {
      erreurs.push('Le code-barres ne doit contenir que des chiffres.');
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}

function validerLigneVente({ product_id, quantite, prix_unitaire } = {}) {
  const erreurs = [];

  if (product_id !== null && product_id !== undefined && !Number.isInteger(product_id)) {
    erreurs.push('product_id doit etre un entier ou null.');
  }

  const q = Number(quantite);
  if (!Number.isInteger(q) || q <= 0) {
    erreurs.push('La quantite doit etre un entier strictement positif.');
  }

  const p = Number(prix_unitaire);
  if (!Number.isFinite(p) || p < 0) {
    erreurs.push('Le prix unitaire doit etre un nombre positif ou nul.');
  }

  return { valide: erreurs.length === 0, erreurs };
}

function calculerTotal(lignes) {
  return lignes.reduce((somme, l) => somme + Number(l.prix_unitaire) * Number(l.quantite), 0);
}

function validerVente(panier) {
  if (!Array.isArray(panier) || panier.length === 0) {
    return { valide: false, erreurs: ['Le panier est vide.'] };
  }

  for (let i = 0; i < panier.length; i++) {
    const v = validerLigneVente(panier[i]);
    if (!v.valide) {
      return {
        valide: false,
        erreurs: v.erreurs.map((e) => `Ligne ${i + 1} : ${e}`)
      };
    }
    if (!panier[i].nom_snapshot || typeof panier[i].nom_snapshot !== 'string') {
      return { valide: false, erreurs: [`Ligne ${i + 1} : nom_snapshot manquant.`] };
    }
  }

  return { valide: true, erreurs: [] };
}

module.exports = { validerProduit, validerLigneVente, calculerTotal, validerVente };
