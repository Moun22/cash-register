import { escapeHTML, formaterPrix, afficherMessageTemporaire } from '../utils.js';
import { t } from '../i18n.js';

let panier = [];

export function initCaisse() {
  document.getElementById('recherche-caisse').addEventListener('input', gererRecherche);
  document.getElementById('btn-valider-vente').addEventListener('click', gererValidation);
  afficherPanier();
}

export function viderPanier() {
  panier = [];
  document.getElementById('recherche-caisse').value = '';
  document.getElementById('resultats-recherche').innerHTML = '';
  afficherPanier();
}

async function gererRecherche(event) {
  const texte = event.target.value.trim();
  if (!texte) {
    afficherResultats([]);
    return;
  }
  const produits = await window.electronAPI.catalogue.rechercher({ texte });
  afficherResultats(produits);
}

function afficherResultats(produits) {
  const conteneur = document.getElementById('resultats-recherche');

  if (produits.length === 0) {
    conteneur.innerHTML = '';
    return;
  }

  conteneur.innerHTML = produits.map((p) => `
    <div class="resultat" data-id="${p.id}">
      <span class="nom">${escapeHTML(p.nom)}</span>
      <span class="prix">${formaterPrix(p.prix)}</span>
    </div>
  `).join('');

  conteneur.querySelectorAll('.resultat').forEach((el) => {
    el.addEventListener('click', () => ajouterAuPanier(Number(el.dataset.id)));
  });
}

async function ajouterAuPanier(productId) {
  const existe = panier.find((l) => l.product_id === productId);
  if (existe) {
    existe.quantite++;
    afficherPanier();
    return;
  }

  const produit = await window.electronAPI.catalogue.trouver(productId);
  if (!produit) return;

  panier.push({
    product_id: produit.id,
    nom_snapshot: produit.nom,
    prix_unitaire: produit.prix,
    quantite: 1
  });

  afficherPanier();
}

function afficherPanier() {
  const conteneur = document.getElementById('liste-panier');
  const bouton = document.getElementById('btn-valider-vente');

  if (panier.length === 0) {
    conteneur.innerHTML = `<p class="vide">${t('caisse.panier_vide')}</p>`;
    bouton.disabled = true;
  } else {
    conteneur.innerHTML = panier.map((l, i) => `
      <div class="ligne-panier" data-idx="${i}">
        <span class="nom">${escapeHTML(l.nom_snapshot)}</span>
        <span class="pu">${formaterPrix(l.prix_unitaire)}</span>
        <div class="qte">
          <button data-action="moins" data-idx="${i}">-</button>
          <span class="valeur">${l.quantite}</span>
          <button data-action="plus" data-idx="${i}">+</button>
        </div>
        <span class="sous-total">${formaterPrix(l.prix_unitaire * l.quantite)}</span>
        <button data-action="supprimer" data-idx="${i}" class="x" title="Retirer">×</button>
      </div>
    `).join('');

    conteneur.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', gererActionPanier);
    });

    bouton.disabled = false;
  }

  const total = panier.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0);
  document.getElementById('montant-total').textContent = formaterPrix(total);
}

function gererActionPanier(event) {
  const action = event.target.dataset.action;
  const idx = Number(event.target.dataset.idx);

  if (action === 'plus') {
    panier[idx].quantite++;
  } else if (action === 'moins') {
    if (panier[idx].quantite > 1) panier[idx].quantite--;
    else panier.splice(idx, 1);
  } else if (action === 'supprimer') {
    panier.splice(idx, 1);
  }

  afficherPanier();
}

async function gererValidation() {
  const resultat = await window.electronAPI.caisse.enregistrerVente(panier);

  if (resultat.ok) {
    afficherMessageTemporaire(
      'message-vente',
      t('caisse.vente_enregistree', { id: resultat.venteId, total: formaterPrix(resultat.total) }),
      'succes'
    );
    panier = [];
    afficherPanier();
    document.getElementById('recherche-caisse').value = '';
    afficherResultats([]);
  } else {
    afficherMessageTemporaire('message-vente', resultat.erreurs.join(' '), 'erreur');
  }
}
