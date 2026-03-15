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
    setButtonLoading(button, loading, idleText = '', spinnerClassName = 'acc-inline-spinner') {
      if (!button) return;
      if (loading) {
        button.style.minWidth = `${button.offsetWidth}px`;
        button.style.minHeight = `${button.offsetHeight}px`;
      }
      button.disabled = loading;
      button.classList.toggle('is-loading', loading);
      button.innerHTML = loading ? `<span class="${spinnerClassName}" aria-hidden="true"></span>` : idleText;
      if (!loading) {
        button.style.minWidth = '';
        button.style.minHeight = '';
      }
    },
    async runUiAction({
      button = null,
      idleText = '',
      loadingText = '',
      errorKey = '',
      successMessage = '',
      successDuration = 1800,
      action,
      onSuccess,
      onError
    }) {
      try {
        if (button) {
          ui.setButtonLoading(button, true, idleText);
        } else if (loadingText) {
          ui.toggleLoading(true, loadingText);
        }

        const result = await action();
        if (onSuccess) {
          await onSuccess(result);
        }
        if (successMessage) {
          ui.showToast(successMessage, successDuration);
        }
        return result;
      } catch (error) {
        if (onError) {
          const handled = await onError(error);
          if (handled === false) {
            return null;
          }
        }
        ui.showToast(utils.getWebDavErrorMessage(error, errorKey));
        return null;
      } finally {
        if (button) {
          ui.setButtonLoading(button, false, idleText);
        } else if (loadingText) {
          ui.toggleLoading(false);
        }
      }
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
    ensureFormMask() {
      if (state.saveFormMask) return state.saveFormMask;
      state.saveFormMask = document.createElement('div');
      state.saveFormMask.className = 'acc-form-mask';
      state.panel.appendChild(state.saveFormMask);
      return state.saveFormMask;
    },
    hideFormModal() {
      if (state.saveFormMask) {
        state.saveFormMask.style.display = 'none';
      }
    },
    async showFormModal({ title, contentHtml, submitText, onOpen }) {
      const mask = ui.ensureFormMask();
      mask.innerHTML = `
        <div class="acc-form-box">
          <div class="acc-form-title">${title}</div>
          ${contentHtml}
          <div class="acc-form-footer">
            <button class="acc-dialog-btn acc-dialog-btn-cancel" id="acc-form-cancel">${utils.t('dlg_cancel')}</button>
            <button class="acc-dialog-btn acc-dialog-btn-ok" id="acc-form-submit">${submitText}</button>
          </div>
        </div>
      `;
      mask.style.display = 'flex';

      const context = {
        mask,
        qs: (selector) => mask.querySelector(selector),
        qsa: (selector) => [...mask.querySelectorAll(selector)],
        cancelBtn: mask.querySelector('#acc-form-cancel'),
        submitBtn: mask.querySelector('#acc-form-submit'),
        close: () => ui.hideFormModal(),
        setSubmitting: (loading, idleText = submitText) => {
          if (context.cancelBtn) {
            context.cancelBtn.disabled = loading;
          }
          ui.setButtonLoading(context.submitBtn, loading, idleText);
        }
      };

      if (context.cancelBtn) {
        context.cancelBtn.onclick = context.close;
      }

      if (onOpen) {
        await onOpen(context);
      }

      return context;
    },
    async showSaveAccountModal() {
      await ui.showFormModal({
        title: utils.t('btn_save'),
        submitText: utils.t('btn_save'),
        contentHtml: `
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
        `,
        onOpen: async ({ qs, submitBtn, close }) => {
          const nameInput = qs('#form-acc-name');
          const siteNameInput = qs('#form-site-name');
          siteNameInput.value = utils.suggestSiteName(utils.getPageTitle(), constants.HOST);
          nameInput.value = utils.suggestAccountName(constants.HOST);

          const toggleAvailability = (selector, available) => {
            const input = qs(selector);
            const label = input?.closest('.acc-chk-label');
            if (!input || !label) return;

            input.disabled = !available;
            input.checked = available && input.id === 'form-c-ck';
            label.classList.toggle('disabled', !available);
          };

          const updateState = () => {
            const ck = qs('#form-c-ck')?.checked;
            const ls = qs('#form-c-ls')?.checked;
            const ss = qs('#form-c-ss')?.checked;
            const canSave =
              (ck || ls || ss) && nameInput.value.trim().length > 0 && siteNameInput.value.trim().length > 0;
            submitBtn.disabled = !canSave;
          };

          ['#form-c-ck', '#form-c-ls', '#form-c-ss'].forEach((selector) => {
            qs(selector)?.addEventListener('change', updateState);
          });

          siteNameInput.addEventListener('input', updateState);
          nameInput.addEventListener('input', updateState);
          nameInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || submitBtn.disabled) return;
            event.preventDefault();
            event.stopPropagation();
            submitBtn.click();
          });

          submitBtn.onclick = async () => {
            const name = nameInput.value.trim();
            const siteName = siteNameInput.value.trim();
            if (!name || !siteName) return;

            const targetKey = utils.makeKey(name);
            if (GM_getValue(targetKey)) {
              const confirmed = await ui.confirm(utils.t('confirm_overwrite'));
              if (!confirmed) return;
            }

            const saved = await core.saveAccount(name, siteName, {
              ck: qs('#form-c-ck').checked,
              ls: qs('#form-c-ls').checked,
              ss: qs('#form-c-ss').checked
            });
            if (!saved) return;

            close();
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
      });
    },
    async showWebDavConfigModal() {
      const config = core.getWebDavConfig();
      await ui.showFormModal({
        title: utils.t('nav_webdav'),
        submitText: utils.t('webdav_verify_save'),
        contentHtml: `
          <div class="acc-form-label">${utils.t('webdav_url')}</div>
          <input type="text" id="form-webdav-url" class="acc-input-text" placeholder="${utils.t('webdav_url_placeholder')}" value="${utils.escapeHtml(config.url)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('webdav_username')}</div>
          <input type="text" id="form-webdav-username" class="acc-input-text" placeholder="${utils.t('webdav_username_placeholder')}" value="${utils.escapeHtml(config.username)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('webdav_password')}</div>
          <input type="password" id="form-webdav-password" class="acc-input-text" placeholder="${utils.t('webdav_password_placeholder')}" value="${utils.escapeHtml(config.password)}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
        `,
        onOpen: async ({ qs, submitBtn, setSubmitting, close }) => {
          const urlInput = qs('#form-webdav-url');
          const usernameInput = qs('#form-webdav-username');
          const passwordInput = qs('#form-webdav-password');
          let isSaving = false;

          const updateState = () => {
            const canSave =
              urlInput.value.trim().length > 0 &&
              usernameInput.value.trim().length > 0 &&
              passwordInput.value.length > 0;
            [urlInput, usernameInput, passwordInput].forEach((input) => {
              input.disabled = isSaving;
            });
            setSubmitting(isSaving, utils.t('webdav_verify_save'));
            if (!isSaving) {
              submitBtn.disabled = !canSave;
            }
          };
          const setSavingState = (saving) => {
            isSaving = saving;
            updateState();
          };

          [urlInput, usernameInput, passwordInput].forEach((input) => {
            input.addEventListener('input', updateState);
            input.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' && !submitBtn.disabled) {
                event.preventDefault();
                submitBtn.click();
              }
            });
          });

          submitBtn.onclick = async () => {
            const nextConfig = {
              url: urlInput.value.trim(),
              username: usernameInput.value.trim(),
              password: passwordInput.value
            };
            try {
              setSavingState(true);
              const validatedConfig = await core.validateWebDavConfig(nextConfig);
              core.saveWebDavConfig(validatedConfig);
              close();
              state.webdavBackups = core.getCachedWebDavBackups();
              ui.renderWebDavView();
              ui.showToast(utils.t('webdav_verified'));
            } catch (error) {
              setSavingState(false);
              ui.showToast(utils.getWebDavErrorMessage(error, 'webdav_verify_err'));
              return;
            }
            setSavingState(false);
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
      });
    }
  };
}
