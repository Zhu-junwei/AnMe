export function createFeedbackMethods({ state, constants, utils, core, ui }) {
  return {
    async copyText(text) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch {}

      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.setAttribute('readonly', 'true');
      tempInput.style.position = 'fixed';
      tempInput.style.top = '-9999px';
      tempInput.style.left = '-9999px';
      document.body.appendChild(tempInput);
      tempInput.select();

      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }

      document.body.removeChild(tempInput);
      return copied;
    },
    showToast(message, duration = 1800) {
      if (!state.panel || !message) return;

      if (!state.toastEl) {
        state.toastEl = document.createElement('div');
        state.toastEl.className = 'acc-toast';
        state.toastEl.innerHTML = `
          <span class="acc-toast-icon">${constants.ICONS.NOTICE}</span>
          <span class="acc-toast-text"></span>
        `;
        state.panel.appendChild(state.toastEl);
      }

      const textNode = state.toastEl.querySelector('.acc-toast-text');
      if (textNode) textNode.textContent = message;

      state.toastEl.classList.add('show');
      if (state.toastTimer) {
        clearTimeout(state.toastTimer);
      }

      state.toastTimer = setTimeout(() => {
        if (state.toastEl) {
          state.toastEl.classList.remove('show');
        }
        state.toastTimer = null;
      }, duration);
    },
    async alert(message) {
      return ui.showDialog(message, false);
    },
    async confirm(message) {
      return ui.showDialog(message, true);
    },
    showDialog(message, isConfirm) {
      return new Promise((resolve) => {
        if (!state.dialogMask) {
          const currentPanel = ui.qs('.acc-panel');
          state.dialogMask = document.createElement('div');
          state.dialogMask.className = 'acc-dialog-mask';
          currentPanel.appendChild(state.dialogMask);
        }

        state.dialogMask.innerHTML = `
          <div class="acc-dialog-box">
              <div class="acc-dialog-msg">${message}</div>
              <div class="acc-dialog-footer">
                  ${isConfirm ? `<button class="acc-dialog-btn acc-dialog-btn-cancel" id="acc-dlg-cancel">${utils.t('dlg_cancel')}</button>` : ''}
                  <button class="acc-dialog-btn acc-dialog-btn-ok" id="acc-dlg-ok">${utils.t('dlg_ok')}</button>
              </div>
          </div>
        `;
        state.dialogMask.style.display = 'flex';

        const okBtn = ui.qs('#acc-dlg-ok');
        const cancelBtn = ui.qs('#acc-dlg-cancel');
        const close = (result) => {
          state.dialogMask.style.display = 'none';
          resolve(result);
        };

        okBtn.onclick = () => close(true);
        if (cancelBtn) cancelBtn.onclick = () => close(false);
      });
    },
    async showSaveAccountModal() {
      if (!state.saveFormMask) {
        state.saveFormMask = document.createElement('div');
        state.saveFormMask.className = 'acc-form-mask';
        state.panel.appendChild(state.saveFormMask);
      }

      state.saveFormMask.innerHTML = `
        <div class="acc-form-box">
          <div class="acc-form-title">${utils.t('btn_save')}</div>
          <div class="acc-chk">
            <label class="acc-chk-label" title="Cookie"><input type="checkbox" id="form-c-ck" class="acc-custom-chk" checked> Cookie</label>
            <label class="acc-chk-label" title="LocalStorage"><input type="checkbox" id="form-c-ls" class="acc-custom-chk"> LS</label>
            <label class="acc-chk-label" title="SessionStorage"><input type="checkbox" id="form-c-ss" class="acc-custom-chk"> SS</label>
            <span class="acc-help-tip" title="${utils.t('tip_help')}">${constants.ICONS.HELP}</span>
            <span class="acc-lock-tip" title="${utils.t('tip_lock')}">${constants.ICONS.LOCK}</span>
          </div>
          <div class="acc-form-label">${utils.t('site_name')}</div>
          <input type="text" id="form-site-name" class="acc-input-text" placeholder="${utils.t('placeholder_site_name')}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('account_name')}</div>
          <input type="text" id="form-acc-name" class="acc-input-text" placeholder="${utils.t('placeholder_name')}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-footer">
            <button class="acc-dialog-btn acc-dialog-btn-cancel" id="form-cancel-btn">${utils.t('dlg_cancel')}</button>
            <button class="acc-dialog-btn acc-dialog-btn-ok" id="form-save-btn">${utils.t('btn_save')}</button>
          </div>
        </div>
      `;

      state.saveFormMask.style.display = 'flex';

      const nameInput = ui.qs('#form-acc-name');
      const siteNameInput = ui.qs('#form-site-name');
      siteNameInput.value = utils.suggestSiteName(utils.getPageTitle(), constants.HOST);
      nameInput.value = utils.suggestAccountName(constants.HOST);
      const toggleAvailability = (selector, available) => {
        const input = ui.qs(selector);
        const label = input?.closest('.acc-chk-label');
        if (!input || !label) return;

        input.disabled = !available;
        input.checked = available && input.id === 'form-c-ck';
        label.classList.toggle('disabled', !available);
      };
      const updateState = () => {
        const ck = ui.qs('#form-c-ck')?.checked;
        const ls = ui.qs('#form-c-ls')?.checked;
        const ss = ui.qs('#form-c-ss')?.checked;
        const saveBtn = ui.qs('#form-save-btn');
        if (!saveBtn) return;

        const canSave =
          (ck || ls || ss) && nameInput.value.trim().length > 0 && siteNameInput.value.trim().length > 0;
        saveBtn.disabled = !canSave;
        saveBtn.style.opacity = canSave ? '1' : '0.5';
        saveBtn.style.cursor = canSave ? 'pointer' : 'not-allowed';
      };

      ['#form-c-ck', '#form-c-ls', '#form-c-ss'].forEach((id) => {
        ui.qs(id).addEventListener('change', updateState);
      });

      siteNameInput.addEventListener('input', updateState);
      nameInput.addEventListener('input', updateState);
      nameInput.addEventListener('keydown', async (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        event.stopPropagation();
        ui.qs('#form-save-btn').click();
      });

      ui.qs('#form-cancel-btn').onclick = () => {
        state.saveFormMask.style.display = 'none';
      };

      ui.qs('#form-save-btn').onclick = async () => {
        const name = nameInput.value.trim();
        const siteName = siteNameInput.value.trim();
        if (!name) return;
        if (!siteName) return;

        const targetKey = utils.makeKey(name);
        if (GM_getValue(targetKey)) {
          const confirmed = await ui.confirm(utils.t('confirm_overwrite'));
          if (!confirmed) return;
        }

        const saved = await core.saveAccount(name, siteName, {
          ck: ui.qs('#form-c-ck').checked,
          ls: ui.qs('#form-c-ls').checked,
          ss: ui.qs('#form-c-ss').checked
        });

        if (!saved) return;

        state.saveFormMask.style.display = 'none';
        ui.refresh();
        ui.showToast(utils.t('toast_saved'));
      };

      const availableSources = await core.detectAvailableSnapshotSources();
      toggleAvailability('#form-c-ck', availableSources.ck);
      toggleAvailability('#form-c-ls', availableSources.ls);
      toggleAvailability('#form-c-ss', availableSources.ss);

      updateState();
      if (utils.getSortedKeysByHost(constants.HOST).length > 0) {
        nameInput.focus();
        nameInput.select();
      } else {
        siteNameInput.focus();
        siteNameInput.select();
      }
    }
    ,
    async showWebDavConfigModal() {
      if (!state.saveFormMask) {
        state.saveFormMask = document.createElement('div');
        state.saveFormMask.className = 'acc-form-mask';
        state.panel.appendChild(state.saveFormMask);
      }

      const config = core.getWebDavConfig();
      state.saveFormMask.innerHTML = `
        <div class="acc-form-box">
          <div class="acc-form-title">${utils.t('nav_webdav')}</div>
          <div class="acc-form-label">${utils.t('webdav_url')}</div>
          <input type="text" id="form-webdav-url" class="acc-input-text" placeholder="${utils.t('webdav_url_placeholder')}" value="${utils.escapeHtml(config.url)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('webdav_username')}</div>
          <input type="text" id="form-webdav-username" class="acc-input-text" placeholder="${utils.t('webdav_username_placeholder')}" value="${utils.escapeHtml(config.username)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('webdav_password')}</div>
          <input type="password" id="form-webdav-password" class="acc-input-text" placeholder="${utils.t('webdav_password_placeholder')}" value="${utils.escapeHtml(config.password)}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-footer">
            <button class="acc-dialog-btn acc-dialog-btn-cancel" id="form-webdav-cancel">${utils.t('dlg_cancel')}</button>
            <button class="acc-dialog-btn acc-dialog-btn-ok" id="form-webdav-save">${utils.t('webdav_verify_save')}</button>
          </div>
        </div>
      `;
      state.saveFormMask.style.display = 'flex';

      const urlInput = ui.qs('#form-webdav-url');
      const usernameInput = ui.qs('#form-webdav-username');
      const passwordInput = ui.qs('#form-webdav-password');
      const saveBtn = ui.qs('#form-webdav-save');

      const updateState = () => {
        const canSave =
          urlInput.value.trim().length > 0 &&
          usernameInput.value.trim().length > 0 &&
          passwordInput.value.length > 0;
        saveBtn.disabled = !canSave;
        saveBtn.style.opacity = canSave ? '1' : '0.5';
        saveBtn.style.cursor = canSave ? 'pointer' : 'not-allowed';
      };

      [urlInput, usernameInput, passwordInput].forEach((input) => {
        input.addEventListener('input', updateState);
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && !saveBtn.disabled) {
            event.preventDefault();
            saveBtn.click();
          }
        });
      });

      ui.qs('#form-webdav-cancel').onclick = () => {
        state.saveFormMask.style.display = 'none';
      };

      saveBtn.onclick = async () => {
        const nextConfig = {
          url: urlInput.value.trim(),
          username: usernameInput.value.trim(),
          password: passwordInput.value
        };
        try {
          const resolvedConfig = await core.validateWebDavConfig(nextConfig);
          core.saveWebDavConfig(resolvedConfig);
          state.saveFormMask.style.display = 'none';
          state.webdavBackups = core.getCachedWebDavBackups();
          ui.renderWebDavView();
          ui.showToast(utils.t('webdav_verified'));
        } catch (error) {
          await ui.alert(error.message || utils.t('webdav_verify_err'));
        }
      };

      updateState();
      if (config.username) {
        usernameInput.focus();
        usernameInput.select();
      } else {
        urlInput.focus();
        urlInput.select();
      }
    }
  };
}
