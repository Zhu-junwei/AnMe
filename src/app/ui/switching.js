export function createSwitchingMethods({ state, constants, utils, templates, core, ui }) {
  return {
    renderHostSelector(hosts) {
      const hostTrigger = ui.qs('#host-trigger');
      const hostMenu = ui.qs('#host-menu');
      const hostSearchInput = ui.qs('#host-search-input');
      if (!hostTrigger || !hostMenu) return;

      const currentLabel = state.currentViewingHost === constants.HOST ? '\u{1F4CC}' : '\u{1F310}';
      const query = state.hostSearchQuery.trim().toLowerCase();
      const visibleHosts = hosts.filter((host) => {
        const siteName = utils.getSiteNameByHost(host).toLowerCase();
        return host.toLowerCase().includes(query) || siteName.includes(query);
      });
      hostTrigger.textContent = `${currentLabel} ${utils.getHostDisplayName(state.currentViewingHost)}`;
      if (hostSearchInput) {
        hostSearchInput.value = state.hostSearchQuery;
      }
      hostMenu.innerHTML = `
        <div class="acc-host-list">
          ${visibleHosts.length
            ? visibleHosts
                .map((host) => {
                  const prefix = host === constants.HOST ? '\u{1F4CC}' : '\u{1F310}';
                  const isActive = host === state.currentViewingHost ? ' active' : '';
                  const label = utils.escapeHtml(utils.getHostDisplayName(host));
                  const isEditing = state.hostDisplayMode === 'siteName' && state.hostEditingHost === host;
                  const editValue = utils.escapeHtml(state.hostEditingValue || utils.getSiteNameByHost(host));
                  return `
                    <div class="acc-host-option-row${isActive}">
                      <button class="acc-host-option" type="button" data-host="${host}">${prefix} ${label}</button>
                      ${
                        state.hostDisplayMode === 'siteName'
                          ? `<button class="acc-host-edit-link" type="button" data-edit-host="${host}" title="${utils.t('edit_site_name')}">${constants.ICONS.EDIT}</button>`
                          : ''
                      }
                      <button class="acc-host-open-link" type="button" data-open-host="${host}" title="${utils.t('open_site')}">&#8599;</button>
                      ${
                        isEditing
                          ? `
                            <div class="acc-host-edit-box">
                              <input type="text" class="acc-host-edit-input" data-host="${host}" value="${editValue}" placeholder="${utils.t('placeholder_site_name')}" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
                              <button class="acc-host-edit-save" type="button" data-save-host="${host}">${utils.t('save_changes')}</button>
                              <button class="acc-host-edit-cancel" type="button">${utils.t('dlg_cancel')}</button>
                            </div>
                          `
                          : ''
                      }
                    </div>
                  `;
                })
                .join('')
            : `<div class="acc-host-empty">${utils.t('no_data')}</div>`}
        </div>
      `;
    },
    initPointerSortableList({ containerSelector, itemSelector, keySelector, orderHost, afterSort, handleSelector }) {
      const container = ui.qs(containerSelector);
      if (!container) return;
      const scrollArea = container.closest('.acc-scroll-area');

      if (container._psCleanup) {
        container._psCleanup();
      }

      let dragState = null;
      let autoScrollRaf = null;
      let latestPointerY = 0;

      const updateDraggedItemPosition = () => {
        if (!dragState) return;
        const ghostRect = dragState.ghost.getBoundingClientRect();
        const dragMidY = ghostRect.top + ghostRect.height / 2;
        const siblingItems = [...container.querySelectorAll(itemSelector)].filter((item) => item !== dragState.item);
        const nextItem = siblingItems.find((item) => {
          const box = item.getBoundingClientRect();
          return dragMidY < box.top + box.height / 2;
        });

        if (nextItem) {
          container.insertBefore(dragState.item, nextItem);
        } else {
          container.appendChild(dragState.item);
        }
      };

      const stopAutoScroll = () => {
        if (!autoScrollRaf) return;
        cancelAnimationFrame(autoScrollRaf);
        autoScrollRaf = null;
      };

      const runAutoScroll = () => {
        if (!dragState || !scrollArea) {
          stopAutoScroll();
          return;
        }

        const rect = scrollArea.getBoundingClientRect();
        const threshold = 44;
        let delta = 0;

        if (latestPointerY < rect.top + threshold) {
          delta = -Math.ceil(((rect.top + threshold - latestPointerY) / threshold) * 14);
        } else if (latestPointerY > rect.bottom - threshold) {
          delta = Math.ceil(((latestPointerY - (rect.bottom - threshold)) / threshold) * 14);
        }

        if (delta !== 0) {
          scrollArea.scrollTop += delta;
          updateDraggedItemPosition();
          autoScrollRaf = requestAnimationFrame(runAutoScroll);
          return;
        }

        autoScrollRaf = null;
      };

      const cleanupDragState = () => {
        if (!dragState) return;
        const { ghost, container: dragContainer, item } = dragState;
        stopAutoScroll();
        item.classList.remove('dragging-source');
        if (dragContainer) {
          dragContainer.classList.remove('acc-switch-list-sorting');
        }
        if (ghost && ghost.parentNode) {
          ghost.parentNode.removeChild(ghost);
        }
        dragState = null;
      };

      const syncOrder = () => {
        const items = [...container.querySelectorAll(keySelector)];
        const newOrder = items.map((element) => utils.extractName(element.dataset.key || element.dataset.cardKey));
        core.updateOrder(orderHost(), newOrder);
        if (afterSort) afterSort();
      };

      const onPointerMove = (event) => {
        if (!dragState || event.pointerId !== dragState.pointerId) return;

        event.preventDefault();
        latestPointerY = event.clientY;
        dragState.ghost.style.top = `${event.clientY - dragState.offsetY}px`;
        dragState.ghost.style.left = `${dragState.left}px`;
        updateDraggedItemPosition();

        if (!autoScrollRaf) {
          autoScrollRaf = requestAnimationFrame(runAutoScroll);
        }
      };

      const onPointerUp = (event) => {
        if (!dragState || event.pointerId !== dragState.pointerId) return;

        event.preventDefault();
        cleanupDragState();
        syncOrder();
      };

      const onPointerDown = (event) => {
        if (event.button !== 0) return;

        const handle = event.target.closest(handleSelector);
        if (!handle) return;

        const item = handle.closest(itemSelector);
        if (!item) return;

        event.preventDefault();
        event.stopPropagation();

        const rect = item.getBoundingClientRect();
        const ghost = item.cloneNode(true);
        ghost.classList.add('acc-switch-ghost');
        ghost.style.position = 'fixed';
        ghost.style.top = `${rect.top}px`;
        ghost.style.left = `${rect.left}px`;
        ghost.style.width = `${rect.width}px`;
        ghost.style.zIndex = '1000002';
        ghost.style.pointerEvents = 'none';
        state.uiRoot.appendChild(ghost);

        item.classList.add('dragging-source');
        container.classList.add('acc-switch-list-sorting');

        dragState = {
          container,
          ghost,
          item,
          pointerId: event.pointerId,
          offsetY: event.clientY - rect.top,
          left: rect.left
        };
        latestPointerY = event.clientY;
      };

      container.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);

      container._psCleanup = () => {
        container.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        cleanupDragState();
      };
    },
    renderSwitchView() {
      const searchQuery = state.accountSearchQuery.trim().toLowerCase();
      const currentKeys = utils
        .getSortedKeysByHost(state.currentViewingHost)
        .filter((key) => !searchQuery || utils.extractName(key).toLowerCase().includes(searchQuery));
      const switchArea = ui.qs('#switch-area');
      if (!switchArea) return;
      switchArea.innerHTML =
        currentKeys.length === 0
          ? templates.noData()
          : currentKeys.map((key) => templates.switchCard(key, GM_getValue(key))).join('');
      ui.initPointerSortableList({
        containerSelector: '#switch-area',
        itemSelector: '.acc-switch-item',
        keySelector: '.acc-switch-item',
        handleSelector: '.acc-switch-handle',
        orderHost: () => state.currentViewingHost,
        afterSort: () => {
          ui.renderSwitchView();
        }
      });
    },
    renderAccountSettingsView() {
      const input = ui.qs('#account-settings-name');
      const saveBtn = ui.qs('#btn-account-rename-save');
      const deleteBtn = ui.qs('#btn-account-delete');
      if (!input || !saveBtn || !deleteBtn) return;

      const key = state.accountSettingsKey;
      const data = key ? GM_getValue(key) : null;
      const originalName = data ? utils.extractName(key) : '';

      input.value = originalName;
      input.disabled = !data;
      deleteBtn.disabled = !data;
      deleteBtn.style.opacity = data ? '1' : '0.5';
      deleteBtn.style.cursor = data ? 'pointer' : 'not-allowed';

      const updateSaveState = () => {
        const canSave =
          Boolean(data) &&
          input.value.trim().length > 0 &&
          input.value.trim() !== originalName;
        saveBtn.disabled = !canSave;
        saveBtn.style.opacity = canSave ? '1' : '0.5';
        saveBtn.style.cursor = canSave ? 'pointer' : 'not-allowed';
      };

      input.oninput = updateSaveState;
      input.onkeydown = (event) => {
        if (event.key === 'Enter' && !saveBtn.disabled) {
          event.preventDefault();
          saveBtn.click();
        }
      };

      updateSaveState();
    },
    updateSwitchToolbar() {
      const hostRow = ui.qs('#acc-host-row');
      const searchInput = ui.qs('#account-search-input');
      const searchToggleBtn = ui.qs('#btn-account-search-toggle');
      if (!hostRow || !searchInput || !searchToggleBtn) return;

      hostRow.classList.toggle('searching', state.accountSearchActive);
      searchInput.value = state.accountSearchQuery;
      searchToggleBtn.innerHTML = state.accountSearchActive ? constants.ICONS.CLOSE : constants.ICONS.SEARCH;
      searchToggleBtn.title = state.accountSearchActive ? utils.t('close_search_accounts') : utils.t('search_accounts');
    },
    openAccountSettings(key) {
      state.accountSettingsKey = key;
      state.accountSettingsHost = state.currentViewingHost;
      state.accountSettingsReturnPage = state.activePage || 'pg-switch';
      ui.renderAccountSettingsView();
      ui.activatePage('pg-account-settings', utils.t('account_settings'));
    }
  };
}
