export function createEventMethods({ state, constants, utils, core, ui }) {
  return {
    ensureNoteTooltip() {
      if (state.noteTooltipEl || !state.uiRoot) return state.noteTooltipEl;
      const tooltip = document.createElement('div');
      tooltip.className = 'acc-floating-note-tooltip';
      const content = document.createElement('div');
      content.className = 'acc-floating-note-tooltip-content';
      ['mousedown', 'mouseup', 'click'].forEach((eventName) => {
        tooltip.addEventListener(eventName, (event) => {
          event.stopPropagation();
        });
      });
      content.addEventListener(
        'wheel',
        (event) => {
          event.stopPropagation();
          if (ui.shouldPreventWheelLeak(content, event.deltaY)) {
            event.preventDefault();
          }
        },
        { passive: false }
      );
      tooltip.appendChild(content);
      tooltip.addEventListener('mouseenter', () => {
        if (state.noteTooltipEl) {
          state.noteTooltipEl.classList.add('show');
        }
      });
      tooltip.addEventListener('mouseleave', (event) => {
        if (state.noteTooltipTarget?.contains(event.relatedTarget)) return;
        ui.hideNoteTooltip();
      });
      state.uiRoot.appendChild(tooltip);
      state.noteTooltipEl = tooltip;
      return tooltip;
    },
    showNoteTooltip(button) {
      const note = String(button?.dataset?.note || '').trim();
      if (!note) return;

      const tooltip = ui.ensureNoteTooltip();
      if (!tooltip) return;

      const content = tooltip.querySelector('.acc-floating-note-tooltip-content');
      if (!content) return;

      state.noteTooltipItem?.classList.remove('acc-note-active');
      state.noteTooltipItem = button.closest('.acc-switch-item');
      state.noteTooltipItem?.classList.add('acc-note-active');
      content.textContent = note;
      tooltip.style.display = 'block';

      const buttonRect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const left = Math.max(8, buttonRect.left - tooltipRect.width - 8);
      const top = Math.min(
        Math.max(8, buttonRect.top - 4),
        window.innerHeight - tooltipRect.height - 8
      );
      const arrowTop = Math.min(
        Math.max(12, buttonRect.top - top + 6),
        tooltipRect.height - 12
      );

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.setProperty('--acc-note-arrow-top', `${arrowTop}px`);
      tooltip.classList.add('show');
      state.noteTooltipTarget = button;
    },
    hideNoteTooltip() {
      if (!state.noteTooltipEl) return;
      state.noteTooltipEl.classList.remove('show');
      state.noteTooltipEl.style.display = 'none';
      state.noteTooltipTarget = null;
      state.noteTooltipItem?.classList.remove('acc-note-active');
      state.noteTooltipItem = null;
    },
    shouldPreventWheelLeak(scrollArea, deltaY) {
      if (!scrollArea || scrollArea.scrollHeight <= scrollArea.clientHeight) {
        return true;
      }

      if (deltaY < 0 && scrollArea.scrollTop <= 0) {
        return true;
      }

      if (deltaY > 0 && scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 1) {
        return true;
      }

      return false;
    },
    getHosts() {
      const hosts = utils.listAllHosts();
      if (!hosts.includes(constants.HOST)) hosts.push(constants.HOST);
      return hosts;
    },
    resetHostPicker($, closePicker = true) {
      state.hostSearchQuery = '';
      state.hostEditingHost = null;
      state.hostEditingValue = '';
      if (closePicker) {
        $('#host-picker')?.classList.remove('open');
      }
    },
    bindPanelShellEvents({ $, $$ }) {
      ['keydown', 'keyup', 'keypress', 'input', 'contextmenu', 'wheel'].forEach((eventName) => {
        state.panel.addEventListener(
          eventName,
          (event) => {
            event.stopPropagation();
            if (eventName === 'wheel') {
              const scrollArea = event.target.closest('.acc-scroll-area, .acc-host-menu, .acc-host-list, .acc-floating-note-tooltip-content, .acc-input-note');
              if (ui.shouldPreventWheelLeak(scrollArea, event.deltaY)) {
                event.preventDefault();
              }
            }
          },
          { passive: false }
        );
      });

      $('#acc-close-btn').onclick = ui.closePanel;
      state.panel.onclick = (event) => {
        event.stopPropagation();
        if (document.activeElement !== state.panel && !state.panel.contains(state.uiRoot.activeElement)) {
          state.panel.focus();
        }
      };

      $$('.fab-mode-btn').forEach((button) => {
        button.addEventListener('click', () => {
          GM_setValue(constants.CFG.FAB_MODE, button.dataset.val);
          ui.refresh();
        });
      });

      $('#lang-sel').onchange = (event) => {
        const activePageBeforeRebuild = state.activePage;
        const isPanelShown = Boolean(state.panel && state.panel.classList.contains('show'));
        state.currentLang = event.target.value;
        GM_setValue(constants.CFG.LANG, state.currentLang);
        if (state.toastTimer) {
          clearTimeout(state.toastTimer);
        }
        document.body.removeChild(document.getElementById('anme-app-host'));
        state.uiRoot = null;
        state.panel = null;
        state.fab = null;
        state.dialogMask = null;
        state.saveFormMask = null;
        state.toastEl = null;
        state.toastTimer = null;
        ui.init();

        const newPanel = ui.qs('#acc-mgr-panel');
        if (!newPanel) return;

        if (isPanelShown) {
          newPanel.classList.add('show');
          ui.syncPanelPos();
        }
        ui.activatePage(activePageBeforeRebuild, ui.getPageTitle(activePageBeforeRebuild));
      };
    },
    bindSwitchEvents({ $, getHosts, resetHostPicker }) {
      $('#host-display-mode-sel').onchange = (event) => {
        state.hostDisplayMode = event.target.value || 'siteName';
        if (state.hostDisplayMode !== 'siteName') {
          state.hostEditingHost = null;
          state.hostEditingValue = '';
        }
        GM_setValue(constants.CFG.HOST_DISPLAY_MODE, state.hostDisplayMode);
        ui.refresh();
      };

      $('#switch-area').onclick = (event) => {
        if (event.target.closest('.acc-switch-handle')) {
          event.stopPropagation();
          return;
        }

        const avatarBtn = event.target.closest('.acc-card-name-icon');
        if (avatarBtn) {
          event.stopPropagation();
          ui.copyText(avatarBtn.dataset.name || '').then((copied) => {
            if (!copied) {
              ui.alert(utils.t('copy_failed'));
              return;
            }
            ui.showToast(utils.t('toast_copied'));
          });
          return;
        }

        const settingsBtn = event.target.closest('.acc-switch-settings-btn');
        if (settingsBtn) {
          event.stopPropagation();
          ui.openAccountSettings(settingsBtn.dataset.key);
          return;
        }

        const noteBtn = event.target.closest('.acc-switch-note-btn');
        if (noteBtn) {
          event.stopPropagation();
          return;
        }

        const tag = event.target.closest('.acc-click-tag');
        if (tag) {
          event.stopPropagation();
          const card = tag.closest('.acc-switch-card');
          core.inspectData(card.dataset.key, tag.dataset.type);
          return;
        }

        if (state.currentViewingHost !== constants.HOST) {
          event.stopPropagation();
          return;
        }

        const card = event.target.closest('.acc-switch-card');
        if (card) {
          core.loadAccount(card.dataset.key);
        }
      };

      $('#switch-area').addEventListener('mouseover', (event) => {
        const noteBtn = event.target.closest('.acc-switch-note-btn');
        if (!noteBtn) return;
        ui.showNoteTooltip(noteBtn);
      });

      $('#switch-area').addEventListener('mouseout', (event) => {
        const noteBtn = event.target.closest('.acc-switch-note-btn');
        if (!noteBtn) return;
        if (noteBtn.contains(event.relatedTarget) || state.noteTooltipEl?.contains(event.relatedTarget)) return;
        ui.hideNoteTooltip();
      });

      $('#switch-area').addEventListener('focusin', (event) => {
        const noteBtn = event.target.closest('.acc-switch-note-btn');
        if (!noteBtn) return;
        ui.showNoteTooltip(noteBtn);
      });

      $('#switch-area').addEventListener('focusout', (event) => {
        const noteBtn = event.target.closest('.acc-switch-note-btn');
        if (!noteBtn) return;
        if (noteBtn.contains(event.relatedTarget) || state.noteTooltipEl?.contains(event.relatedTarget)) return;
        ui.hideNoteTooltip();
      });

      $('#host-trigger').onclick = (event) => {
        event.stopPropagation();
        const picker = $('#host-picker');
        if (!picker) return;
        const willOpen = !picker.classList.contains('open');
        picker.classList.toggle('open', willOpen);
        if (willOpen) {
          resetHostPicker(false);
          ui.renderHostSelector(getHosts());
          ui.qs('#host-search-input')?.focus();
        }
      };

      $('#host-search-input').oninput = (event) => {
        state.hostSearchQuery = event.target.value;
        ui.renderHostSelector(getHosts());
        ui.qs('#host-search-input')?.focus();
        ui.qs('#host-search-input')?.setSelectionRange(state.hostSearchQuery.length, state.hostSearchQuery.length);
      };

      $('#host-search-input').onkeydown = (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        resetHostPicker();
        ui.renderHostSelector(getHosts());
        ui.qs('#host-search-input')?.blur();
        state.panel?.focus();
      };

      $('#host-menu').onclick = (event) => {
        const editToggle = event.target.closest('.acc-host-edit-link');
        if (editToggle) {
          event.stopPropagation();
          state.hostEditingHost = editToggle.dataset.editHost;
          state.hostEditingValue = utils.getSiteNameByHost(state.hostEditingHost);
          ui.renderHostSelector(getHosts());
          ui.qs(`.acc-host-edit-input[data-host="${state.hostEditingHost}"]`)?.focus();
          ui.qs(`.acc-host-edit-input[data-host="${state.hostEditingHost}"]`)?.select();
          return;
        }

        const editCancel = event.target.closest('.acc-host-edit-cancel');
        if (editCancel) {
          event.stopPropagation();
          state.hostEditingHost = null;
          state.hostEditingValue = '';
          ui.renderHostSelector(getHosts());
          return;
        }

        const editSave = event.target.closest('.acc-host-edit-save');
        if (editSave) {
          event.stopPropagation();
          const host = editSave.dataset.saveHost;
          core.updateSiteName(host, state.hostEditingValue);
          state.hostEditingHost = null;
          state.hostEditingValue = '';
          ui.refresh();
          ui.showToast(utils.t('toast_site_name_updated'));
          return;
        }

        const openLink = event.target.closest('.acc-host-open-link');
        if (openLink) {
          event.stopPropagation();
          const host = openLink.dataset.openHost;
          if (host) {
            window.open(`https://${host}`, '_blank', 'noopener,noreferrer');
          }
          return;
        }

        const option = event.target.closest('.acc-host-option');
        if (!option) return;

        state.currentViewingHost = option.dataset.host;
        resetHostPicker();
        ui.refresh();
      };

      $('#host-menu').addEventListener('input', (event) => {
        const editInput = event.target.closest('.acc-host-edit-input');
        if (!editInput) return;
        state.hostEditingValue = editInput.value;
      });

      $('#host-menu').addEventListener('keydown', (event) => {
        const editInput = event.target.closest('.acc-host-edit-input');
        if (!editInput) return;

        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          state.hostEditingHost = null;
          state.hostEditingValue = '';
          ui.renderHostSelector(getHosts());
          ui.qs('.acc-host-edit-input')?.blur();
          state.panel?.focus();
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          core.updateSiteName(editInput.dataset.host, editInput.value);
          state.hostEditingHost = null;
          state.hostEditingValue = '';
          ui.refresh();
          ui.showToast(utils.t('toast_site_name_updated'));
        }
      });

      $('#btn-account-search-toggle').onclick = (event) => {
        event.stopPropagation();
        state.accountSearchActive = !state.accountSearchActive;
        if (!state.accountSearchActive) {
          state.accountSearchQuery = '';
        }
        resetHostPicker();
        ui.refresh();
        if (state.accountSearchActive) {
          ui.qs('#account-search-input')?.focus();
        }
      };

      $('#account-search-input').oninput = (event) => {
        state.accountSearchQuery = event.target.value;
        ui.renderSwitchView();
      };

      $('#account-search-input').onkeydown = (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        state.accountSearchActive = false;
        state.accountSearchQuery = '';
        ui.refresh();
        ui.qs('#account-search-input')?.blur();
        state.panel?.focus();
      };

      state.panel.addEventListener('click', (event) => {
        if (event.target.closest('#host-picker')) return;
        resetHostPicker();
      });
    },
    bindNavigationEvents({ $, resetHostPicker }) {
      $('#btn-open-settings').onclick = () => {
        if (state.activePage !== 'pg-set') {
          state.settingsReturnPage = state.activePage;
        }
        ui.activatePage('pg-set', utils.t('nav_set'));
      };

      $('#btn-open-project').onclick = () => {
        window.open(constants.META.LINKS.PROJECT, '_blank', 'noopener,noreferrer');
      };

      $('#btn-open-webdav').onclick = () => {
        state.settingsReturnPage = state.activePage || 'pg-switch';
        ui.activatePage('pg-webdav', utils.t('nav_webdav'));
      };

      $('#btn-go-current-host').onclick = () => {
        state.currentViewingHost = constants.HOST;
        resetHostPicker();
        ui.refresh();
      };

      $('#btn-header-back').onclick = () => {
        if (state.activePage === 'pg-notice' || state.activePage === 'pg-about') {
          ui.activatePage('pg-set', utils.t('nav_set'));
          return;
        }

        if (state.activePage === 'pg-account-settings') {
          const targetPage = state.accountSettingsReturnPage || 'pg-switch';
          ui.activatePage(targetPage, ui.getPageTitle(targetPage));
          return;
        }

        const targetPage = state.settingsReturnPage || 'pg-switch';
        ui.activatePage(targetPage, ui.getPageTitle(targetPage));
      };

      $('#go-about').onclick = () => {
        ui.activatePage('pg-about', utils.t('nav_about'));
      };

      $('#go-notice').onclick = () => {
        ui.activatePage('pg-notice', utils.t('nav_notice'));
      };
    },
    bindAccountSettingsEvents({ $ }) {
      $('#btn-open-save-modal').onclick = () => {
        ui.showSaveAccountModal();
      };

      $('#btn-clean-env').onclick = async () => {
        if (await ui.confirm(utils.t('confirm_clean'))) {
          core.cleanEnvironment();
        }
      };

      $('#btn-export-curr').onclick = () => core.exportData('current');
      $('#btn-export-all').onclick = () => core.exportData('all');
      $('#btn-import-trigger').onclick = () => $('#inp-import-file').click();

      $('#btn-account-rename-save').onclick = async () => {
        const oldKey = state.accountSettingsKey;
        const nameInput = $('#account-settings-name');
        const noteInput = $('#account-settings-note');
        if (!oldKey || !nameInput || !noteInput) return;

        const newName = nameInput.value.trim();
        const newNote = utils.normalizeNoteText(noteInput.value);
        const targetHost = state.accountSettingsHost || constants.HOST;
        const originalName = utils.extractName(oldKey);
        const originalNote = utils.normalizeNoteText(GM_getValue(oldKey)?.note);
        if (!newName || (newName === originalName && newNote === originalNote)) return;

        const newKey = utils.makeKey(newName, targetHost);
        if (newKey !== oldKey && GM_getValue(newKey)) {
          await ui.alert(utils.t('rename_conflict'));
          return;
        }

        state.accountSettingsKey = core.updateAccount(oldKey, { name: newName, note: newNote }, targetHost);
        ui.refresh();
        ui.activatePage('pg-account-settings', utils.t('account_settings'));
        ui.showToast(utils.t('toast_account_updated'));
      };

      $('#btn-account-delete').onclick = async () => {
        const key = state.accountSettingsKey;
        if (!key) return;

        if (await ui.confirm(utils.t('confirm_delete'))) {
          core.deleteAccount(key, state.accountSettingsHost || constants.HOST);
          state.accountSettingsKey = null;
          ui.refresh();
          const targetPage = state.accountSettingsReturnPage || 'pg-switch';
          ui.activatePage(targetPage, ui.getPageTitle(targetPage));
          ui.showToast(utils.t('toast_deleted'));
        }
      };

      $('#inp-import-file').onchange = (event) => {
        if (event.target.files.length) {
          core.importData(event.target.files[0]);
        }
        event.target.value = '';
      };

      $('#btn-clear-all').onclick = async () => {
        if (await ui.confirm(utils.t('confirm_clear_all'))) {
          core.clearAllData();
          ui.refresh();
        }
      };
    },
    bindWebDavEvents({ $ }) {
      $('#btn-webdav-config').onclick = async () => {
        await ui.showWebDavConfigModal();
      };

      $('#btn-webdav-sync').onclick = async () => {
        const syncBtn = $('#btn-webdav-sync');
        await ui.runUiAction({
          button: syncBtn,
          idleText: utils.t('webdav_sync_now'),
          errorKey: 'webdav_sync_err',
          successMessage: utils.t('webdav_sync_ok'),
          action: () => core.uploadWebDavBackup(),
          onSuccess: (fileName) => {
            if (fileName) {
              state.webdavBackups = core.getCachedWebDavBackups();
              ui.renderWebDavBackupList(state.webdavBackups);
            }
          }
        });
      };

      $('#btn-webdav-refresh').onclick = async () => {
        await ui.loadWebDavBackups();
      };

      $('#btn-webdav-logout').onclick = async () => {
        if (!core.hasWebDavConfig()) return;
        const confirmed = await ui.confirm(utils.t('webdav_logout_confirm'));
        if (!confirmed) return;
        core.clearWebDavConfig();
        state.webdavBackups = [];
        ui.renderWebDavView();
        ui.showToast(utils.t('webdav_logout_ok'));
      };

      $('#webdav-backup-list').onclick = async (event) => {
        const actionBtn = event.target.closest('[data-action][data-file]');
        if (!actionBtn) return;
        event.preventDefault();
        event.stopPropagation();

        const fileName = actionBtn.dataset.file;
        const action = actionBtn.dataset.action;
        if (!fileName || !action) return;

        if (action === 'delete') {
          const confirmed = await ui.confirm(utils.t('webdav_delete_confirm').replace('{name}', fileName));
          if (!confirmed) return;
          await ui.runUiAction({
            loadingText: utils.t('webdav_loading'),
            errorKey: 'webdav_delete_err',
            successMessage: utils.t('webdav_delete_ok'),
            action: () => core.deleteWebDavBackup(fileName),
            onSuccess: () => {
              state.webdavBackups = core.getCachedWebDavBackups();
              ui.renderWebDavBackupList(state.webdavBackups);
            }
          });
          return;
        }

        if (action === 'restore') {
          const confirmed = await ui.confirm(utils.t('webdav_restore_confirm').replace('{name}', fileName));
          if (!confirmed) return;
          await ui.runUiAction({
            loadingText: utils.t('webdav_restoring'),
            errorKey: 'sync_restore_err',
            action: () => core.restoreWebDavBackup(fileName),
            onSuccess: (result) => {
              ui.showToast(utils.t(result.messageKey).replace('{count}', result.count), 2400);
            }
          });
        }
      };
    },
    bindPanelEvents() {
      const $ = (selector) => ui.qs(selector);
      const $$ = (selector) => ui.qsa(selector);
      const getHosts = () => ui.getHosts();
      const resetHostPicker = (closePicker = true) => {
        ui.resetHostPicker($, closePicker);
      };

      ui.bindPanelShellEvents({ $, $$ });
      ui.bindSwitchEvents({ $, getHosts, resetHostPicker });
      ui.bindNavigationEvents({ $, resetHostPicker });
      ui.bindAccountSettingsEvents({ $ });
      ui.bindWebDavEvents({ $ });
    }
  };
}
