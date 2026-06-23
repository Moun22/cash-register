export function escapeHTML(texte) {
  if (texte === null || texte === undefined) return '';
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formaterPrix(montant) {
  return `${Number(montant).toFixed(2)} EUR`;
}

export function afficherMessageTemporaire(idElement, texte, classe, dureeMs = 4000) {
  const el = document.getElementById(idElement);
  el.textContent = texte;
  el.className = classe ? `message ${classe}` : 'message';
  setTimeout(() => {
    el.textContent = '';
    el.className = 'message';
  }, dureeMs);
}
