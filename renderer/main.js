import { initCatalogue } from './views/catalogue.js';
import { initCaisse, viderPanier } from './views/caisse.js';
import { initHistorique } from './views/historique.js';
import { initDashboard } from './views/dashboard.js';
import { setDictionnaire, appliquerTraductions, t } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  const prefs = await window.electronAPI.preferences.obtenir();

  appliquerTheme(prefs.theme);
  const dict = await window.electronAPI.preferences.obtenirDictionnaire(prefs.langue);
  setDictionnaire(dict);
  appliquerTraductions();

  document.getElementById('select-langue').value = prefs.langue;
  document.getElementById('select-theme').value = prefs.theme;

  brancherOnglets();
  brancherIndicateurConnexion();
  brancherPreferences();

  initCaisse();
  initCatalogue();
  initHistorique();
  initDashboard();

  brancherMenuEvents();
  restaurerOngletActif();
});

function brancherMenuEvents() {
  window.electronAPI.events.onMenuNouvelleVente(() => {
    activerOnglet('caisse');
    viderPanier();
    document.getElementById('recherche-caisse').focus();
  });

  window.electronAPI.events.onMenuNouveauProduit(() => {
    activerOnglet('catalogue');
    document.getElementById('form-ajout-produit').reset();
    document.getElementById('code-barres').focus();
  });
}

function appliquerTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function brancherOnglets() {
  document.querySelectorAll('.onglet').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      activerOnglet(bouton.dataset.view);
    });
  });
}

function activerOnglet(cible) {
  document.querySelectorAll('.onglet').forEach((b) => {
    b.classList.toggle('actif', b.dataset.view === cible);
  });
  document.querySelectorAll('.vue').forEach((v) => {
    v.classList.toggle('cache', v.id !== `view-${cible}`);
  });
  sessionStorage.setItem('onglet-actif', cible);
}

function restaurerOngletActif() {
  const sauve = sessionStorage.getItem('onglet-actif');
  if (sauve && document.getElementById(`view-${sauve}`)) {
    activerOnglet(sauve);
  }
}

function brancherIndicateurConnexion() {
  mettreAJourIndicateurConnexion();
  window.addEventListener('online', mettreAJourIndicateurConnexion);
  window.addEventListener('offline', mettreAJourIndicateurConnexion);
}

function mettreAJourIndicateurConnexion() {
  const el = document.getElementById('indicateur-connexion');
  const texte = el.querySelector('.texte');
  if (navigator.onLine) {
    el.className = 'indicateur-connexion en-ligne';
    texte.textContent = t('indicateur.en_ligne');
  } else {
    el.className = 'indicateur-connexion hors-ligne';
    texte.textContent = t('indicateur.hors_ligne');
  }
}

function brancherPreferences() {
  document.getElementById('select-theme').addEventListener('change', async (e) => {
    const nouveau = e.target.value;
    await window.electronAPI.preferences.definir('theme', nouveau);
    appliquerTheme(nouveau);
  });

  document.getElementById('select-langue').addEventListener('change', async (e) => {
    const nouveau = e.target.value;
    await window.electronAPI.preferences.definir('langue', nouveau);
    location.reload();
  });
}
