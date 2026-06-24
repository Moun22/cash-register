import { escapeHTML, formaterPrix, afficherMessageTemporaire } from '../utils.js';
import { t } from '../i18n.js';

let filtreRecherche = '';
let lignesEnEdition = new Set();
let timerLookup = null;

export function initCatalogue() {
  document.getElementById('form-ajout-produit').addEventListener('submit', gererAjout);
  document.getElementById('code-barres').addEventListener('input', gererInputCodeBarres);
  document.getElementById('recherche-produit').addEventListener('input', gererRecherche);
  rafraichirCatalogue();
}

async function gererAjout(event) {
  event.preventDefault();

  const donnees = {
    code_barres: document.getElementById('code-barres').value.trim() || null,
    nom: document.getElementById('nom').value.trim(),
    prix: document.getElementById('prix').value,
    description: document.getElementById('description').value.trim() || null
  };

  const resultat = await window.electronAPI.catalogue.ajouter(donnees);

  if (resultat.ok) {
    afficherMessageTemporaire('message-ajout', t('catalogue.produit_ajoute', { nom: resultat.product.nom }), 'succes');
    event.target.reset();
    mettreAJourStatutLookup('');
    rafraichirCatalogue();
  } else {
    afficherMessageTemporaire('message-ajout', resultat.erreurs.join(' '), 'erreur');
  }
}

function gererInputCodeBarres(event) {
  clearTimeout(timerLookup);
  const code = event.target.value.trim();
  if (code.length < 8) {
    mettreAJourStatutLookup('');
    return;
  }
  timerLookup = setTimeout(() => lancerLookup(code), 500);
}

async function lancerLookup(code) {
  mettreAJourStatutLookup(t('openfoodfacts.recherche'), 'recherche');
  const r = await window.electronAPI.systeme.lookupOpenFoodFacts(code);

  if (r.found) {
    document.getElementById('nom').value = r.product.nom;
    if (r.product.description) {
      document.getElementById('description').value = r.product.description;
    }
    const cle = r.source === 'cache' ? 'openfoodfacts.trouve_cache' : 'openfoodfacts.trouve';
    mettreAJourStatutLookup(t(cle, { nom: r.product.nom }), 'trouve');
    return;
  }

  if (r.offline) {
    mettreAJourStatutLookup(t('openfoodfacts.hors_ligne'), 'hors-ligne');
    return;
  }

  mettreAJourStatutLookup(t('openfoodfacts.non_trouve'), 'non-trouve');
}

function mettreAJourStatutLookup(texte, classe = '') {
  const el = document.getElementById('statut-lookup');
  el.textContent = texte;
  el.className = classe ? `statut-lookup ${classe}` : 'statut-lookup';
}

function gererRecherche(event) {
  filtreRecherche = event.target.value;
  rafraichirCatalogue();
}

async function rafraichirCatalogue() {
  const produits = await window.electronAPI.catalogue.rechercher({ texte: filtreRecherche });
  const corps = document.getElementById('corps-produits');
  const messageVide = document.getElementById('message-vide');
  const tableau = document.getElementById('tableau-produits');

  if (produits.length === 0) {
    corps.innerHTML = '';
    tableau.style.display = 'none';
    messageVide.style.display = 'block';
    messageVide.textContent = filtreRecherche
      ? t('catalogue.aucun_resultat')
      : t('catalogue.aucun_produit');
    return;
  }

  tableau.style.display = 'table';
  messageVide.style.display = 'none';

  corps.innerHTML = produits.map(construireLigne).join('');
  brancherActionsLignes();
}

function construireLigne(produit) {
  const enEdition = lignesEnEdition.has(produit.id);

  const cellulePrix = enEdition
    ? `<input type="number" class="edition-prix" data-id="${produit.id}" value="${produit.prix}" step="0.01" min="0.01" />`
    : formaterPrix(produit.prix);

  const boutonPrix = enEdition
    ? `<button data-action="enregistrer" data-id="${produit.id}">${t('catalogue.bouton_enregistrer')}</button>`
    : `<button data-action="editer" data-id="${produit.id}">${t('catalogue.bouton_editer')}</button>`;

  return `
    <tr data-id="${produit.id}">
      <td>${produit.code_barres || '<span class="vide">-</span>'}</td>
      <td>${escapeHTML(produit.nom)}</td>
      <td>${cellulePrix}</td>
      <td>${escapeHTML(produit.description || '')}</td>
      <td><span class="badge-source ${produit.source}">${produit.source}</span></td>
      <td class="col-actions">
        <div class="actions">
          ${boutonPrix}
          <button data-action="supprimer" data-id="${produit.id}" class="danger">${t('catalogue.bouton_supprimer')}</button>
        </div>
      </td>
    </tr>
  `;
}

function brancherActionsLignes() {
  document.querySelectorAll('#corps-produits [data-action]').forEach((bouton) => {
    bouton.addEventListener('click', gererActionLigne);
  });
}

async function gererActionLigne(event) {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === 'supprimer') {
    const ok = await window.electronAPI.catalogue.supprimer(id);
    if (ok) rafraichirCatalogue();
  }

  if (action === 'editer') {
    lignesEnEdition.add(id);
    rafraichirCatalogue();
  }

  if (action === 'enregistrer') {
    const champ = document.querySelector(`.edition-prix[data-id="${id}"]`);
    const produit = await window.electronAPI.catalogue.trouver(id);
    if (!produit) return;

    const resultat = await window.electronAPI.catalogue.modifier(id, {
      nom: produit.nom,
      prix: champ.value,
      description: produit.description,
      code_barres: produit.code_barres
    });

    if (resultat.ok) {
      lignesEnEdition.delete(id);
      rafraichirCatalogue();
    } else {
      alert(resultat.erreurs.join(' '));
    }
  }
}
