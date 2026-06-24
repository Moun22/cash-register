const test = require('node:test');
const assert = require('node:assert/strict');

const { echapperCSV, ligneCSV, genererCSV } = require('../services/export.service');

test('echapperCSV : valeur simple', () => {
  assert.equal(echapperCSV('Pomme'), 'Pomme');
});

test('echapperCSV : nombre', () => {
  assert.equal(echapperCSV(3.5), '3.5');
});

test('echapperCSV : null devient vide', () => {
  assert.equal(echapperCSV(null), '');
});

test('echapperCSV : virgule echappee avec guillemets', () => {
  assert.equal(echapperCSV('a, b'), '"a, b"');
});

test('echapperCSV : guillemets doubles', () => {
  assert.equal(echapperCSV('say "hi"'), '"say ""hi"""');
});

test('echapperCSV : saut de ligne echappe', () => {
  assert.equal(echapperCSV('ligne1\nligne2'), '"ligne1\nligne2"');
});

test('ligneCSV : assemblage', () => {
  assert.equal(ligneCSV(1, 'Pomme', 1.5), '1,Pomme,1.5');
});

test('ligneCSV : avec valeur a echapper', () => {
  assert.equal(ligneCSV(1, 'a, b', 2), '1,"a, b",2');
});

test('genererCSV : entete uniquement si vide', () => {
  const csv = genererCSV([], new Map());
  assert.equal(csv, 'Vente ID,Date,Produit,Quantite,Prix unitaire,Sous-total');
});

test('genererCSV : une vente avec lignes', () => {
  const ventes = [
    { id: 1, date_iso: '2026-06-23T10:00:00.000Z', total: 5.50 }
  ];
  const lignes = new Map([
    [1, [
      { nom_snapshot: 'Pomme', quantite: 2, prix_unitaire: 1.50 },
      { nom_snapshot: 'Pain', quantite: 1, prix_unitaire: 2.50 }
    ]]
  ]);

  const csv = genererCSV(ventes, lignes);
  const lignesCSV = csv.split('\n');

  assert.equal(lignesCSV.length, 3);
  assert.ok(lignesCSV[1].includes('Pomme'));
  assert.ok(lignesCSV[1].includes('1.50'));
  assert.ok(lignesCSV[2].includes('Pain'));
});

test('genererCSV : vente sans lignes (place-holder)', () => {
  const ventes = [{ id: 5, date_iso: '2026-06-23T10:00:00.000Z', total: 0 }];
  const csv = genererCSV(ventes, new Map());
  const lignesCSV = csv.split('\n');
  assert.equal(lignesCSV.length, 2);
  assert.ok(lignesCSV[1].includes('(aucune ligne)'));
});

test('genererCSV : nom avec virgule echappe', () => {
  const ventes = [{ id: 1, date_iso: '2026-06-23T10:00:00.000Z', total: 3 }];
  const lignes = new Map([
    [1, [{ nom_snapshot: 'Pomme, golden', quantite: 1, prix_unitaire: 3 }]]
  ]);
  const csv = genererCSV(ventes, lignes);
  assert.ok(csv.includes('"Pomme, golden"'));
});
