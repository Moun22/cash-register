const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  listerProduits: () => ipcRenderer.invoke('products:lister'),
  rechercherProduits: (criteres) => ipcRenderer.invoke('products:rechercher', criteres),
  trouverProduit: (id) => ipcRenderer.invoke('products:trouver', id),
  ajouterProduit: (donnees) => ipcRenderer.invoke('products:ajouter', donnees),
  modifierProduit: (id, donnees) => ipcRenderer.invoke('products:modifier', id, donnees),
  supprimerProduit: (id) => ipcRenderer.invoke('products:supprimer', id)
});
