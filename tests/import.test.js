const test = require('node:test');
const assert = require('node:assert/strict');

const { parserLigneCSV, parserCSV } = require('../services/import.service');
const { calculerEvolutionPourcent } = require('../services/dashboard.service');

test('parserLigneCSV : ligne simple', () => {
  assert.deepEqual(parserLigneCSV('a,b,c'), ['a', 'b', 'c']);
});

test('parserLigneCSV : trim des champs', () => {
  assert.deepEqual(parserLigneCSV(' a , b , c '), ['a', 'b', 'c']);
});

test('parserLigneCSV : champ entre guillemets avec virgule', () => {
  assert.deepEqual(parserLigneCSV('a,"b,c",d'), ['a', 'b,c', 'd']);
});

test('parserLigneCSV : guillemets echappes ""', () => {
  assert.deepEqual(parserLigneCSV('a,"say ""hi""",c'), ['a', 'say "hi"', 'c']);
});

test('parserLigneCSV : champ vide', () => {
  assert.deepEqual(parserLigneCSV('a,,c'), ['a', '', 'c']);
});

test('parserCSV : entete + lignes', () => {
  const r = parserCSV('nom,prix\nPomme,1.5\nPain,3.0');
  assert.deepEqual(r.entete, ['nom', 'prix']);
  assert.deepEqual(r.data, [['Pomme', '1.5'], ['Pain', '3.0']]);
});

test('parserCSV : contenu vide', () => {
  const r = parserCSV('');
  assert.deepEqual(r.entete, []);
  assert.deepEqual(r.data, []);
});

test('parserCSV : ignore lignes vides', () => {
  const r = parserCSV('nom\nA\n\nB\n');
  assert.deepEqual(r.data, [['A'], ['B']]);
});

test('parserCSV : CRLF accepte', () => {
  const r = parserCSV('nom\r\nA\r\nB');
  assert.deepEqual(r.data, [['A'], ['B']]);
});

test('parserCSV : delimiteur point-virgule (Excel FR)', () => {
  const r = parserCSV('nom;prix\nPomme;1.5\nPain;3.0');
  assert.deepEqual(r.entete, ['nom', 'prix']);
  assert.deepEqual(r.data, [['Pomme', '1.5'], ['Pain', '3.0']]);
});

test('parserCSV : BOM UTF-8 retire', () => {
  const r = parserCSV('﻿nom,prix\nPomme,1.5');
  assert.deepEqual(r.entete, ['nom', 'prix']);
});

test('parserCSV : BOM + point-virgule combines', () => {
  const r = parserCSV('﻿code_barres;nom;prix\n123;Pomme;1.5');
  assert.deepEqual(r.entete, ['code_barres', 'nom', 'prix']);
  assert.deepEqual(r.data, [['123', 'Pomme', '1.5']]);
});

test('calculerEvolutionPourcent : ancien=0 retourne null', () => {
  assert.equal(calculerEvolutionPourcent(0, 100), null);
});

test('calculerEvolutionPourcent : meme valeur = 0%', () => {
  assert.equal(calculerEvolutionPourcent(100, 100), 0);
});

test('calculerEvolutionPourcent : croissance +50%', () => {
  assert.equal(calculerEvolutionPourcent(100, 150), 50);
});

test('calculerEvolutionPourcent : decroissance -25%', () => {
  assert.equal(calculerEvolutionPourcent(100, 75), -25);
});

test('calculerEvolutionPourcent : arrondi', () => {
  assert.equal(calculerEvolutionPourcent(3, 4), 33);
});
