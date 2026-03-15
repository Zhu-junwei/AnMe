export function createPanelMethods({ state, constants, utils, templates, styleCss, ui }) {
  return {
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
      const projectBtn = ui.qs('#btn-open-project');
      const webdavBtn = ui.qs('#btn-open-webdav');

      if (backBtn) backBtn.style.display = isSetActive || isNoticeActive || isAboutActive || isAccountSettingsActive || isWebDavActive ? 'flex' : 'none';
      if (homeBtn) homeBtn.style.display = isSwitchActive && !canOperateCurrentHost ? 'flex' : 'none';
      if (settingsBtn) settingsBtn.style.display = isSwitchActive ? 'flex' : 'none';
      if (projectBtn) projectBtn.style.display = isSwitchActive ? 'flex' : 'none';
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
      const isPanelOpen = state.panel.classList.contains('show');
      state.panel
        .querySelectorAll('.fab-mode-btn')
        .forEach((button) => button.classList.toggle('acc-btn-active', button.dataset.val === fabMode));
      state.fab.style.display =
        isPanelOpen || state.isForcedShow || fabMode === 'show' || (fabMode === 'auto' && hasAccounts) ? 'flex' : 'none';

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

      const savedPos = GM_getValue(constants.CFG.FAB_POS);
      if (savedPos && savedPos.left !== undefined) {
        state.fab.style.left = `${Math.max(0, Math.min(savedPos.left, window.innerWidth - 44))}px`;
        state.fab.style.top = `${Math.max(0, Math.min(savedPos.top, window.innerHeight - 44))}px`;
        state.fab.style.bottom = 'auto';
        state.fab.style.right = 'auto';
      }

      let isDrag = false;
      const dragThreshold = 4;
      state.fab.onmousedown = (event) => {
        isDrag = false;
        const startX = event.clientX;
        const startY = event.clientY;
        const baseX = state.fab.offsetLeft;
        const baseY = state.fab.offsetTop;

        const move = (moveEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          if (!isDrag && Math.hypot(deltaX, deltaY) < dragThreshold) {
            return;
          }

          isDrag = true;
          const newLeft = Math.max(0, Math.min(baseX + moveEvent.clientX - startX, window.innerWidth - 44));
          const newTop = Math.max(0, Math.min(baseY + moveEvent.clientY - startY, window.innerHeight - 44));
          state.fab.style.left = `${newLeft}px`;
          state.fab.style.top = `${newTop}px`;
          state.fab.style.bottom = 'auto';
          state.fab.style.right = 'auto';
          if (state.panel && state.panel.classList.contains('show')) ui.syncPanelPos();
        };

        const up = () => {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
          if (isDrag) {
            GM_setValue(constants.CFG.FAB_POS, {
              left: parseInt(state.fab.style.left, 10),
              top: parseInt(state.fab.style.top, 10)
            });
          }
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
      };

      state.fab.onclick = (event) => {
        if (isDrag || !state.panel) return;
        event.stopPropagation();
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
    }
  };
}
