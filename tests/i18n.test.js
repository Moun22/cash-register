const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const i18nService = require('../services/i18n.service');

test('init charge fr et en sans erreur', () => {
  i18nService.init();
  const fr = i18nService.obtenirDictionnaire('fr');
  const en = i18nService.obtenirDictionnaire('en');
  assert.ok(fr && typeof fr === 'object');
  assert.ok(en && typeof en === 'object');
  assert.equal(typeof fr.app.nom, 'string');
  assert.equal(typeof en.app.nom, 'string');
});

test('traduire : cle simple', () => {
  const dict = { hello: 'Bonjour' };
  assert.equal(i18nService.traduire(dict, 'hello'), 'Bonjour');
});

test('traduire : cle nestee a.b.c', () => {
  const dict = { a: { b: { c: 'valeur' } } };
  assert.equal(i18nService.traduire(dict, 'a.b.c'), 'valeur');
});

test('traduire : cle manquante renvoie la cle elle-meme', () => {
  const dict = { a: 'x' };
  assert.equal(i18nService.traduire(dict, 'b'), 'b');
  assert.equal(i18nService.traduire(dict, 'a.b.c'), 'a.b.c');
});

test('traduire : interpolation de parametres', () => {
  const dict = { hi: 'Bonjour {nom}' };
  assert.equal(i18nService.traduire(dict, 'hi', { nom: 'Mounir' }), 'Bonjour Mounir');
});

test('traduire : multi-parametres', () => {
  const dict = { msg: 'Vente #{id} : {total}' };
  assert.equal(
    i18nService.traduire(dict, 'msg', { id: 7, total: '12.50 EUR' }),
    'Vente #7 : 12.50 EUR'
  );
});

test('traduire : parametre manquant garde le placeholder', () => {
  const dict = { hi: 'Bonjour {nom}' };
  assert.equal(i18nService.traduire(dict, 'hi', {}), 'Bonjour {nom}');
});

test('traduire : dictionnaire vide', () => {
  assert.equal(i18nService.traduire({}, 'a.b'), 'a.b');
});

test('definirLangue change langue courante et t() suit', () => {
  i18nService.init();
  i18nService.definirLangue('fr');
  assert.equal(i18nService.t('onglets.caisse'), 'Caisse');
  i18nService.definirLangue('en');
  assert.equal(i18nService.t('onglets.caisse'), 'Checkout');
});

test('definirLangue ignore une langue inconnue', () => {
  i18nService.init();
  i18nService.definirLangue('fr');
  i18nService.definirLangue('zz');
  assert.equal(i18nService.obtenirLangue(), 'fr');
});

test('cles fr et en : meme structure', () => {
  i18nService.init();
  const fr = i18nService.obtenirDictionnaire('fr');
  const en = i18nService.obtenirDictionnaire('en');
  const clesRecursif = (obj, prefix = '') => {
    const cles = [];
    for (const k of Object.keys(obj).sort()) {
      const chemin = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        cles.push(...clesRecursif(obj[k], chemin));
      } else {
        cles.push(chemin);
      }
    }
    return cles;
  };
  assert.deepEqual(clesRecursif(fr), clesRecursif(en),
    'Les cles fr et en doivent etre identiques');
});
