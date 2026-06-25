const { ipcMain } = require('electron');
const dashboardService = require('../services/dashboard.service');

function enregistrer() {
  ipcMain.handle('dashboard:resume', () => {
    return dashboardService.resume();
  });
}

module.exports = { enregistrer };
