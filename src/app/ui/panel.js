import { isFullscreenPlaybackActive } from '../fullscreen.js';

const DEFAULT_FAB_POSITION = {
  rightPercent: 3,
  bottomPercent: 13
};

function clampNumber(value, min, max) {
  const normalizedValue = Number(value);
  if (!Number.isFinite(normalizedValue)) return min;
  return Math.min(Math.max(normalizedValue, min), max);
}

function roundPercent(value) {
  return Math.round(value * 10000) / 10000;
}

function getFabTravelBounds(fab) {
  const fabWidth = fab.offsetWidth || 44;
  const fabHeight = fab.offsetHeight || 44;

  return {
    maxLeft: Math.max(0, window.innerWidth - fabWidth),
    maxTop: Math.max(0, window.innerHeight - fabHeight)
  };
}

function getFabPositionFromPixels(fab, left, top) {
  const { maxLeft, maxTop } = getFabTravelBounds(fab);
  const nextLeft = clampNumber(left, 0, maxLeft);
  const nextTop = clampNumber(top, 0, maxTop);

  return {
    left: nextLeft,
    top: nextTop,
    rightPercent: maxLeft > 0 ? ((maxLeft - nextLeft) / maxLeft) * 100 : 0,
    bottomPercent: maxTop > 0 ? ((maxTop - nextTop) / maxTop) * 100 : 0
  };
}

function getFabPositionFromPercent(fab, rightPercent, bottomPercent) {
  const { maxLeft, maxTop } = getFabTravelBounds(fab);
  const nextRightPercent = clampNumber(rightPercent, 0, 100);
  const nextBottomPercent = clampNumber(bottomPercent, 0, 100);

  return {
    left: maxLeft - (maxLeft * nextRightPercent) / 100,
    top: maxTop - (maxTop * nextBottomPercent) / 100,
    rightPercent: nextRightPercent,
    bottomPercent: nextBottomPercent
  };
}

export function createPanelMethods({ state, constants, utils, templates, styleCss, ui }) {
  return {
    applyFabPosition(position, { persist = false } = {}) {
      if (!state.fab || !position) return;

      state.fab.style.left = `${position.left}px`;
      state.fab.style.top = `${position.top}px`;
      state.fab.style.bottom = 'auto';
      state.fab.style.right = 'auto';
      state.fabPosition = {
        rightPercent: roundPercent(position.rightPercent),
        bottomPercent: roundPercent(position.bottomPercent)
      };

      if (state.panel && state.panel.classList.contains('show')) {
        ui.syncPanelPos();
      }

      if (persist) {
        GM_setValue(constants.CFG.FAB_POS, state.fabPosition);
      }
    },
    setFabPosition(left, top, { persist = false } = {}) {
      if (!state.fab) return;

      ui.applyFabPosition(getFabPositionFromPixels(state.fab, left, top), { persist });
    },
    setFabPositionByPercent(rightPercent, bottomPercent, { persist = false } = {}) {
      if (!state.fab) return;

      ui.applyFabPosition(getFabPositionFromPercent(state.fab, rightPercent, bottomPercent), { persist });
    },
    restoreFabPosition(savedPosition) {
      if (!state.fab) return;

      if (savedPosition && typeof savedPosition === 'object') {
        if (savedPosition.rightPercent !== undefined || savedPosition.bottomPercent !== undefined) {
          ui.setFabPositionByPercent(
            savedPosition.rightPercent ?? DEFAULT_FAB_POSITION.rightPercent,
            savedPosition.bottomPercent ?? DEFAULT_FAB_POSITION.bottomPercent
          );
          return;
        }

        if (savedPosition.left !== undefined || savedPosition.top !== undefined) {
          ui.setFabPosition(savedPosition.left, savedPosition.top, { persist: true });
          return;
        }
      }

      ui.setFabPositionByPercent(DEFAULT_FAB_POSITION.rightPercent, DEFAULT_FAB_POSITION.bottomPercent);
    },
    syncFabPosition() {
      if (!state.fab) return;

      const position = state.fabPosition || DEFAULT_FAB_POSITION;
      ui.setFabPositionByPercent(position.rightPercent, position.bottomPercent);
    },
    isFullscreenPlaybackActive() {
      return isFullscreenPlaybackActive();
    },
    syncFloatingUiVisibility() {
      if (!state.fab || !state.panel || !state.uiRoot?.host) return;

      const isFullscreen = ui.isFullscreenPlaybackActive();
      state.uiRoot.host.style.display = isFullscreen ? 'none' : '';

      if (isFullscreen) {
        if (!state.isFullscreenHidden) {
          ui.hideNoteTooltip?.();
          state.panel.classList.remove('show');
        }
        state.isFullscreenHidden = true;
        return;
      }

      state.isFullscreenHidden = false;

      const fabMode = GM_getValue(constants.CFG.FAB_MODE, 'auto');
      const hasAccounts = utils.getSortedKeysByHost(constants.HOST).length > 0;
      const isPanelOpen = state.panel.classList.contains('show');
      state.fab.style.display =
        isPanelOpen || state.isForcedShow || fabMode === 'show' || (fabMode === 'auto' && hasAccounts) ? 'flex' : 'none';
    },
    updateHeaderActionsVisibility() {
      const headerActions = ui.qs('#acc-header-actions');
      const switchPage = ui.qs('#pg-switch');
      const setPage = ui.qs('#pg-set');
      const noticePage = ui.qs('#pg-notice');
      const aboutPage = ui.qs('#pg-about');
      const accountSettingsPage = ui.qs('#pg-account-settings');
      const webdavPage = ui.qs('#pg-webdav');
      if (!headerActions || !switchPage || !setPage || !noticePage || !aboutPage || !accountSettingsPage || !webdavPage) return;

      const isSwitchActive = switchPage.classList.contains('active');
      const isSetActive = setPage.classList.contains('active');
      const isNoticeActive = noticePage.classList.contains('active');
      const isAboutActive = aboutPage.classList.contains('active');
      const isAccountSettingsActive = accountSettingsPage.classList.contains('active');
      const isWebDavActive = webdavPage.classList.contains('active');
      const canOperateCurrentHost = state.currentViewingHost === constants.HOST;
      headerActions.style.display = 'flex';

      const backBtn = ui.qs('#btn-header-back');
      const homeBtn = ui.qs('#btn-go-current-host');
      const cleanBtn = ui.qs('#btn-clean-env');
      const saveBtn = ui.qs('#btn-open-save-modal');
      const settingsBtn = ui.qs('#btn-open-settings');
      const webdavBtn = ui.qs('#btn-open-webdav');

      if (backBtn) backBtn.style.display = isSetActive || isNoticeActive || isAboutActive || isAccountSettingsActive || isWebDavActive ? 'flex' : 'none';
      if (homeBtn) homeBtn.style.display = isSwitchActive && !canOperateCurrentHost ? 'flex' : 'none';
      if (settingsBtn) settingsBtn.style.display = isSwitchActive ? 'flex' : 'none';
      if (webdavBtn) webdavBtn.style.display = isSwitchActive ? 'flex' : 'none';
      if (cleanBtn) cleanBtn.style.display = isSwitchActive && canOperateCurrentHost ? 'flex' : 'none';
      if (saveBtn) saveBtn.style.display = isSwitchActive && canOperateCurrentHost ? 'flex' : 'none';
    },
    activatePage(pageId, title = ui.getPageTitle(pageId)) {
      ui.hideNoteTooltip?.();
      ui.qsa('.acc-tab-content').forEach((element) => element.classList.remove('active'));
      const page = ui.qs(`#${pageId}`);
      if (page) page.classList.add('active');
      const headerText = ui.qs('#acc-header-text');
      if (headerText) headerText.innerText = title;
      state.activePage = pageId;
      if (pageId === 'pg-account-settings') {
        ui.renderAccountSettingsView();
      }
      if (pageId === 'pg-webdav') {
        ui.renderWebDavView();
      }
      ui.updateHeaderActionsVisibility();
    },
    toggleLoading(show, text = '') {
      let loader = ui.qs('.acc-loading-mask');
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'acc-loading-mask';
        utils.setHTML(loader, `
          <div class="acc-spinner"></div>
          <div class="acc-loading-text"></div>
        `);
        state.panel.appendChild(loader);
      }

      loader.querySelector('.acc-loading-text').innerText = text;
      loader.style.display = show ? 'flex' : 'none';
    },
    refresh() {
      if (!state.fab || !state.panel) return;

      ui.hideNoteTooltip?.();
      ui.renderSwitchView();
      ui.renderAccountSettingsView();
      if (state.activePage === 'pg-webdav') {
        ui.renderWebDavView();
      }
      const hosts = utils.listAllHosts();
      if (!hosts.includes(constants.HOST)) hosts.push(constants.HOST);
      if (!hosts.includes(state.currentViewingHost)) state.currentViewingHost = constants.HOST;

      if (ui.qs('#host-trigger') && ui.qs('#host-menu')) {
        ui.renderHostSelector(hosts);
      }
      ui.updateSwitchToolbar();
      ui.updateHeaderActionsVisibility();

      const fabMode = GM_getValue(constants.CFG.FAB_MODE, 'auto');
      const hasAccounts = utils.getSortedKeysByHost(constants.HOST).length > 0;
      state.panel
        .querySelectorAll('.fab-mode-btn')
        .forEach((button) => button.classList.toggle('acc-btn-active', button.dataset.val === fabMode));
      ui.syncFloatingUiVisibility();

      const eyes = state.fab.querySelectorAll('path:nth-of-type(1), path:nth-of-type(4)');
      eyes.forEach((path) => {
        path.style.fill = hasAccounts ? '#555' : 'none';
        path.style.stroke = '';
      });
    },
    syncPanelPos() {
      if (!state.fab || !state.panel) return;
      const rect = state.fab.getBoundingClientRect();
      state.panel.style.bottom = `${window.innerHeight - rect.top + 10}px`;
      state.panel.style.left = `${Math.max(10, rect.left - 290)}px`;
    },
    closePanel() {
      ui.hideNoteTooltip?.();
      if (state.panel) state.panel.classList.remove('show');
      state.isForcedShow = false;
      ui.refresh();
    },
    createShadowHost() {
      const existingHost = document.getElementById('anme-app-host');
      if (existingHost) {
        state.uiRoot = existingHost.shadowRoot;
        return;
      }

      const host = document.createElement('div');
      host.id = 'anme-app-host';
      document.body.appendChild(host);
      state.uiRoot = host.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = styleCss;
      state.uiRoot.appendChild(styleEl);
    },
    createFab() {
      const existingFab = ui.qs('#acc-mgr-fab');
      if (existingFab) {
        state.fab = existingFab;
        return;
      }

      state.fab = document.createElement('div');
      state.fab.id = 'acc-mgr-fab';
      utils.setHTML(state.fab, constants.ICONS.LOGO);
      state.uiRoot.appendChild(state.fab);

      ui.restoreFabPosition(GM_getValue(constants.CFG.FAB_POS));

      let isDrag = false;
      const dragThreshold = 4;
      const togglePanel = () => {
        if (isDrag || !state.panel) return;
        const willOpen = !state.panel.classList.contains('show');
        if (willOpen) {
          ui.refresh();
          ui.syncPanelPos();
          state.panel.classList.add('show');
          state.panel.focus();
        } else {
          state.panel.classList.remove('show');
          state.isForcedShow = false;
          ui.refresh();
        }
      };

      state.fab.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        state.fab.setPointerCapture?.(event.pointerId);
        state.fab.classList.add('is-pressed');
        isDrag = false;
        const startX = event.clientX;
        const startY = event.clientY;
        const baseX = state.fab.offsetLeft;
        const baseY = state.fab.offsetTop;

        const move = (moveEvent) => {
          if (moveEvent.pointerId !== event.pointerId) return;
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          if (!isDrag && Math.hypot(deltaX, deltaY) < dragThreshold) {
            return;
          }

          moveEvent.preventDefault();
          moveEvent.stopPropagation();
          moveEvent.stopImmediatePropagation?.();
          isDrag = true;
          ui.setFabPosition(baseX + moveEvent.clientX - startX, baseY + moveEvent.clientY - startY);
        };

        const up = (upEvent) => {
          if (upEvent.pointerId !== event.pointerId) return;
          document.removeEventListener('pointermove', move, true);
          document.removeEventListener('pointerup', up, true);
          document.removeEventListener('pointercancel', up, true);
          state.fab.releasePointerCapture?.(event.pointerId);
          state.fab.classList.remove('is-pressed');
          upEvent.preventDefault();
          upEvent.stopPropagation();
          upEvent.stopImmediatePropagation?.();
          if (isDrag || upEvent.type === 'pointercancel') {
            ui.setFabPosition(state.fab.offsetLeft, state.fab.offsetTop, { persist: true });
            return;
          }
          togglePanel();
        };

        document.addEventListener('pointermove', move, true);
        document.addEventListener('pointerup', up, true);
        document.addEventListener('pointercancel', up, true);
      });

      state.fab.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
      };
    },
    createPanel() {
      const existingPanel = ui.qs('#acc-mgr-panel');
      if (existingPanel) {
        state.panel = existingPanel;
        return;
      }

      state.panel = document.createElement('div');
      state.panel.id = 'acc-mgr-panel';
      state.panel.className = 'acc-panel';
      state.panel.setAttribute('tabindex', '-1');
      utils.setHTML(state.panel, templates.panel());
      state.uiRoot.appendChild(state.panel);
      ui.bindPanelEvents();

      const header = state.panel.querySelector('.acc-header');
      if (header) {
        const dragThreshold = 4;
        header.onmousedown = (event) => {
          if (event.button !== 0 || !state.panel?.classList.contains('show')) return;
          if (event.target.closest('button, a, input, select, textarea, label')) return;
          if (!state.fab) return;

          let isDrag = false;
          const startX = event.clientX;
          const startY = event.clientY;
          const baseX = state.fab.offsetLeft;
          const baseY = state.fab.offsetTop;
          header.classList.remove('is-dragging');

          const move = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            if (!isDrag && Math.hypot(deltaX, deltaY) < dragThreshold) {
              return;
            }

            isDrag = true;
            header.classList.add('is-dragging');
            ui.hideNoteTooltip?.();
            ui.setFabPosition(baseX + deltaX, baseY + deltaY);
          };

          const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            header.classList.remove('is-dragging');
            if (isDrag) {
              ui.setFabPosition(state.fab.offsetLeft, state.fab.offsetTop, { persist: true });
            }
          };

          event.preventDefault();
          event.stopPropagation();
          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        };
      }
    }
  };
}
