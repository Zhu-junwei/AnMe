export function createWebDavUiMethods({ state, constants, utils, core, ui }) {
  return {
    renderWebDavView() {
      const config = core.getWebDavConfig();
      const hasConfig = core.hasWebDavConfig();
      const statusEl = ui.qs('#webdav-status');
      const syncBtn = ui.qs('#btn-webdav-sync');
      const logoutBtn = ui.qs('#btn-webdav-logout');
      if (!statusEl || !syncBtn || !logoutBtn) return;

      statusEl.textContent = hasConfig
        ? utils.t('webdav_connected_as').replace('{user}', config.username)
        : utils.t('webdav_not_configured');
      syncBtn.disabled = !hasConfig;
      logoutBtn.disabled = !hasConfig;

      if (hasConfig) {
        state.webdavBackups = core.getCachedWebDavBackups();
      } else {
        state.webdavBackups = [];
      }
      ui.renderWebDavBackupList(state.webdavBackups);
    },
    renderWebDavBackupList(backups = [], errorMessage = '') {
      const container = ui.qs('#webdav-backup-list');
      if (!container) return;

      if (errorMessage) {
        utils.setHTML(container, `<div class="acc-webdav-empty">${utils.escapeHtml(errorMessage)}</div>`);
        return;
      }

      if (!backups.length) {
        utils.setHTML(container, `<div class="acc-webdav-empty">${utils.t('webdav_no_backups')}</div>`);
        return;
      }

      utils.setHTML(
        container,
        backups
          .map(
            (backup) => `
            <div class="acc-webdav-item">
              <div class="acc-webdav-item-main">
                <div class="acc-webdav-item-name" title="${utils.escapeHtml(backup.fileName)}">${utils.escapeHtml(backup.fileName)}</div>
                <div class="acc-webdav-item-meta">
                  <span class="acc-mini-tag acc-webdav-meta-tag">${utils.escapeHtml(utils.formatTime(backup.lastModified))}</span>
                  <span class="acc-mini-tag acc-webdav-meta-tag">${utils.escapeHtml(utils.formatBytes(backup.size))}</span>
                </div>
              </div>
              <div class="acc-webdav-item-actions">
                <button class="acc-toolbar-btn acc-webdav-action-btn" type="button" title="${utils.t('webdav_restore')}" data-action="restore" data-file="${utils.escapeHtml(backup.fileName)}">${constants.ICONS.IMPORT}</button>
                <button class="acc-toolbar-btn acc-webdav-action-btn danger" type="button" title="${utils.t('webdav_delete')}" data-action="delete" data-file="${utils.escapeHtml(backup.fileName)}">${constants.ICONS.DELETE}</button>
              </div>
            </div>
          `
          )
          .join('')
      );
    },
    async loadWebDavBackups() {
      const config = core.getWebDavConfig();
      const refreshBtn = ui.qs('#btn-webdav-refresh');
      if (!config.url || !config.username || !config.password) {
        state.webdavBackups = [];
        ui.renderWebDavBackupList([], utils.t('webdav_need_config'));
        return;
      }

      await ui.runUiAction({
        button: refreshBtn,
        idleText: utils.t('webdav_refresh'),
        errorKey: 'webdav_list_err',
        successMessage: utils.t('webdav_refresh_ok'),
        action: async () => {
          state.webdavBackups = await core.listWebDavBackups();
          return state.webdavBackups;
        },
        onSuccess: (backups) => {
          ui.renderWebDavBackupList(backups);
        },
        onError: (error) => {
          const toastMessage = utils.getWebDavErrorMessage(error, 'webdav_list_err');
          state.webdavBackups = core.getCachedWebDavBackups();
          if (state.webdavBackups.length) {
            ui.renderWebDavBackupList(state.webdavBackups);
          } else {
            ui.renderWebDavBackupList([], toastMessage);
          }
        }
      });
    }
  };
}
