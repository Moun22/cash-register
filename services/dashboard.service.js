const db = require('./db');

function debutDeJour(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function debutJourSuivant(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function chiffreAffaireEntre(debut, fin) {
  const r = db.obtenir().prepare(`
    SELECT COALESCE(SUM(total), 0) AS total
    FROM ventes
    WHERE date_iso >= ? AND date_iso < ?
  `).get(debut, fin);
  return r.total;
}

function nombreVentesEntre(debut, fin) {
  const r = db.obtenir().prepare(`
    SELECT COUNT(*) AS n
    FROM ventes
    WHERE date_iso >= ? AND date_iso < ?
  `).get(debut, fin);
  return r.n;
}

function bestsellersDepuis(debut, limit = 5) {
  return db.obtenir().prepare(`
    SELECT
      nom_snapshot,
      SUM(quantite) AS quantite,
      SUM(prix_unitaire * quantite) AS chiffre_affaire
    FROM vente_lignes
    WHERE vente_id IN (SELECT id FROM ventes WHERE date_iso >= ?)
    GROUP BY nom_snapshot
    ORDER BY quantite DESC, chiffre_affaire DESC
    LIMIT ?
  `).all(debut, limit);
}

function calculerEvolutionPourcent(ancien, nouveau) {
  if (ancien === 0) return null;
  return Math.round(((nouveau - ancien) / ancien) * 100);
}

function resume() {
  const jourDebut = debutDeJour();
  const jourFin = debutJourSuivant();

  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  const hierDebut = debutDeJour(hier);
  const hierFin = jourDebut;

  const semaine = new Date();
  semaine.setDate(semaine.getDate() - 7);
  const semaineDebut = debutDeJour(semaine);

  const caJour = chiffreAffaireEntre(jourDebut, jourFin);
  const nbVentesJour = nombreVentesEntre(jourDebut, jourFin);
  const caHier = chiffreAffaireEntre(hierDebut, hierFin);
  const evolutionPourcent = calculerEvolutionPourcent(caHier, caJour);
  const bestsellers = bestsellersDepuis(semaineDebut, 5);

  return {
    caJour,
    nbVentesJour,
    caHier,
    evolutionPourcent,
    bestsellers
  };
}

module.exports = {
  resume,
  chiffreAffaireEntre,
  nombreVentesEntre,
  bestsellersDepuis,
  calculerEvolutionPourcent,
  debutDeJour,
  debutJourSuivant
};
