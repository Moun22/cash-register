let filtreRecherche = '';
let lignesEnEdition = new Set();

document.addEventListener('DOMContentLoaded', () => {
  brancherOnglets();
  brancherFormulaireAjout();
  brancherRecherche();
  rafraichirCatalogue();
});

function brancherOnglets() {
  document.querySelectorAll('.onglet').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const cible = bouton.dataset.view;
      document.querySelectorAll('.onglet').forEach((b) => b.classList.remove('actif'));
      bouton.classList.add('actif');
      document.querySelectorAll('.vue').forEach((v) => v.classList.add('cache'));
      document.getElementById(`view-${cible}`).classList.remove('cache');
    });
  });
}

function brancherFormulaireAjout() {
  document.getElementById('form-ajout-produit').addEventListener('submit', async (event) => {
    event.preventDefault();

    const donnees = {
      code_barres: document.getElementById('code-barres').value.trim() || null,
      nom: document.getElementById('nom').value.trim(),
      prix: document.getElementById('prix').value,
      description: document.getElementById('description').value.trim() || null
    };

    const resultat = await window.electronAPI.ajouterProduit(donnees);
    const message = document.getElementById('message-ajout');

    if (resultat.ok) {
      message.textContent = `${resultat.product.nom} ajoute au catalogue.`;
      message.className = 'message succes';
      event.target.reset();
      rafraichirCatalogue();
    } else {
      message.textContent = resultat.erreurs.join(' ');
      message.className = 'message erreur';
    }

    setTimeout(() => {
      message.textContent = '';
      message.className = 'message';
    }, 4000);
  });
}

function brancherRecherche() {
  document.getElementById('recherche-produit').addEventListener('input', (event) => {
    filtreRecherche = event.target.value;
    rafraichirCatalogue();
  });
}

async function rafraichirCatalogue() {
  const produits = await window.electronAPI.rechercherProduits({ texte: filtreRecherche });
  const corps = document.getElementById('corps-produits');
  const messageVide = document.getElementById('message-vide');
  const tableau = document.getElementById('tableau-produits');

  if (produits.length === 0) {
    corps.innerHTML = '';
    tableau.style.display = 'none';
    messageVide.style.display = 'block';
    messageVide.textContent = filtreRecherche
      ? 'Aucun produit ne correspond a la recherche.'
      : 'Aucun produit dans le catalogue.';
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
    : `${produit.prix.toFixed(2)} EUR`;

  const boutonPrix = enEdition
    ? `<button data-action="enregistrer" data-id="${produit.id}">Enregistrer</button>`
    : `<button data-action="editer" data-id="${produit.id}">Editer</button>`;

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
          <button data-action="supprimer" data-id="${produit.id}" class="danger">Supprimer</button>
        </div>
      </td>
    </tr>
  `;
}

function brancherActionsLignes() {
  document.querySelectorAll('[data-action]').forEach((bouton) => {
    bouton.addEventListener('click', gererActionLigne);
  });
}

async function gererActionLigne(event) {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === 'supprimer') {
    const ok = await window.electronAPI.supprimerProduit(id);
    if (ok) rafraichirCatalogue();
  }

  if (action === 'editer') {
    lignesEnEdition.add(id);
    rafraichirCatalogue();
  }

  if (action === 'enregistrer') {
    const champ = document.querySelector(`.edition-prix[data-id="${id}"]`);
    const nouveauPrix = champ.value;
    const produit = await window.electronAPI.trouverProduit(id);
    if (!produit) return;

    const resultat = await window.electronAPI.modifierProduit(id, {
      nom: produit.nom,
      prix: nouveauPrix,
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

function escapeHTML(texte) {
  if (texte === null || texte === undefined) return '';
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
