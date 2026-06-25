import { escapeHTML, formaterPrix, formaterDateLocale } from '../utils.js';
import { t } from '../i18n.js';

export function initHistorique() {
  document.getElementById('hist-rafraichir').addEventListener('click', rafraichirListe);
  document.getElementById('hist-reset').addEventListener('click', reinitialiserFiltres);
  document.getElementById('hist-exporter-csv').addEventListener('click', () => exporter('csv'));
  document.getElementById('hist-exporter-pdf').addEventListener('click', () => exporter('pdf'));

  window.electronAPI.events.onVentesChanged(() => rafraichirListe());

  rafraichirListe();
}

function obtenirFiltres() {
  return {
    dateDebut: document.getElementById('hist-date-debut').value || null,
    dateFin: document.getElementById('hist-date-fin').value || null
  };
}

function reinitialiserFiltres() {
  document.getElementById('hist-date-debut').value = '';
  document.getElementById('hist-date-fin').value = '';
  rafraichirListe();
}

async function rafraichirListe() {
  const ventes = await window.electronAPI.historique.lister(obtenirFiltres());

  const corps = document.getElementById('corps-historique');
  const messageVide = document.getElementById('message-historique-vide');
  const tableau = document.getElementById('tableau-historique');
  document.getElementById('bloc-detail-vente').style.display = 'none';

  if (ventes.length === 0) {
    corps.innerHTML = '';
    tableau.style.display = 'none';
    messageVide.style.display = 'block';
    return;
  }

  tableau.style.display = 'table';
  messageVide.style.display = 'none';

  corps.innerHTML = ventes.map((v) => `
    <tr data-id="${v.id}">
      <td>#${v.id}</td>
      <td>${formaterDateLocale(v.date_iso)}</td>
      <td>${v.nb_articles}</td>
      <td>${formaterPrix(v.total)}</td>
      <td class="col-actions">
        <div class="actions">
          <button data-action="detail" data-id="${v.id}">${t('historique.bouton_detail')}</button>
        </div>
      </td>
    </tr>
  `).join('');

  corps.querySelectorAll('[data-action="detail"]').forEach((btn) => {
    btn.addEventListener('click', () => afficherDetail(Number(btn.dataset.id)));
  });
}

async function afficherDetail(venteId) {
  const vente = await window.electronAPI.historique.trouver(venteId);
  const lignes = await window.electronAPI.historique.listerLignes(venteId);

  if (!vente) return;

  document.getElementById('detail-id').textContent = `#${vente.id}`;
  document.getElementById('detail-meta').textContent = t('historique.detail_meta', { date: formaterDateLocale(vente.date_iso) });
  document.getElementById('detail-total').textContent = formaterPrix(vente.total);

  const boutonTicket = document.getElementById('btn-ticket-pdf');
  boutonTicket.onclick = () => window.electronAPI.systeme.exporterTicket(vente.id);

  const corps = document.getElementById('corps-detail');
  if (lignes.length === 0) {
    corps.innerHTML = `<tr><td colspan="4" class="vide">${t('historique.detail_aucune_ligne')}</td></tr>`;
  } else {
    corps.innerHTML = lignes.map((l) => `
      <tr>
        <td>${escapeHTML(l.nom_snapshot)}${l.product_id ? '' : ` <span class="badge-source manuel">${t('catalogue.supprime_badge')}</span>`}</td>
        <td>${l.quantite}</td>
        <td>${formaterPrix(l.prix_unitaire)}</td>
        <td class="col-actions">${formaterPrix(l.prix_unitaire * l.quantite)}</td>
      </tr>
    `).join('');
  }

  const bloc = document.getElementById('bloc-detail-vente');
  bloc.style.display = 'block';
  bloc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function exporter(format) {
  const action = format === 'csv'
    ? window.electronAPI.systeme.exporterCSV
    : window.electronAPI.systeme.exporterPDF;
  await action(obtenirFiltres());
}
