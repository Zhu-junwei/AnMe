export function createWebDavUiMethods({ state, constants, utils, core, ui }) {
  return {
    renderWebDavView() {
      const config = core.getWebDavConfig();
      const statusEl = ui.qs('#webdav-status');
      const syncBtn = ui.qs('#btn-webdav-sync');
      const logoutBtn = ui.qs('#btn-webdav-logout');
      if (!statusEl || !syncBtn || !logoutBtn) return;

      statusEl.textContent = core.hasWebDavConfig()
        ? utils.t('webdav_connected_as').replace('{user}', config.username)
        : utils.t('webdav_not_configured');
      syncBtn.disabled = !core.hasWebDavConfig();
      syncBtn.style.opacity = syncBtn.disabled ? '0.5' : '1';
      syncBtn.style.cursor = syncBtn.disabled ? 'not-allowed' : 'pointer';
      logoutBtn.disabled = !core.hasWebDavConfig();
      logoutBtn.style.opacity = logoutBtn.disabled ? '0.5' : '1';
      logoutBtn.style.cursor = logoutBtn.disabled ? 'not-allowed' : 'pointer';

      if (core.hasWebDavConfig()) {
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
        container.innerHTML = `<div class="acc-webdav-empty">${utils.escapeHtml(errorMessage)}</div>`;
        return;
      }

      if (!backups.length) {
        container.innerHTML = `<div class="acc-webdav-empty">${utils.t('webdav_no_backups')}</div>`;
        return;
      }

      container.innerHTML = backups
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
        .join('');
    },
    async loadWebDavBackups() {
      const config = core.getWebDavConfig();
      if (!config.url || !config.username || !config.password) {
        state.webdavBackups = [];
        ui.renderWebDavBackupList([], utils.t('webdav_need_config'));
        return;
      }

      ui.toggleLoading(true, utils.t('webdav_loading'));
      try {
        state.webdavBackups = await core.listWebDavBackups();
        ui.renderWebDavBackupList(state.webdavBackups);
      } catch (error) {
        state.webdavBackups = core.getCachedWebDavBackups();
        if (state.webdavBackups.length) {
          ui.renderWebDavBackupList(state.webdavBackups);
          ui.showToast(error.message || utils.t('webdav_list_err'));
        } else {
          ui.renderWebDavBackupList([], error.message || utils.t('webdav_list_err'));
        }
      } finally {
        ui.toggleLoading(false);
      }
    }
  };
}
