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

export function formaterDateLocale(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const annee = d.getFullYear();
  const heure = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${jour}/${mois}/${annee} ${heure}:${minute}`;
}
