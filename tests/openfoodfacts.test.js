const test = require('node:test');
const assert = require('node:assert/strict');

const { extraireProduit } = require('../services/openfoodfacts.service');

test('extraireProduit : reponse nulle', () => {
  assert.equal(extraireProduit(null), null);
});

test('extraireProduit : reponse vide', () => {
  assert.equal(extraireProduit({}), null);
});

test('extraireProduit : status 0 (non trouve)', () => {
  assert.equal(extraireProduit({ status: 0 }), null);
});

test('extraireProduit : status 1 sans product', () => {
  assert.equal(extraireProduit({ status: 1 }), null);
});

test('extraireProduit : status 1 sans nom', () => {
  assert.equal(extraireProduit({ status: 1, product: {} }), null);
});

test('extraireProduit : product_name simple', () => {
  const r = extraireProduit({
    status: 1,
    product: { product_name: 'Nutella' }
  });
  assert.equal(r.nom, 'Nutella');
  assert.equal(r.description, null);
});

test('extraireProduit : product_name_fr prioritaire sur product_name', () => {
  const r = extraireProduit({
    status: 1,
    product: { product_name: 'Hazelnut Spread', product_name_fr: 'Pate a tartiner' }
  });
  assert.equal(r.nom, 'Pate a tartiner');
});

test('extraireProduit : description = brands + categories', () => {
  const r = extraireProduit({
    status: 1,
    product: {
      product_name: 'Nutella',
      brands: 'Ferrero',
      categories: 'Pates a tartiner'
    }
  });
  assert.equal(r.description, 'Ferrero : Pates a tartiner');
});

test('extraireProduit : description = brands seul', () => {
  const r = extraireProduit({
    status: 1,
    product: { product_name: 'Nutella', brands: 'Ferrero' }
  });
  assert.equal(r.description, 'Ferrero');
});

test('extraireProduit : trim du nom', () => {
  const r = extraireProduit({
    status: 1,
    product: { product_name: '  Nutella  ' }
  });
  assert.equal(r.nom, 'Nutella');
});
