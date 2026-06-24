const { ipcRenderer } = require('electron');

module.exports = {
  lookupOpenFoodFacts: (codeBarres) => ipcRenderer.invoke('openfoodfacts:lookup', codeBarres),
  exporterCSV: (filtres) => ipcRenderer.invoke('systeme:exporter-csv', filtres),
  exporterPDF: (filtres) => ipcRenderer.invoke('systeme:exporter-pdf', filtres)
};
