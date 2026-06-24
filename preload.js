const { contextBridge } = require('electron');

const catalogue = require('./preload/catalogue');
const caisse = require('./preload/caisse');
const historique = require('./preload/historique');
const systeme = require('./preload/systeme');
const events = require('./preload/events');
const preferences = require('./preload/preferences');

contextBridge.exposeInMainWorld('electronAPI', {
  catalogue,
  caisse,
  historique,
  systeme,
  events,
  preferences
});
