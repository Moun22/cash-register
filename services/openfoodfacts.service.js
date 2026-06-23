const db = require('./db');

const URL_BASE = 'https://world.openfoodfacts.org/api/v2/product/';
const CHAMPS = 'product_name,product_name_fr,brands,categories';
const TIMEOUT_MS = 5000;

function extraireProduit(reponse) {
  if (!reponse || reponse.status !== 1 || !reponse.product) return null;

  const p = reponse.product;
  const nom = (p.product_name_fr || p.product_name || '').trim();
  if (!nom) return null;

  const parties = [];
  if (p.brands) parties.push(String(p.brands).trim());
  if (p.categories) parties.push(String(p.categories).trim());

  return {
    nom,
    description: parties.length ? parties.join(' : ') : null
  };
}

function lireCache(codeBarres) {
  const ligne = db.obtenir()
    .prepare('SELECT nom, description FROM off_cache WHERE code_barres = ?')
    .get(codeBarres);
  return ligne || null;
}

function ecrireCache(codeBarres, produit) {
  db.obtenir().prepare(`
    INSERT OR REPLACE INTO off_cache (code_barres, nom, description, date_recuperation)
    VALUES (?, ?, ?, ?)
  `).run(codeBarres, produit.nom, produit.description || null, new Date().toISOString());
}

async function lookup(codeBarres) {
  const code = String(codeBarres || '').trim();
  if (!code) return { found: false, raison: 'code-barres vide' };

  const cache = lireCache(code);
  if (cache) {
    return { found: true, product: cache, source: 'cache' };
  }

  try {
    const url = `${URL_BASE}${encodeURIComponent(code)}.json?fields=${CHAMPS}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const reponse = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!reponse.ok) {
      return { found: false, raison: `HTTP ${reponse.status}` };
    }

    const json = await reponse.json();
    const produit = extraireProduit(json);

    if (!produit) {
      return { found: false, source: 'api' };
    }

    ecrireCache(code, produit);
    return { found: true, product: produit, source: 'api' };
  } catch (err) {
    return { found: false, offline: true, raison: err.message };
  }
}

module.exports = { lookup, extraireProduit };
