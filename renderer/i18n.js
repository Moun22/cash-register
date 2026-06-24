let dictionnaire = {};

export function setDictionnaire(d) {
  dictionnaire = d || {};
}

export function t(cle, params = {}) {
  if (!cle) return '';
  const parts = cle.split('.');
  let valeur = dictionnaire;
  for (const p of parts) {
    if (valeur === null || typeof valeur !== 'object') return cle;
    valeur = valeur[p];
  }
  if (typeof valeur !== 'string') return cle;
  return valeur.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`
  );
}

export function appliquerTraductions(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}
