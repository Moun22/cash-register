const fs = require('fs');
const path = require('path');

const LANGUES_SUPPORTEES = ['fr', 'en'];
const LANGUE_DEFAUT = 'fr';

let dictionnaires = {};
let langueCourante = LANGUE_DEFAUT;

function init() {
  for (const lang of LANGUES_SUPPORTEES) {
    const chemin = path.join(__dirname, '..', 'locales', `${lang}.json`);
    dictionnaires[lang] = JSON.parse(fs.readFileSync(chemin, 'utf-8'));
  }
}

function definirLangue(langue) {
  if (LANGUES_SUPPORTEES.includes(langue)) {
    langueCourante = langue;
  }
}

function obtenirLangue() {
  return langueCourante;
}

function obtenirDictionnaire(langue) {
  return dictionnaires[langue] || dictionnaires[LANGUE_DEFAUT] || {};
}

function traduire(dict, cle, params = {}) {
  if (!dict || !cle) return cle;
  const parts = cle.split('.');
  let valeur = dict;
  for (const p of parts) {
    if (valeur === null || typeof valeur !== 'object') return cle;
    valeur = valeur[p];
  }
  if (typeof valeur !== 'string') return cle;
  return valeur.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`
  );
}

function t(cle, params = {}) {
  return traduire(dictionnaires[langueCourante], cle, params);
}

module.exports = {
  init,
  definirLangue,
  obtenirLangue,
  obtenirDictionnaire,
  traduire,
  t,
  LANGUES_SUPPORTEES,
  LANGUE_DEFAUT
};
