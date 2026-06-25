import { escapeHTML, formaterPrix, afficherMessageTemporaire } from '../utils.js';
import { t } from '../i18n.js';

export function initDashboard() {
  document.getElementById('btn-sauvegarder').addEventListener('click', sauvegarder);
  document.getElementById('btn-restaurer').addEventListener('click', restaurer);

  window.electronAPI.events.onVentesChanged(() => rafraichir());

  rafraichir();
}

async function rafraichir() {
  const r = await window.electronAPI.dashboard.resume();

  document.getElementById('kpi-ca-jour').textContent = formaterPrix(r.caJour);
  document.getElementById('kpi-nb-ventes').textContent = r.nbVentesJour;

  const evolEl = document.getElementById('kpi-evolution');
  if (r.evolutionPourcent === null) {
    evolEl.textContent = t('dashboard.kpi_evolution_premiere');
    evolEl.className = 'kpi-evolution';
  } else {
    const signe = r.evolutionPourcent >= 0 ? '+' : '';
    evolEl.textContent = `${signe}${r.evolutionPourcent}% ${t('dashboard.kpi_evolution')}`;
    evolEl.className = `kpi-evolution ${r.evolutionPourcent >= 0 ? 'positive' : 'negative'}`;
  }

  afficherBestsellers(r.bestsellers);
}

function afficherBestsellers(bestsellers) {
  const corps = document.getElementById('corps-bestsellers');
  const vide = document.getElementById('bestsellers-vide');
  const tableau = document.getElementById('tableau-bestsellers');

  if (bestsellers.length === 0) {
    corps.innerHTML = '';
    tableau.style.display = 'none';
    vide.style.display = 'block';
    return;
  }

  tableau.style.display = 'table';
  vide.style.display = 'none';

  corps.innerHTML = bestsellers.map((b) => `
    <tr>
      <td>${escapeHTML(b.nom_snapshot)}</td>
      <td>${b.quantite}</td>
      <td class="col-actions">${formaterPrix(b.chiffre_affaire)}</td>
    </tr>
  `).join('');
}

async function sauvegarder() {
  const chemin = await window.electronAPI.systeme.sauvegarder();
  if (chemin) {
    afficherMessageTemporaire(
      'message-maintenance',
      t('dashboard.sauvegarde_ok', { chemin }),
      'succes',
      6000
    );
  }
}

async function restaurer() {
  await window.electronAPI.systeme.restaurer();
}
