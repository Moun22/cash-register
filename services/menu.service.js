const { Menu, dialog } = require('electron');
const i18nService = require('./i18n.service');
const windowManager = require('../window-manager');

function construireTemplate() {
  const t = (cle) => i18nService.t(cle);

  return [
    {
      label: t('menu.fichier'),
      submenu: [
        {
          label: t('menu.nouvelle_vente'),
          accelerator: 'CmdOrCtrl+N',
          click: () => windowManager.broadcast('menu:nouvelle-vente')
        },
        {
          label: t('menu.nouveau_produit'),
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => windowManager.broadcast('menu:nouveau-produit')
        },
        { type: 'separator' },
        { role: 'quit', label: t('menu.quitter') }
      ]
    },
    {
      label: t('menu.edition'),
      submenu: [
        { role: 'undo', label: t('menu.undo') },
        { role: 'redo', label: t('menu.redo') },
        { type: 'separator' },
        { role: 'cut', label: t('menu.couper') },
        { role: 'copy', label: t('menu.copier') },
        { role: 'paste', label: t('menu.coller') }
      ]
    },
    {
      label: t('menu.affichage'),
      submenu: [
        { role: 'reload', label: t('menu.recharger') },
        { role: 'toggleDevTools', label: t('menu.outils_dev') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t('menu.plein_ecran') }
      ]
    },
    {
      label: t('menu.aide'),
      submenu: [
        {
          label: t('menu.a_propos'),
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: t('about.titre'),
              message: t('about.message'),
              detail: t('about.detail')
            });
          }
        }
      ]
    }
  ];
}

function appliquerMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(construireTemplate()));
}

module.exports = { construireTemplate, appliquerMenu };
