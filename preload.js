const { contextBridge, ipcRenderer } = require('electron');

const catalogue = {
  lister: () => ipcRenderer.invoke('products:lister'),
  rechercher: (criteres) => ipcRenderer.invoke('products:rechercher', criteres),
  trouver: (id) => ipcRenderer.invoke('products:trouver', id),
  ajouter: (donnees) => ipcRenderer.invoke('products:ajouter', donnees),
  modifier: (id, donnees) => ipcRenderer.invoke('products:modifier', id, donnees),
  supprimer: (id) => ipcRenderer.invoke('products:supprimer', id)
};

const caisse = {
  enregistrerVente: (panier) => ipcRenderer.invoke('ventes:enregistrer', panier)
};

const systeme = {
  lookupOpenFoodFacts: (codeBarres) =>
    ipcRenderer.invoke('openfoodfacts:lookup', codeBarres)
};

contextBridge.exposeInMainWorld('electronAPI', {
  catalogue,
  caisse,
  systeme
});
