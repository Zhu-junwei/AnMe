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

const normalizeForCompare = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(normalizeForCompare)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeForCompare(value[key])])
    );
  }
  return value;
};

const isSameData = (left, right) =>
  JSON.stringify(normalizeForCompare(left)) === JSON.stringify(normalizeForCompare(right));

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

const getExpirationSortValue = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized || /^session$/i.test(normalized)) return Number.POSITIVE_INFINITY;
  const numericValue = Number(normalized);
  if (Number.isFinite(numericValue)) return numericValue > 100000000000 ? numericValue : numericValue * 1000;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

const compareInspectorValues = (left, right, column, direction = 'asc') => {
  let result = 0;
  if (column === 'expirationDate') {
    result = getExpirationSortValue(left) - getExpirationSortValue(right);
  } else {
    result = String(left ?? '').localeCompare(String(right ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  }
  return direction === 'desc' ? -result : result;
};

const getEntrySortValue = (type, entry, column) => {
  if (type === 'cookies') {
    return column === 'value' ? entry.value : getCookieCellValue(entry.cookie || {}, column);
  }
  return column === 'value' ? entry.value : entry.key;
};

const sortInspectorEntries = (entries, type, column = type === 'cookies' ? 'name' : 'key', direction = 'asc') =>
  [...entries].sort((left, right) => {
    const result = compareInspectorValues(
      getEntrySortValue(type, left, column),
      getEntrySortValue(type, right, column),
      column,
      direction
    );
    return result || String(left.key || '').localeCompare(String(right.key || ''), undefined, { numeric: true });
  });

const getCookieCellValue = (cookie, column) => {
  if (column === 'expirationDate') {
    return typeof cookie.expirationDate === 'number'
      ? new Date(cookie.expirationDate * 1000).toLocaleString()
      : 'Session';
  }
  return formatInspectorValue(cookie[column]);
};

const getCookieColumns = (entries) => {
  const preferredColumns = ['name', 'value', 'domain', 'path', 'expirationDate', 'secure', 'httpOnly', 'session', 'hostOnly', 'sameSite'];
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
  if (column === 'domain') return 140;
  if (column === 'path') return 72;
  if (column === 'expirationDate') return 150;
  if (column === 'httpOnly' || column === 'secure' || column === 'session' || column === 'hostOnly') return 70;
  if (column === 'sameSite') return 96;
  return 120;
};

const getDefaultCookieColumns = () => ['name', 'value', 'domain', 'path', 'expirationDate', 'secure', 'httpOnly', 'session', 'hostOnly', 'sameSite'];

const getDefaultCookie = (host) => ({
  name: '',
  value: '',
  domain: host || location.hostname,
  path: '/',
  expirationDate: '',
  secure: false,
  httpOnly: false,
  session: false,
  hostOnly: false,
  sameSite: 'lax'
});

const parseCookieCellValue = (value, column) => {
  const normalized = String(value ?? '').trim();
  if (column === 'expirationDate') {
    if (!normalized || /^session$/i.test(normalized)) return undefined;
    const numericValue = Number(normalized);
    if (Number.isFinite(numericValue)) return numericValue > 100000000000 ? numericValue / 1000 : numericValue;
    const timestamp = Date.parse(normalized);
    return Number.isNaN(timestamp) ? undefined : timestamp / 1000;
  }
  if (column === 'secure' || column === 'httpOnly' || column === 'hostOnly' || column === 'session') {
    return /^(true|1|yes)$/i.test(normalized);
  }
  return String(value ?? '');
};

const serializeCookieRows = ({ mask, entries, columns, host, includeOnlyChecked }) => {
  const rows = [];
  mask.querySelectorAll('.acc-data-row').forEach((row) => {
    const check = row.querySelector('.acc-data-check');
    if (includeOnlyChecked && !check?.checked) return;

    const index = Number(row.dataset.index);
    const originalCookie = entries[index]?.cookie;
    const cookie = originalCookie ? { ...originalCookie } : getDefaultCookie(host);

    columns.forEach((column) => {
      const input = row.querySelector(`[data-column="${column}"]`);
      if (!input) return;

      const originalValue = originalCookie ? getCookieCellValue(originalCookie, column) : '';
      if (originalCookie && input.value === originalValue) return;

      const parsedValue = parseCookieCellValue(input.value, column);
      if (parsedValue === undefined || parsedValue === '') {
        if (column !== 'name' && column !== 'value' && column !== 'domain' && column !== 'path') {
          delete cookie[column];
          return;
        }
      }
      cookie[column] = parsedValue ?? '';
    });

    cookie.name = String(cookie.name || '').trim();
    cookie.value = String(cookie.value ?? '');
    cookie.domain = String(cookie.domain || host || location.hostname).trim();
    cookie.path = String(cookie.path || '/').trim();
    if (!cookie.name) return;
    rows.push(cookie);
  });
  return rows;
};

const serializeStorageRows = ({ mask, includeOnlyChecked }) => {
  const rows = [];
  mask.querySelectorAll('.acc-data-row').forEach((row) => {
    const check = row.querySelector('.acc-data-check');
    if (includeOnlyChecked && !check?.checked) return;

    const key = row.querySelector('[data-column="key"]')?.value.trim();
    if (!key) return;
    rows.push([key, row.querySelector('[data-column="value"]')?.value ?? '']);
  });
  return rows;
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
    showDataInspector({
      title,
      type,
      data,
      selectable = false,
      selectedKeys = [],
      editable = false,
      addable = false,
      submitText = utils.t('dlg_ok'),
      confirmDisabledUntilDirty = false,
      host = constants.HOST
    }) {
      return ui
        .showDataInspectorTabs({
          tabs: [{ title, type, data, selectedKeys }],
          initialType: type,
          selectable,
          editable,
          addable,
          submitText,
          confirmDisabledUntilDirty,
          host
        })
        .then((result) => result?.tabs?.[type] || result || null);
    },
    showDataInspectorTabs({
      tabs,
      initialType,
      selectable = false,
      editable = false,
      addable = false,
      submitText = utils.t('dlg_ok'),
      confirmDisabledUntilDirty = false,
      host = constants.HOST
    }) {
      return new Promise((resolve) => {
        const mask = ui.ensureDataInspectorMask();
        mask.__anmeDataInspectorCleanup?.();
        const targetHost = host || constants.HOST;
        const tabStates = (tabs || [])
          .filter((tab) => tab?.type)
          .map((tab) => {
            const defaultSortColumn = tab.type === 'cookies' ? 'name' : 'key';
            const entries = sortInspectorEntries(getInspectorEntries(tab.type, tab.data), tab.type, defaultSortColumn);
            const isCookieData = tab.type === 'cookies';
            const cookieColumns = isCookieData
              ? [...new Set([...getDefaultCookieColumns(), ...getCookieColumns(entries)])]
              : [];
            const cookieTableWidth = cookieColumns.reduce(
              (width, column) => width + getCookieColumnWidth(column),
              selectable ? 34 : 0
            );
            return {
              ...tab,
              entries,
              isCookieData,
              cookieColumns,
              cookieTableWidth,
              storageTableWidth: selectable ? 674 : 640,
              selectedSet: new Set(tab.selectedKeys || []),
              sortColumn: defaultSortColumn,
              sortDirection: 'asc'
            };
          });
        if (tabStates.length === 0) {
          resolve(null);
          return;
        }

        let activeType = tabStates.some((tab) => tab.type === initialType) ? initialType : tabStates[0].type;
        const canEditCells = selectable || editable;
        const checkboxHtml = (entry, index, checked) =>
          selectable
            ? `<input type="checkbox" class="acc-custom-chk acc-data-check" data-index="${index}" ${checked ? 'checked' : ''}>`
            : '';
        const selectAllHtml = selectable
          ? '<input type="checkbox" class="acc-custom-chk acc-data-check-all" checked>'
          : '';
        const sortHeaderHtml = (tab, column, label) => `
          <button type="button" class="acc-data-sort-header${tab.sortColumn === column ? ' active' : ''}" data-column="${utils.escapeHtml(column)}" data-direction="${tab.sortColumn === column ? tab.sortDirection : ''}">
            <span class="acc-data-sort-label">${utils.escapeHtml(label)}</span>
            <span class="acc-data-sort-indicator" aria-hidden="true"></span>
          </button>
        `;
        const editableAttrs = (column, index, readonly = !canEditCells) =>
          `data-index="${index}" data-column="${column}" ${readonly ? 'readonly' : ''} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"`;
        const storageKeyAttrs = (index) =>
          `data-index="${index}" data-column="key" ${canEditCells ? '' : 'readonly'} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"`;
        const renderCookieRow = (tab, entry, index, isNew = false) => `
          <tr class="acc-data-row${entry.isExpired ? ' is-expired' : ''}" data-index="${index}">
            ${selectable ? `<td class="acc-cookie-check-col">${checkboxHtml(entry, index, isNew || tab.selectedSet.has(entry.key))}</td>` : ''}
            ${tab.cookieColumns
              .map((column) => {
                const value = column === 'value' ? entry.value : getCookieCellValue(entry.cookie || {}, column);
                const readonly = !canEditCells || (!isNew && !editable && !selectable && column !== 'value');
                return `<td><input type="text" class="acc-cell-input${column === 'value' ? ' acc-data-value-input' : ''}" ${editableAttrs(
                  column,
                  index,
                  readonly
                )} value="${utils.escapeHtml(value)}"></td>`;
              })
              .join('')}
          </tr>
        `;
        const renderStorageRow = (tab, entry, index, isNew = false) => `
          <tr class="acc-data-row" data-index="${index}">
            ${selectable ? `<td class="acc-storage-check-col">${checkboxHtml(entry, index, isNew || tab.selectedSet.has(entry.key))}</td>` : ''}
            <td><input type="text" class="acc-cell-input" ${storageKeyAttrs(index)} value="${utils.escapeHtml(entry.title)}"></td>
            <td><input type="text" class="acc-cell-input acc-data-value-input" ${editableAttrs(
              'value',
              index,
              !canEditCells
            )} value="${utils.escapeHtml(formatInspectorValue(entry.value))}"></td>
          </tr>
        `;
        const renderCookieTable = (tab) => `
          <div class="acc-cookie-table-wrap">
            <table class="acc-cookie-table" style="min-width:${tab.cookieTableWidth}px">
              <colgroup>
                ${selectable ? '<col class="acc-cookie-check-col" style="width:34px">' : ''}
                ${tab.cookieColumns
                  .map(
                    (column) =>
                      `<col class="${column === 'value' ? 'acc-cookie-value-col' : ''}" style="width:${(getCookieColumnWidth(
                        column
                      ) /
                        tab.cookieTableWidth) *
                        100}%">`
                  )
                  .join('')}
              </colgroup>
              <thead>
                <tr>
                  ${selectable ? `<th class="acc-cookie-check-col">${selectAllHtml}</th>` : ''}
                  ${tab.cookieColumns.map((column) => `<th>${sortHeaderHtml(tab, column, column)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>${tab.entries.map((entry, index) => renderCookieRow(tab, entry, index)).join('')}</tbody>
            </table>
          </div>
        `;
        const renderStorageList = (tab) => `
          <div class="acc-storage-table-wrap">
            <table class="acc-storage-table" style="min-width:${tab.storageTableWidth}px">
              <colgroup>
                ${selectable ? '<col class="acc-storage-check-col" style="width:34px">' : ''}
                <col class="acc-storage-key-col" style="width:${selectable ? 'calc(34% - 17px)' : '34%'}">
                <col class="acc-storage-value-col" style="width:${selectable ? 'calc(66% - 17px)' : '66%'}">
              </colgroup>
              <thead>
                <tr>
                  ${selectable ? `<th class="acc-storage-check-col">${selectAllHtml}</th>` : ''}
                  <th>${sortHeaderHtml(tab, 'key', 'Key')}</th>
                  <th>${sortHeaderHtml(tab, 'value', 'Value')}</th>
                </tr>
              </thead>
              <tbody>${tab.entries.map((entry, index) => renderStorageRow(tab, entry, index)).join('')}</tbody>
            </table>
          </div>
        `;
        const renderTabPanel = (tab) => `
          <div class="acc-data-tab-panel${tab.type === activeType ? ' active' : ''}" data-type="${utils.escapeHtml(tab.type)}">
            ${tab.isCookieData ? renderCookieTable(tab) : renderStorageList(tab)}
          </div>
        `;

        utils.setHTML(mask, `
          <div class="acc-data-box">
            <div class="acc-data-header">
              <div class="acc-data-title">${utils.escapeHtml(tabStates.find((tab) => tab.type === activeType)?.title || activeType)}</div>
              <div class="acc-data-header-actions">
                ${
                  addable
                    ? `<button type="button" class="acc-toolbar-btn acc-data-add" title="${utils.t('add_item')}" aria-label="${utils.t('add_item')}">${constants.ICONS.ADD}</button>`
                    : ''
                }
                <button type="button" class="acc-toolbar-btn acc-data-window-btn acc-data-maximize" title="${utils.t('maximize_panel')}">
                  <span class="acc-maximize-icon">${constants.ICONS.MAXIMIZE}</span>
                  <span class="acc-restore-icon">${constants.ICONS.RESTORE}</span>
                </button>
                <button type="button" class="acc-toolbar-btn acc-data-confirm" title="${utils.escapeHtml(submitText)}" aria-label="${utils.escapeHtml(submitText)}">${constants.ICONS.SAVE}</button>
                <button type="button" class="acc-toolbar-btn acc-data-close" title="${utils.t('dlg_cancel')}">${constants.ICONS.CLOSE}</button>
              </div>
            </div>
            ${
              tabStates.length > 1
                ? `<div class="acc-data-tabs">
                    ${tabStates
                      .map(
                        (tab) =>
                          `<button type="button" class="acc-data-tab${tab.type === activeType ? ' active' : ''}" data-type="${utils.escapeHtml(
                            tab.type
                          )}">${utils.escapeHtml(tab.title || tab.type)}</button>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
            ${
              selectable
                ? `<div class="acc-data-toolbar">
                    <span class="acc-data-count"></span>
                  </div>`
                : ''
            }
            <div class="acc-data-list">
              ${tabStates.map(renderTabPanel).join('')}
            </div>
          </div>
        `);
        mask.style.display = 'flex';

        const getTabPanel = (tabType) =>
          [...mask.querySelectorAll('.acc-data-tab-panel')].find((panel) => panel.dataset.type === tabType);
        const getActivePanel = () => getTabPanel(activeType);
        const getRowSortValue = (row, column) =>
          row.querySelector(`[data-column="${column}"]`)?.value ?? '';
        const updateSortHeaders = (panel, tab) => {
          panel?.querySelectorAll('.acc-data-sort-header').forEach((button) => {
            const active = button.dataset.column === tab.sortColumn;
            button.classList.toggle('active', active);
            button.dataset.direction = active ? tab.sortDirection : '';
          });
        };
        const sortPanelRows = (panel, tab, column) => {
          const tbody = panel?.querySelector('tbody');
          if (!tbody) return;

          const direction = tab.sortColumn === column && tab.sortDirection === 'asc' ? 'desc' : 'asc';
          tab.sortColumn = column;
          tab.sortDirection = direction;

          [...tbody.querySelectorAll('.acc-data-row')]
            .sort((left, right) => {
              const result = compareInspectorValues(
                getRowSortValue(left, column),
                getRowSortValue(right, column),
                column,
                direction
              );
              return result || Number(left.dataset.index) - Number(right.dataset.index);
            })
            .forEach((row) => tbody.appendChild(row));
          updateSortHeaders(panel, tab);
          updateConfirmState();
        };
        const collectResults = () => {
          const resultsByType = {};
          tabStates.forEach((tab) => {
            const panel = getTabPanel(tab.type);
            if (!panel) return;
            if (tab.isCookieData) {
              const allData = serializeCookieRows({ mask: panel, entries: tab.entries, columns: tab.cookieColumns, host: targetHost });
              const selectedData = serializeCookieRows({
                mask: panel,
                entries: tab.entries,
                columns: tab.cookieColumns,
                host: targetHost,
                includeOnlyChecked: selectable
              });
              resultsByType[tab.type] = {
                data: selectable ? selectedData : allData,
                allData,
                selectedKeys: selectedData.map((cookie) => getCookieSelectionKey(cookie)),
                rows: selectedData
              };
              return;
            }

            const allRows = serializeStorageRows({ mask: panel });
            const selectedRows = serializeStorageRows({ mask: panel, includeOnlyChecked: selectable });
            resultsByType[tab.type] = {
              data: Object.fromEntries(selectable ? selectedRows : allRows),
              allData: Object.fromEntries(allRows),
              selectedKeys: selectedRows.map(([key]) => key),
              rows: selectable ? selectedRows : allRows
            };
          });
          return resultsByType;
        };
        const hasDirtyData = () => {
          const resultsByType = collectResults();
          return tabStates.some((tab) => !isSameData(tab.data, resultsByType[tab.type]?.data));
        };
        const updateConfirmState = () => {
          const confirmBtn = mask.querySelector('.acc-data-confirm');
          if (confirmBtn && confirmDisabledUntilDirty) {
            confirmBtn.disabled = !hasDirtyData();
          }
        };
        const updateCount = () => {
          const panel = getActivePanel();
          const count = mask.querySelector('.acc-data-count');
          if (count && panel) count.textContent = `${panel.querySelectorAll('.acc-data-check:checked').length}/${panel.querySelectorAll('.acc-data-row').length}`;
          const checkedCount = panel?.querySelectorAll('.acc-data-check:checked').length || 0;
          const checkAll = panel?.querySelector('.acc-data-check-all');
          if (checkAll) {
            const rowCount = panel.querySelectorAll('.acc-data-row').length;
            checkAll.checked = rowCount > 0 && checkedCount === rowCount;
            checkAll.indeterminate = checkedCount > 0 && checkedCount < rowCount;
          }
          updateConfirmState();
        };
        const close = (result) => {
          mask.__anmeDataInspectorCleanup?.();
          mask.__anmeCellInputSelectionCleanup?.();
          mask.style.display = 'none';
          resolve(result);
        };

        mask.querySelector('.acc-data-close').onclick = () => close(null);
        mask.querySelector('.acc-data-confirm').onclick = () => {
          const resultsByType = collectResults();
          close({
            tabs: resultsByType,
            activeType,
            ...(resultsByType[activeType] || {})
          });
        };
        mask.querySelectorAll('.acc-data-check').forEach((input) => input.addEventListener('change', updateCount));
        mask.querySelectorAll('.acc-data-check-all').forEach((input) => {
          input.addEventListener('change', (event) => {
            event.target.closest('.acc-data-tab-panel')?.querySelectorAll('.acc-data-check').forEach((checkbox) => {
              checkbox.checked = event.target.checked;
            });
            updateCount();
          });
        });
        mask.querySelectorAll('.acc-data-tab').forEach((button) => {
          button.addEventListener('click', () => {
            activeType = button.dataset.type;
            mask.querySelectorAll('.acc-data-tab').forEach((tabButton) => {
              tabButton.classList.toggle('active', tabButton.dataset.type === activeType);
            });
            mask.querySelectorAll('.acc-data-tab-panel').forEach((panel) => {
              panel.classList.toggle('active', panel.dataset.type === activeType);
            });
            const titleEl = mask.querySelector('.acc-data-title');
            const activeTab = tabStates.find((tab) => tab.type === activeType);
            if (titleEl) titleEl.textContent = activeTab?.title || activeType;
            updateCount();
          });
        });
        mask.querySelectorAll('.acc-data-sort-header').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const panel = button.closest('.acc-data-tab-panel');
            const tab = tabStates.find((item) => item.type === panel?.dataset.type);
            if (!panel || !tab || !button.dataset.column) return;
            sortPanelRows(panel, tab, button.dataset.column);
          });
        });
        mask.querySelector('.acc-data-add')?.addEventListener('click', () => {
          const panel = getActivePanel();
          const tab = tabStates.find((item) => item.type === activeType);
          const tbody = panel?.querySelector('tbody');
          if (!tbody || !tab) return;

          const nextIndex = tab.entries.length + panel.querySelectorAll('.acc-data-row').length;
          if (tab.isCookieData) {
            const cookie = getDefaultCookie(targetHost);
            const entry = {
              key: getCookieSelectionKey(cookie),
              title: cookie.name,
              value: cookie.value,
              cookie
            };
            tbody.insertAdjacentHTML('beforeend', renderCookieRow(tab, entry, nextIndex, true));
          } else {
            tbody.insertAdjacentHTML(
              'beforeend',
              renderStorageRow(tab, { key: '', title: '', value: '', meta: '' }, nextIndex, true)
            );
          }
          const newRow = tbody.lastElementChild;
          newRow?.querySelector('.acc-data-check')?.addEventListener('change', updateCount);
          newRow?.querySelector('.acc-cell-input')?.focus();
          setupCellInputSelectionAssist(mask);
          updateCount();
        });
        const updateDirtyState = () => updateConfirmState();
        mask.addEventListener('input', updateDirtyState);
        mask.addEventListener('change', updateDirtyState);
        mask.__anmeDataInspectorCleanup = () => {
          mask.removeEventListener('input', updateDirtyState);
          mask.removeEventListener('change', updateDirtyState);
          mask.__anmeDataInspectorCleanup = null;
        };
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
            </span>
            <span class="acc-source-row">
              <label class="acc-chk-label" title="LocalStorage"><input type="checkbox" id="form-c-ls" class="acc-custom-chk"> LS</label>
            </span>
            <span class="acc-source-row">
              <label class="acc-chk-label" title="SessionStorage"><input type="checkbox" id="form-c-ss" class="acc-custom-chk"> SS</label>
              <button type="button" class="acc-source-eye" id="form-source-eye" title="${utils.t('inspect_items')}">${constants.ICONS.EYE}</button>
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
          const selectedSourceData = {
            cookies: snapshotSources.cookies,
            localStorage: snapshotSources.localStorage,
            sessionStorage: snapshotSources.sessionStorage
          };
          const sourceOrder = ['cookies', 'localStorage', 'sessionStorage'];
          const getAllSourceKeys = (type) => getInspectorEntries(type, selectedSourceData[type]).map((entry) => entry.key);
          const getSourceCount = (type) => getAllSourceKeys(type).length;
          const defaultSourceType = sourceOrder.find((type) => getSourceCount(type) > 0) || '';
          const selectedSourceKeys = Object.fromEntries(
            sourceOrder.map((type) => [type, new Set(type === defaultSourceType ? getAllSourceKeys(type) : [])])
          );
          const typeToCheckbox = {
            cookies: '#form-c-ck',
            localStorage: '#form-c-ls',
            sessionStorage: '#form-c-ss'
          };
          const typeTitles = {
            cookies: 'Cookie',
            localStorage: 'LocalStorage',
            sessionStorage: 'SessionStorage'
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

          const syncSourceCheckbox = (type) => {
            const input = qs(typeToCheckbox[type]);
            const label = input?.closest('.acc-chk-label');
            if (!input || !label) return;

            const totalCount = getSourceCount(type);
            const selectedCount = selectedSourceKeys[type]?.size || 0;
            const available = totalCount > 0;
            input.disabled = !available;
            input.checked = available && selectedCount > 0 && selectedCount === totalCount;
            input.indeterminate = available && selectedCount > 0 && selectedCount < totalCount;
            label.classList.toggle('disabled', !available);
          };

          const syncSourceCheckboxes = () => {
            sourceOrder.forEach(syncSourceCheckbox);
          };

          const getSelectedKeys = (type) => [...(selectedSourceKeys[type] || new Set())];
          const getSelectedCookieRows = () => {
            const selectedKeys = new Set(getSelectedKeys('cookies'));
            return (selectedSourceData.cookies || []).filter((cookie) => selectedKeys.has(getCookieSelectionKey(cookie)));
          };
          const getSelectedStorageRows = (type) => {
            const selectedKeys = new Set(getSelectedKeys(type));
            return Object.entries(selectedSourceData[type] || {}).filter(([key]) => selectedKeys.has(key));
          };

          const selectAllSourceKeys = (type) => {
            selectedSourceKeys[type] = new Set(getInspectorEntries(type, selectedSourceData[type]).map((entry) => entry.key));
          };
          const getAvailableInspectorTypes = () =>
            sourceOrder.filter((type) => getSourceCount(type) > 0);

          const updateState = () => {
            syncSourceCheckboxes();
            const hasSelectedSource = (type) => (selectedSourceKeys[type]?.size || 0) > 0;
            const canSave =
              sourceOrder.some(hasSelectedSource) &&
              nameInput.value.trim().length > 0 &&
              siteNameInput.value.trim().length > 0;
            submitBtn.disabled = !canSave;
            const sourceEye = qs('#form-source-eye');
            if (sourceEye) {
              sourceEye.disabled = getAvailableInspectorTypes().length === 0;
            }
          };

          Object.entries(typeToCheckbox).forEach(([type, selector]) => {
            qs(selector)?.addEventListener('change', (event) => {
              if (event.target.checked) {
                selectAllSourceKeys(type);
              } else {
                selectedSourceKeys[type] = new Set();
              }
              updateState();
            });
          });

          const openSourceSelector = async (initialType = '') => {
            const availableTypes = getAvailableInspectorTypes();
            if (availableTypes.length === 0) return;

            const result = await ui.showDataInspectorTabs({
              tabs: availableTypes.map((type) => ({
                title: typeTitles[type],
                type,
                data: selectedSourceData[type],
                selectedKeys: getSelectedKeys(type)
              })),
              initialType: availableTypes.includes(initialType) ? initialType : availableTypes[0],
              selectable: true,
              addable: true,
              host: constants.HOST
            });
            if (!result) return;

            Object.entries(result.tabs || {}).forEach(([type, tabResult]) => {
              selectedSourceKeys[type] = new Set(tabResult.selectedKeys);
              selectedSourceData[type] = tabResult.allData;
            });
            updateState();
          };

          qs('#form-source-eye')?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const checkedType = sourceOrder.find((type) => (selectedSourceKeys[type]?.size || 0) > 0);
            openSourceSelector(checkedType);
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
              ck: getSelectedKeys('cookies').length > 0,
              ls: getSelectedKeys('localStorage').length > 0,
              ss: getSelectedKeys('sessionStorage').length > 0,
              cookieKeys: getSelectedKeys('cookies'),
              localStorageKeys: getSelectedKeys('localStorage'),
              sessionStorageKeys: getSelectedKeys('sessionStorage'),
              cookieRows: getSelectedCookieRows(),
              localStorageRows: getSelectedStorageRows('localStorage'),
              sessionStorageRows: getSelectedStorageRows('sessionStorage'),
              note: noteInput.value
            });
            if (!saved) return;

            close();
            ui.refresh();
            ui.showToast(utils.t('toast_saved'));
          };

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
