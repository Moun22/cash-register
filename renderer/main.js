import { initCatalogue } from './views/catalogue.js';
import { initCaisse } from './views/caisse.js';

document.addEventListener('DOMContentLoaded', () => {
  brancherOnglets();
  brancherIndicateurConnexion();
  initCatalogue();
  initCaisse();
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
    texte.textContent = 'En ligne';
  } else {
    el.className = 'indicateur-connexion hors-ligne';
    texte.textContent = 'Hors ligne';
  }
}
