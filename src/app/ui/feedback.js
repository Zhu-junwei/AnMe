function createSaveNoteSyncState(syncState = {}) {
  return {
    lastMatchedKey: '',
    lastAutoFilledNote: '',
    lockedKey: '',
    ...syncState
  };
}

const getCookieSelectionKey = (cookie) =>
  [cookie?.name || '', cookie?.domain || '', cookie?.path || ''].join('\u0001');

const getStorageEntries = (storageData) =>
  Object.entries(storageData || {}).map(([key, value]) => ({
    key,
    title: key,
    value: value ?? '',
    meta: ''
  }));

const getCookieEntries = (cookies) =>
  (Array.isArray(cookies) ? cookies : []).map((cookie) => {
    return {
      key: getCookieSelectionKey(cookie),
      title: cookie.name || '',
      value: cookie.value ?? '',
      cookie,
      isExpired: typeof cookie.expirationDate === 'number' && cookie.expirationDate * 1000 < Date.now()
    };
  });

const getInspectorEntries = (type, data) => (type === 'cookies' ? getCookieEntries(data) : getStorageEntries(data));

const formatInspectorValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getCookieCellValue = (cookie, column) => {
  if (column === 'expirationDate') {
    return typeof cookie.expirationDate === 'number'
      ? new Date(cookie.expirationDate * 1000).toLocaleString()
      : 'Session';
  }
  return formatInspectorValue(cookie[column]);
};

const getCookieColumns = (entries) => {
  const preferredColumns = ['name', 'value', 'domain', 'path', 'expirationDate', 'httpOnly', 'secure', 'sameSite'];
  const actualColumns = new Set();
  entries.forEach((entry) => {
    Object.keys(entry.cookie || {}).forEach((column) => {
      if (column !== 'partitionKey') {
        actualColumns.add(column);
      }
    });
  });
  return [
    ...preferredColumns.filter((column) => actualColumns.has(column)),
    ...[...actualColumns].filter((column) => !preferredColumns.includes(column))
  ];
};

const getCookieColumnWidth = (column) => {
  if (column === 'value') return 360;
  if (column === 'name') return 160;
  if (column === 'domain' || column === 'path') return 140;
  if (column === 'expirationDate') return 150;
  if (column === 'httpOnly' || column === 'secure') return 70;
  if (column === 'sameSite') return 96;
  return 120;
};

const canScrollInDirection = (element, deltaX, deltaY) => {
  const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
  if (isHorizontal) {
    if (element.scrollWidth <= element.clientWidth + 1) return false;
    return deltaX < 0
      ? element.scrollLeft > 0
      : element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
  }

  if (element.scrollHeight <= element.clientHeight + 1) return false;
  return deltaY < 0
    ? element.scrollTop > 0
    : element.scrollTop + element.clientHeight < element.scrollHeight - 1;
};

const canScrollInside = (target, boundary, deltaX, deltaY) => {
  let element = target instanceof Element ? target : target?.parentElement;
  while (element && element !== boundary) {
    if (canScrollInDirection(element, deltaX, deltaY)) {
      return true;
    }
    element = element.parentElement;
  }
  return false;
};

const containDataInspectorWheel = (event, boundary) => {
  event.stopPropagation();
  if (!canScrollInside(event.target, boundary, event.deltaX, event.deltaY)) {
    event.preventDefault();
  }
};

const setupCellInputSelectionAssist = (mask) => {
  mask.__anmeCellInputSelectionCleanup?.();

  let activeInput = null;
  let pointerX = 0;
  let animationFrame = null;
  const cleanupFns = [];

  const stop = () => {
    activeInput = null;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };

  const step = () => {
    if (!activeInput) return;

    const rect = activeInput.getBoundingClientRect();
    const edgeSize = Math.min(32, Math.max(16, rect.width * 0.18));
    let speed = 0;
    if (pointerX < rect.left + edgeSize) {
      speed = -Math.max(1, ((rect.left + edgeSize - pointerX) / edgeSize) * 14);
    } else if (pointerX > rect.right - edgeSize) {
      speed = Math.max(1, ((pointerX - (rect.right - edgeSize)) / edgeSize) * 14);
    }

    if (speed) {
      activeInput.scrollLeft += speed;
    }
    animationFrame = requestAnimationFrame(step);
  };

  const addListener = (target, eventName, listener) => {
    target.addEventListener(eventName, listener);
    cleanupFns.push(() => target.removeEventListener(eventName, listener));
  };

  mask.querySelectorAll('.acc-cell-input').forEach((input) => {
    addListener(input, 'mousedown', (event) => {
      if (event.button !== 0 || input.scrollWidth <= input.clientWidth + 1) return;
      activeInput = input;
      pointerX = event.clientX;
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(step);
      }
    });
  });

  addListener(mask, 'mousemove', (event) => {
    if (!activeInput) return;
    if ((event.buttons & 1) !== 1) {
      stop();
      return;
    }
    pointerX = event.clientX;
  });
  addListener(mask, 'mouseup', stop);
  addListener(mask, 'mouseleave', stop);

  mask.__anmeCellInputSelectionCleanup = () => {
    stop();
    cleanupFns.forEach((cleanup) => cleanup());
    mask.__anmeCellInputSelectionCleanup = null;
  };
};

export function syncSaveNoteFromMatchedAccount({
  name,
  currentNote,
  syncState,
  getExistingAccount,
  normalizeName,
  normalizeNote
}) {
  const nextState = createSaveNoteSyncState(syncState);
  const normalizedName = normalizeName(name);
  const normalizedCurrentNote = normalizeNote(currentNote);
  const shouldClearAutoFilledNote =
    nextState.lastMatchedKey &&
    nextState.lockedKey !== nextState.lastMatchedKey &&
    normalizedCurrentNote === nextState.lastAutoFilledNote;

  if (!normalizedName) {
    return {
      nextNote: shouldClearAutoFilledNote ? '' : currentNote,
      nextState: {
        ...nextState,
        lastMatchedKey: '',
        lastAutoFilledNote: shouldClearAutoFilledNote ? '' : nextState.lastAutoFilledNote
      }
    };
  }

  const existingAccount = getExistingAccount(normalizedName);
  if (!existingAccount) {
    return {
      nextNote: shouldClearAutoFilledNote ? '' : currentNote,
      nextState: {
        ...nextState,
        lastMatchedKey: '',
        lastAutoFilledNote: shouldClearAutoFilledNote ? '' : nextState.lastAutoFilledNote
      }
    };
  }

  const existingKey = existingAccount.key || normalizedName;
  if (nextState.lockedKey === existingKey) {
    return {
      nextNote: currentNote,
      nextState: {
        ...nextState,
        lastMatchedKey: existingKey
      }
    };
  }

  const existingNote = normalizeNote(existingAccount.note);
  return {
    nextNote: existingNote,
    nextState: {
      lastMatchedKey: existingKey,
      lastAutoFilledNote: existingNote,
      lockedKey: ''
    }
  };
}

export function trackSaveNoteManualEdit({ currentNote, syncState, normalizeNote }) {
  const nextState = createSaveNoteSyncState(syncState);
  if (!nextState.lastMatchedKey) {
    return nextState;
  }

  return {
    ...nextState,
    lockedKey:
      normalizeNote(currentNote) === nextState.lastAutoFilledNote ? '' : nextState.lastMatchedKey
  };
}

export function resolveWebDavPasswordForSubmit({
  hasSavedPassword,
  passwordDirty,
  passwordInputValue,
  savedPassword
}) {
  if (!hasSavedPassword) {
    return String(passwordInputValue || '');
  }

  if (!passwordDirty) {
    return String(savedPassword || '');
  }

  return String(passwordInputValue || '');
}

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
        utils.setHTML(state.toastEl, `
          <span class="acc-toast-icon">${constants.ICONS.NOTICE}</span>
          <span class="acc-toast-text"></span>
        `);
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
      utils.setHTML(button, loading ? `<span class="${spinnerClassName}" aria-hidden="true"></span>` : idleText);
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

        utils.setHTML(state.dialogMask, `
          <div class="acc-dialog-box">
              <div class="acc-dialog-msg">${message}</div>
              <div class="acc-dialog-footer">
                  ${isConfirm ? `<button class="acc-dialog-btn acc-dialog-btn-cancel" id="acc-dlg-cancel">${utils.t('dlg_cancel')}</button>` : ''}
                  <button class="acc-dialog-btn acc-dialog-btn-ok" id="acc-dlg-ok">${utils.t('dlg_ok')}</button>
              </div>
          </div>
        `);
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
    ensureDataInspectorMask() {
      if (state.dataInspectorMask) return state.dataInspectorMask;
      state.dataInspectorMask = document.createElement('div');
      state.dataInspectorMask.className = 'acc-data-mask';
      state.dataInspectorMask.addEventListener('click', (event) => event.stopPropagation());
      state.dataInspectorMask.addEventListener(
        'wheel',
        (event) => containDataInspectorWheel(event, state.dataInspectorMask),
        { passive: false }
      );
      state.uiRoot.appendChild(state.dataInspectorMask);
      return state.dataInspectorMask;
    },
    hideDataInspector() {
      if (state.dataInspectorMask) {
        state.dataInspectorMask.style.display = 'none';
      }
    },
    showDataInspector({ title, type, data, selectable = false, selectedKeys = [] }) {
      return new Promise((resolve) => {
        const mask = ui.ensureDataInspectorMask();
        const entries = getInspectorEntries(type, data);
        const isCookieData = type === 'cookies';
        const cookieColumns = isCookieData ? getCookieColumns(entries) : [];
        const cookieTableWidth = cookieColumns.reduce(
          (width, column) => width + getCookieColumnWidth(column),
          selectable ? 34 : 0
        );
        const storageTableWidth = selectable ? 674 : 640;
        const selectedSet = new Set(selectedKeys);
        const selectedCountText = () => `${mask.querySelectorAll('.acc-data-check:checked').length}/${entries.length}`;
        const checkboxHtml = (entry, index) =>
          selectable
            ? `<input type="checkbox" class="acc-custom-chk acc-data-check" data-index="${index}" ${selectedSet.has(entry.key) ? 'checked' : ''}>`
            : '';
        const selectAllHtml = selectable
          ? '<input type="checkbox" class="acc-custom-chk acc-data-check-all" checked>'
          : '';
        const renderCookieTable = () => `
          <div class="acc-cookie-table-wrap">
            <table class="acc-cookie-table" style="min-width:${cookieTableWidth}px">
              <colgroup>
                ${selectable ? `<col class="acc-cookie-check-col" style="width:${(34 / cookieTableWidth) * 100}%">` : ''}
                ${cookieColumns
                  .map(
                    (column) =>
                      `<col class="${column === 'value' ? 'acc-cookie-value-col' : ''}" style="width:${(getCookieColumnWidth(
                        column
                      ) /
                        cookieTableWidth) *
                        100}%">`
                  )
                  .join('')}
              </colgroup>
              <thead>
                <tr>
                  ${selectable ? `<th class="acc-cookie-check-col">${selectAllHtml}</th>` : ''}
                  ${cookieColumns.map((column) => `<th>${utils.escapeHtml(column)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${entries
                  .map(
                    (entry, index) => `
                      <tr>
                        ${selectable ? `<td class="acc-cookie-check-col">${checkboxHtml(entry, index)}</td>` : ''}
                        ${cookieColumns
                          .map(
                            (column) =>
                              `<td><input type="text" class="acc-cell-input" readonly value="${utils.escapeHtml(
                                getCookieCellValue(entry.cookie || {}, column)
                              )}"></td>`
                          )
                          .join('')}
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
        const renderStorageList = () => `
          <div class="acc-storage-table-wrap">
            <table class="acc-storage-table" style="min-width:${storageTableWidth}px">
              <colgroup>
                ${selectable ? '<col class="acc-storage-check-col" style="width:5%">' : ''}
                <col class="acc-storage-key-col" style="width:${selectable ? 31 : 34}%">
                <col class="acc-storage-value-col" style="width:${selectable ? 64 : 66}%">
              </colgroup>
              <thead>
                <tr>
                  ${selectable ? `<th class="acc-storage-check-col">${selectAllHtml}</th>` : ''}
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${entries
                  .map(
                    (entry, index) => `
                      <tr>
                        ${selectable ? `<td class="acc-storage-check-col">${checkboxHtml(entry, index)}</td>` : ''}
                        <td><input type="text" class="acc-cell-input" readonly value="${utils.escapeHtml(entry.title)}"></td>
                        <td><input type="text" class="acc-cell-input" readonly value="${utils.escapeHtml(formatInspectorValue(entry.value))}"></td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;

        utils.setHTML(mask, `
          <div class="acc-data-box">
            <div class="acc-data-header">
              <div class="acc-data-title">${utils.escapeHtml(title || type)}</div>
              <div class="acc-data-header-actions">
                <button type="button" class="acc-toolbar-btn acc-data-window-btn acc-data-maximize" title="${utils.t('maximize_panel')}">
                  <span class="acc-maximize-icon">${constants.ICONS.MAXIMIZE}</span>
                  <span class="acc-restore-icon">${constants.ICONS.RESTORE}</span>
                </button>
                <button type="button" class="acc-dialog-btn acc-dialog-btn-ok acc-data-confirm">${utils.t('dlg_ok')}</button>
                <button type="button" class="acc-toolbar-btn acc-data-close" title="${utils.t('dlg_cancel')}">${constants.ICONS.CLOSE}</button>
              </div>
            </div>
            ${
              selectable
                ? `<div class="acc-data-toolbar">
                    <span class="acc-data-count"></span>
                  </div>`
                : ''
            }
            <div class="acc-data-list">
              ${
                entries.length
                  ? isCookieData
                    ? renderCookieTable()
                    : renderStorageList()
                  : `<div class="acc-data-empty">${utils.t('no_data')}</div>`
              }
            </div>
          </div>
        `);
        mask.style.display = 'flex';

        const updateCount = () => {
          const count = mask.querySelector('.acc-data-count');
          if (count) count.textContent = selectedCountText();
          const checkedCount = mask.querySelectorAll('.acc-data-check:checked').length;
          const checkAll = mask.querySelector('.acc-data-check-all');
          if (checkAll) {
            checkAll.checked = entries.length > 0 && checkedCount === entries.length;
            checkAll.indeterminate = checkedCount > 0 && checkedCount < entries.length;
          }
        };
        const close = (result) => {
          mask.__anmeCellInputSelectionCleanup?.();
          mask.style.display = 'none';
          resolve(result);
        };

        mask.querySelector('.acc-data-close').onclick = () => close(null);
        mask.querySelector('.acc-data-confirm').onclick = () => {
          close(
            selectable
              ? [...mask.querySelectorAll('.acc-data-check:checked')].map((input) => entries[Number(input.dataset.index)]?.key).filter(Boolean)
              : true
          );
        };
        mask.querySelectorAll('.acc-data-check').forEach((input) => input.addEventListener('change', updateCount));
        mask.querySelector('.acc-data-check-all')?.addEventListener('change', (event) => {
          mask.querySelectorAll('.acc-data-check').forEach((input) => {
            input.checked = event.target.checked;
          });
          updateCount();
        });
        setupCellInputSelectionAssist(mask);
        updateCount();

        const dataBox = mask.querySelector('.acc-data-box');
        const maximizeBtn = mask.querySelector('.acc-data-maximize');
        const updateMaximizeState = () => {
          const isMaximized = Boolean(dataBox?.classList.contains('is-maximized'));
          maximizeBtn?.setAttribute('title', utils.t(isMaximized ? 'restore_panel' : 'maximize_panel'));
          maximizeBtn?.setAttribute('aria-label', utils.t(isMaximized ? 'restore_panel' : 'maximize_panel'));
          maximizeBtn?.setAttribute('aria-pressed', String(isMaximized));
        };
        maximizeBtn?.addEventListener('click', () => {
          dataBox?.classList.toggle('is-maximized');
          updateMaximizeState();
        });
        updateMaximizeState();
      });
    },
    async showFormModal({ title, contentHtml, submitText, onOpen }) {
      const mask = ui.ensureFormMask();
      utils.setHTML(mask, `
        <div class="acc-form-box">
          <div class="acc-form-title">${title}</div>
          ${contentHtml}
          <div class="acc-form-footer">
            <button class="acc-dialog-btn acc-dialog-btn-cancel" id="acc-form-cancel">${utils.t('dlg_cancel')}</button>
            <button class="acc-dialog-btn acc-dialog-btn-ok" id="acc-form-submit">${submitText}</button>
          </div>
        </div>
      `);
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
            <span class="acc-source-row">
              <label class="acc-chk-label" title="Cookie"><input type="checkbox" id="form-c-ck" class="acc-custom-chk" checked> Cookie</label>
              <button type="button" class="acc-source-eye" data-type="cookies" title="${utils.t('inspect_items')}">${constants.ICONS.EYE}</button>
            </span>
            <span class="acc-source-row">
              <label class="acc-chk-label" title="LocalStorage"><input type="checkbox" id="form-c-ls" class="acc-custom-chk"> LS</label>
              <button type="button" class="acc-source-eye" data-type="localStorage" title="${utils.t('inspect_items')}">${constants.ICONS.EYE}</button>
            </span>
            <span class="acc-source-row">
              <label class="acc-chk-label" title="SessionStorage"><input type="checkbox" id="form-c-ss" class="acc-custom-chk"> SS</label>
              <button type="button" class="acc-source-eye" data-type="sessionStorage" title="${utils.t('inspect_items')}">${constants.ICONS.EYE}</button>
            </span>
            <span class="acc-source-tips">
              <span class="acc-help-tip" title="${utils.t('tip_help')}">${constants.ICONS.HELP}</span>
              <span class="acc-lock-tip" title="${utils.t('tip_lock')}">${constants.ICONS.LOCK}</span>
            </span>
          </div>
          <div class="acc-form-label">${utils.t('site_name')}<span class="acc-required">*</span></div>
          <input type="text" id="form-site-name" class="acc-input-text" placeholder="${utils.t('placeholder_site_name')}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('account_name')}<span class="acc-required">*</span></div>
          <input type="text" id="form-acc-name" class="acc-input-text" placeholder="${utils.t('placeholder_name')}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('account_note')}</div>
          <textarea id="form-acc-note" class="acc-input-text acc-input-note" placeholder="${utils.t('placeholder_note')}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
        `,
        onOpen: async ({ qs, submitBtn, close }) => {
          const nameInput = qs('#form-acc-name');
          const siteNameInput = qs('#form-site-name');
          const noteInput = qs('#form-acc-note');
          let saveNoteSyncState = createSaveNoteSyncState();
          const snapshotSources = await core.getCurrentSnapshotSources();
          const selectedSourceKeys = {
            cookies: new Set(getCookieEntries(snapshotSources.cookies).map((entry) => entry.key)),
            localStorage: new Set(Object.keys(snapshotSources.localStorage)),
            sessionStorage: new Set(Object.keys(snapshotSources.sessionStorage))
          };
          const typeToCheckbox = {
            cookies: '#form-c-ck',
            localStorage: '#form-c-ls',
            sessionStorage: '#form-c-ss'
          };
          siteNameInput.value = utils.suggestSiteName(utils.getPageTitle(), constants.HOST);
          nameInput.value = utils.suggestAccountName(constants.HOST);

          const syncExistingAccountNote = () => {
            const { nextNote, nextState } = syncSaveNoteFromMatchedAccount({
              name: nameInput.value,
              currentNote: noteInput.value,
              syncState: saveNoteSyncState,
              getExistingAccount: (accountName) => {
                const key = utils.makeKey(accountName);
                const storedAccount = GM_getValue(key);
                return storedAccount ? { key, note: storedAccount.note } : null;
              },
              normalizeName: (value) => utils.normalizeText(value),
              normalizeNote: (value) => utils.normalizeNoteText(value)
            });
            saveNoteSyncState = nextState;
            if (noteInput.value !== nextNote) {
              noteInput.value = nextNote;
            }
          };

          const toggleAvailability = (selector, available) => {
            const input = qs(selector);
            const label = input?.closest('.acc-chk-label');
            const eyeButton = input?.closest('.acc-source-row')?.querySelector('.acc-source-eye');
            if (!input || !label) return;

            input.disabled = !available;
            input.checked = available && input.id === 'form-c-ck';
            label.classList.toggle('disabled', !available);
            if (eyeButton) {
              eyeButton.disabled = !available;
            }
          };

          const getSelectedKeys = (type) => [...(selectedSourceKeys[type] || new Set())];

          const resetSelectionIfEmpty = (type) => {
            if (selectedSourceKeys[type]?.size > 0) return;
            selectedSourceKeys[type] = new Set(getInspectorEntries(type, snapshotSources[type]).map((entry) => entry.key));
          };

          const updateState = () => {
            const ck = qs('#form-c-ck')?.checked;
            const ls = qs('#form-c-ls')?.checked;
            const ss = qs('#form-c-ss')?.checked;
            const canSave =
              (ck || ls || ss) && nameInput.value.trim().length > 0 && siteNameInput.value.trim().length > 0;
            submitBtn.disabled = !canSave;
          };

          Object.entries(typeToCheckbox).forEach(([type, selector]) => {
            qs(selector)?.addEventListener('change', (event) => {
              if (event.target.checked) {
                resetSelectionIfEmpty(type);
              }
              updateState();
            });
          });

          const openSourceSelector = async (type) => {
            const selectedKeys = await ui.showDataInspector({
              title: type,
              type,
              data: snapshotSources[type],
              selectable: true,
              selectedKeys: getSelectedKeys(type)
            });
            if (!selectedKeys) return;

            selectedSourceKeys[type] = new Set(selectedKeys);
            const input = qs(typeToCheckbox[type]);
            if (input) {
              input.checked = selectedKeys.length > 0;
            }
            updateState();
          };

          qs('.acc-chk')?.querySelectorAll('.acc-source-eye').forEach((button) => {
            button.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              openSourceSelector(button.dataset.type);
            });
          });

          siteNameInput.addEventListener('input', updateState);
          nameInput.addEventListener('input', () => {
            syncExistingAccountNote();
            updateState();
          });
          nameInput.addEventListener('blur', syncExistingAccountNote);
          noteInput.addEventListener('input', () => {
            saveNoteSyncState = trackSaveNoteManualEdit({
              currentNote: noteInput.value,
              syncState: saveNoteSyncState,
              normalizeNote: (value) => utils.normalizeNoteText(value)
            });
          });
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
              ss: qs('#form-c-ss').checked,
              cookieKeys: getSelectedKeys('cookies'),
              localStorageKeys: getSelectedKeys('localStorage'),
              sessionStorageKeys: getSelectedKeys('sessionStorage'),
              note: noteInput.value
            });
            if (!saved) return;

            close();
            ui.refresh();
            ui.showToast(utils.t('toast_saved'));
          };

          const availableSources = {
            ck: snapshotSources.cookies.length > 0,
            ls: Object.keys(snapshotSources.localStorage).length > 0,
            ss: Object.keys(snapshotSources.sessionStorage).length > 0
          };
          toggleAvailability('#form-c-ck', availableSources.ck);
          toggleAvailability('#form-c-ls', availableSources.ls);
          toggleAvailability('#form-c-ss', availableSources.ss);
          syncExistingAccountNote();
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
      const hasSavedPassword = Boolean(config.password);
      const maskedPassword = '******';
      await ui.showFormModal({
        title: utils.t('nav_webdav'),
        submitText: utils.t('webdav_verify_save'),
        contentHtml: `
          <div class="acc-form-label">${utils.t('webdav_url')}</div>
          <input type="text" id="form-webdav-url" class="acc-input-text" placeholder="${utils.t('webdav_url_placeholder')}" value="${utils.escapeHtml(config.url)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('webdav_username')}</div>
          <input type="text" id="form-webdav-username" class="acc-input-text" placeholder="${utils.t('webdav_username_placeholder')}" value="${utils.escapeHtml(config.username)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <div class="acc-form-label">${utils.t('webdav_password')}</div>
          <input type="text" id="form-webdav-password" class="acc-input-text acc-password-mask-input" placeholder="${utils.t('webdav_password_placeholder')}" value="${hasSavedPassword ? maskedPassword : ''}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
        `,
        onOpen: async ({ qs, submitBtn, setSubmitting, close }) => {
          const urlInput = qs('#form-webdav-url');
          const usernameInput = qs('#form-webdav-username');
          const passwordInput = qs('#form-webdav-password');
          let isSaving = false;
          let passwordDirty = false;

          const updateState = () => {
            const canSave =
              urlInput.value.trim().length > 0 &&
              usernameInput.value.trim().length > 0 &&
              ((passwordDirty && passwordInput.value.length > 0) || (!passwordDirty && hasSavedPassword) || (!hasSavedPassword && passwordInput.value.length > 0));
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

          const beginPasswordEdit = () => {
            if (!hasSavedPassword || passwordDirty || passwordInput.value !== maskedPassword) return;
            passwordInput.value = '';
            passwordDirty = true;
            updateState();
          };

          const restoreMaskedPassword = () => {
            if (!hasSavedPassword || !passwordDirty || passwordInput.value.length > 0) return;
            passwordDirty = false;
            passwordInput.value = maskedPassword;
            updateState();
          };

          [urlInput, usernameInput, passwordInput].forEach((input) => {
            input.addEventListener('input', updateState);
            input.addEventListener('keydown', (event) => {
              if (input === passwordInput && passwordInput.value === maskedPassword && event.key.length === 1) {
                beginPasswordEdit();
              }
              if (event.key === 'Enter' && !submitBtn.disabled) {
                event.preventDefault();
                submitBtn.click();
              }
            });
          });

          passwordInput.addEventListener('focus', beginPasswordEdit);
          passwordInput.addEventListener('mousedown', beginPasswordEdit);
          passwordInput.addEventListener('paste', beginPasswordEdit);
          passwordInput.addEventListener('blur', restoreMaskedPassword);

          submitBtn.onclick = async () => {
            const nextConfig = {
              url: urlInput.value.trim(),
              username: usernameInput.value.trim(),
              password: resolveWebDavPasswordForSubmit({
                hasSavedPassword,
                passwordDirty,
                passwordInputValue: passwordInput.value,
                savedPassword: config.password
              })
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
