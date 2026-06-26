# Dossier de conception : Cash Register

Logiciel de caisse pour une épicerie de quartier (Electron). Ce document présente
le modèle de données, l'architecture et les choix techniques, avec leurs justifications.

> L'installation, le lancement et la **preuve de packaging** (captures de l'application
> installée et lancée) sont dans le [README](../README.md).

---

## 1. Modèle de données

Persistance dans une base **SQLite** unique (`cash-register.db`), rangée dans le
dossier `userData` de l'application (`app.getPath('userData')`).

### Schéma

```
products                          ventes
─────────                         ──────
id            PK                  id            PK
code_barres   TEXT UNIQUE (null)  date_iso      TEXT (ISO 8601, UTC)
nom           TEXT NOT NULL       total         REAL
prix          REAL NOT NULL
description   TEXT                 vente_lignes
source        TEXT ('manuel' |    ────────────
              'openfoodfacts')    id             PK
                                  vente_id       FK → ventes(id)   ON DELETE CASCADE
preferences                       product_id     FK → products(id) ON DELETE SET NULL
───────────                       nom_snapshot   TEXT NOT NULL
cle    PK                         prix_unitaire  REAL NOT NULL
valeur TEXT                       quantite       INTEGER NOT NULL

off_cache (cache OpenFoodFacts)
─────────
code_barres        PK
nom                TEXT NOT NULL
description        TEXT
date_recuperation  TEXT
```

### Choix de modélisation

- **Deux entités liées (produits ↔ ventes) via une table de jointure `vente_lignes`.**
  Une vente contient plusieurs lignes ; chaque ligne référence un produit et porte
  une quantité. C'est la relation many-to-many classique d'un panier.

- **`nom_snapshot` et `prix_unitaire` copiés dans `vente_lignes` (dénormalisation
  volontaire).** Une vente est un **fait comptable immuable** : si demain on change
  le prix d'un produit ou qu'on le supprime, les anciennes ventes doivent rester
  exactes. On stocke donc le nom et le prix **au moment de la vente**, pas une simple
  référence. C'est ce qui permet à l'historique et aux exports d'être fidèles dans le
  temps.

- **`product_id` en `ON DELETE SET NULL`** (et non CASCADE) : supprimer un produit du
  catalogue ne doit **pas** effacer les ventes passées. La ligne reste, son
  `product_id` devient `NULL`, et l'UI l'affiche comme « supprimé » grâce au snapshot.

- **`vente_id` en `ON DELETE CASCADE`** : supprimer une vente supprime logiquement
  ses lignes (cohérence référentielle, pas de lignes orphelines).

- **`code_barres` `UNIQUE` mais nullable** : tous les produits n'ont pas de code-barres
  (vrac, produits maison), mais quand il existe il doit être unique pour éviter les
  doublons et servir de clé de recherche OpenFoodFacts.

- **`preferences` en clé/valeur** plutôt qu'une table à colonnes fixes : la langue et
  le thème sont peu nombreux et hétérogènes ; un schéma clé/valeur est extensible sans
  migration (penser scalabilité : ajouter une préférence = une ligne, pas un `ALTER`).

- **`off_cache` séparée du catalogue** : le cache des réponses OpenFoodFacts n'est pas
  un produit du magasin. Le garder à part permet de scanner un code-barres déjà vu
  **même hors ligne**, sans polluer le catalogue.

- **Dates en ISO 8601 / UTC** (`new Date().toISOString()`), converties en heure locale
  uniquement à l'affichage. Stocker en UTC rend les données portables (sauvegarde,
  changement de machine) ; la conversion locale se fait côté présentation.

- **`PRAGMA foreign_keys = ON`** (intégrité référentielle réellement appliquée) et
  **`journal_mode = WAL`** (meilleures performances en lecture/écriture concurrentes).

---

## 2. Architecture

### Respect strict des 3 processus Electron

```
┌──────────────────────────────────────────────────────────────┐
│ MAIN  (Node.js — accès système, SQLite, fichiers, réseau)    │
│  main.js · window-manager.js                                 │
│  services/   = logique métier pure (testable)                │
│  ipc/        = "contrôleurs" : branchent les canaux IPC      │
└───────────────▲──────────────────────────────────────────────┘
                │ contextBridge (IPC invoke/handle + events)
┌───────────────┴──────────────────────────────────────────────┐
│ PRELOAD  (pont sécurisé)                                      │
│  preload.js + preload/*.js  → expose window.electronAPI      │
└───────────────▲──────────────────────────────────────────────┘
                │ window.electronAPI.<domaine>.<action>()
┌───────────────┴──────────────────────────────────────────────┐
│ RENDERER  (la page — aucun require, aucun fs)                │
│  renderer/index.html · main.js · views/*.js · i18n.js        │
└──────────────────────────────────────────────────────────────┘
```

- **`contextIsolation: true`, `nodeIntegration: false`** : la page n'a aucun accès
  direct à Node.js. Tout passe par l'IPC. Une **CSP** (`default-src 'self'`) complète
  la défense côté HTML.

- **Découpage en couches `services/` puis `ipc/`.** Les *services* contiennent la
  logique (requêtes SQL, validation, calculs, génération PDF/CSV) et ne connaissent
  pas Electron pour la plupart. Les fichiers `ipc/*.ipc.js` ne font que **brancher**
  un canal IPC sur un service. Conséquence : la logique métier est **testable sans
  lancer Electron** (73 tests `node --test` sur les fonctions pures).

- **Un service par entité / responsabilité** : `products`, `ventes`, `dashboard`,
  `import`, `backup`, `export`, `openfoodfacts`, `preferences`, `i18n`, `validation`,
  `db`. `main.js` reste court : il initialise la base, enregistre les IPC et ouvre la
  fenêtre.

### Convention des canaux IPC : `domaine:action`

Exemples : `products:lister`, `products:importer-csv`, `ventes:enregistrer`,
`historique:lister`, `systeme:exporter-pdf`, `dashboard:resume`,
`preferences:definir`. Le même nom de canal est utilisé côté preload et côté main,
ce qui rend le branchement lisible et cohérent.

### Le preload découpé par domaine

`preload.js` agrège plusieurs sous-modules (`preload/catalogue.js`, `caisse.js`,
`historique.js`, `systeme.js`, `dashboard.js`, `preferences.js`, `events.js`).
`window.electronAPI` est ainsi **organisé par domaine**
(`electronAPI.catalogue.ajouter(...)`, `electronAPI.caisse.enregistrerVente(...)`),
ce qui passe à l'échelle bien mieux qu'une API plate à plat. La barrière de sécurité
reste `contextIsolation` + `nodeIntegration:false`, pas le nombre de fichiers.

### Renderer : une fenêtre, plusieurs vues

Une seule `BrowserWindow` charge un `index.html` avec 4 sections (Caisse, Catalogue,
Historique, Tableau de bord) affichées/masquées par une classe CSS. Le code du
renderer est en **modules ES** : `main.js` orchestre, `views/*.js` gèrent chacune leur
vue. Choix volontaire de **ne pas** ouvrir une fenêtre par onglet (UX d'une app de
caisse = une seule fenêtre).

### Synchronisation entre vues

Après une vente, le main diffuse un événement `data:ventes-changed`
(`window.webContents.send`). L'historique et le tableau de bord y sont abonnés
(`events.onVentesChanged`) et se rafraîchissent **automatiquement**, sans action de
l'utilisateur.

---

## 3. Choix techniques 

| Choix | Justification |
|---|---|
| **SQLite (`better-sqlite3`)** | Base relationnelle locale, transactions ACID, **requêtes préparées** (paramètres `?` → pas d'injection SQL). API synchrone simple côté main. |
| **Transaction pour une vente** | L'écriture de la vente + ses lignes est atomique : soit tout est enregistré, soit rien. Évite les ventes à moitié écrites. |
| **`fetch` natif (Node 18+)** | Pas de dépendance HTTP supplémentaire pour appeler OpenFoodFacts. Timeout via `AbortController`. |
| **Stratégie hors ligne** | Cache d'abord (`off_cache`) → API → repli saisie manuelle. L'épicière peut continuer à scanner si Internet coupe. Un indicateur de connexion (`navigator.onLine`) informe en direct. |
| **i18n maison (JSON + `t()`)** | Deux langues seulement : un dictionnaire JSON par langue + une fonction `t(clé, params)` suffisent, sans librairie. Un test vérifie que `fr` et `en` ont **exactement les mêmes clés**. |
| **Thème par variables CSS** | `:root` définit les couleurs, `[data-theme="sombre"]` les surcharge. Changement de thème **instantané**, sans recharger. |
| **Préférences en base** | Langue et thème survivent au redémarrage et restent cohérents avec le reste des données (une seule source de vérité). |
| **PDF via `pdfkit`** | Génération de rapports de ventes et de tickets de caisse en pur JS, sans moteur externe. |
| **Import CSV résilient** | Détection d'encodage (UTF-8 / UTF-8 BOM / UTF-16), auto-détection du séparateur (`,` ou `;` pour Excel FR), en-têtes insensibles à la casse, lignes invalides ignorées et comptées. |
| **Sauvegarde / restauration** | Copie du fichier `.db` (avec gestion des fichiers WAL/SHM). Permet de migrer vers un autre PC. La restauration redémarre l'application pour repartir d'un état propre. |
| **Packaging `electron-builder` (NSIS)** | Installeur `.exe` classique (choix du dossier, raccourci menu Démarrer), aucune ligne de commande pour l'utilisateur final. |
| **Tests `node --test`** | Runner intégré à Node, zéro dépendance. Cible la **logique pure** (validation, parsing, calculs) — la partie où les bugs coûtent cher. |

### Robustesse et sécurité (synthèse)

- `contextIsolation: true`, `nodeIntegration: false`, **CSP** dans le HTML.
- Validation des entrées côté main (service `validation`) **et** contraintes SQL
  (`NOT NULL`, `UNIQUE`, types, clés étrangères).
- Requêtes SQL **toujours préparées** (jamais de concaténation de chaînes).
- Instance unique de l'application (`requestSingleInstanceLock`) : un second lancement
  ramène la fenêtre existante au premier plan.
- Gestion explicite du hors-ligne (cache + repli + indicateur).

---

## 4. Limites connues et pistes d'évolution

- `sandbox: false` est assumé pour permettre au preload de `require()` ses sous-modules ;
  la sécurité repose sur `contextIsolation` + `nodeIntegration:false`. Une variante
  `sandbox: true` nécessiterait de bundler le preload (esbuild).
- Pas d'authentification (caisse mono-utilisateur, conforme au besoin exprimé).
