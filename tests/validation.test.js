const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validerProduit,
  validerLigneVente,
  calculerTotal
} = require('../services/validation');

test('validerProduit - nom requis', () => {
  const r = validerProduit({ nom: '', prix: 5 });
  assert.equal(r.valide, false);
  assert.ok(r.erreurs.some((e) => e.toLowerCase().includes('nom')));
});

test('validerProduit - nom espaces seulement', () => {
  const r = validerProduit({ nom: '   ', prix: 5 });
  assert.equal(r.valide, false);
});

test('validerProduit - prix doit etre > 0', () => {
  const r = validerProduit({ nom: 'Pomme', prix: 0 });
  assert.equal(r.valide, false);
  assert.ok(r.erreurs.some((e) => e.toLowerCase().includes('prix')));
});

test('validerProduit - prix negatif refuse', () => {
  const r = validerProduit({ nom: 'Pomme', prix: -3 });
  assert.equal(r.valide, false);
});

test('validerProduit - prix non numerique refuse', () => {
  const r = validerProduit({ nom: 'Pomme', prix: 'abc' });
  assert.equal(r.valide, false);
});

test('validerProduit - succes sans code-barres', () => {
  const r = validerProduit({ nom: 'Pomme', prix: 1.5 });
  assert.equal(r.valide, true);
  assert.equal(r.erreurs.length, 0);
});

test('validerProduit - code-barres invalide (lettres)', () => {
  const r = validerProduit({ nom: 'Pomme', prix: 1.5, code_barres: '123abc' });
  assert.equal(r.valide, false);
});

test('validerProduit - code-barres valide', () => {
  const r = validerProduit({ nom: 'Nutella', prix: 4.5, code_barres: '3017620422003' });
  assert.equal(r.valide, true);
});

test('validerProduit - code-barres vide est ignore', () => {
  const r = validerProduit({ nom: 'Pomme', prix: 1.5, code_barres: '' });
  assert.equal(r.valide, true);
});

test('validerLigneVente - quantite > 0', () => {
  const r = validerLigneVente({ product_id: 1, quantite: 0, prix_unitaire: 2 });
  assert.equal(r.valide, false);
});

test('validerLigneVente - quantite entiere', () => {
  const r = validerLigneVente({ product_id: 1, quantite: 1.5, prix_unitaire: 2 });
  assert.equal(r.valide, false);
});

test('validerLigneVente - prix_unitaire >= 0', () => {
  const r = validerLigneVente({ product_id: 1, quantite: 2, prix_unitaire: -1 });
  assert.equal(r.valide, false);
});

test('validerLigneVente - product_id null accepte', () => {
  const r = validerLigneVente({ product_id: null, quantite: 1, prix_unitaire: 5 });
  assert.equal(r.valide, true);
});

test('validerLigneVente - succes', () => {
  const r = validerLigneVente({ product_id: 1, quantite: 3, prix_unitaire: 2.5 });
  assert.equal(r.valide, true);
});

test('calculerTotal - panier vide = 0', () => {
  assert.equal(calculerTotal([]), 0);
});

test('calculerTotal - somme correcte', () => {
  const total = calculerTotal([
    { prix_unitaire: 2.5, quantite: 3 },
    { prix_unitaire: 1.2, quantite: 2 }
  ]);
  assert.equal(total, 2.5 * 3 + 1.2 * 2);
});

test('calculerTotal - quantites de 0 ignorees', () => {
  const total = calculerTotal([
    { prix_unitaire: 5, quantite: 0 },
    { prix_unitaire: 3, quantite: 2 }
  ]);
  assert.equal(total, 6);
});
