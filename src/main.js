import { CONST, I18N_DATA, STYLE_CSS } from './app/config.js';
import { createState } from './app/state.js';
import { createUtils } from './app/utils.js';
import { createTemplates } from './app/templates.js';
import { createCore } from './app/core.js';
import { createUI } from './app/ui.js';

(() => {
  'use strict';

  if (window.self !== window.top) return;

  const state = createState({ constants: CONST, i18nData: I18N_DATA });
  const utils = createUtils({ state, constants: CONST, i18nData: I18N_DATA });
  const templates = createTemplates({ state, constants: CONST, i18nData: I18N_DATA, utils });
  const core = createCore({ state, constants: CONST, utils });
  const ui = createUI({ state, constants: CONST, utils, templates, core, styleCss: STYLE_CSS });
  core.setUI(ui);

  const start = () => {
    if (!document.body) {
      setTimeout(start, 200);
      return;
    }

    ui.init();
    new MutationObserver(() => {
      if (!document.getElementById('anme-app-host')) {
        ui.init();
      }
    }).observe(document.body, { childList: true });
  };

  window.addEventListener('resize', () => {
    if (!state.fab) return;

    if (state.fab.style.left) {
      state.fab.style.left = `${Math.min(Math.max(0, parseFloat(state.fab.style.left)), window.innerWidth - 44)}px`;
      state.fab.style.top = `${Math.min(Math.max(0, parseFloat(state.fab.style.top)), window.innerHeight - 44)}px`;
    }
    if (state.panel && state.panel.classList.contains('show')) {
      ui.syncPanelPos();
    }
    ui.syncFloatingUiVisibility?.();
  });

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      ui.syncFloatingUiVisibility?.();
    });
  });

  document.addEventListener('click', (event) => {
    if (!state.panel || !state.panel.classList.contains('show')) return;
    const path = event.composedPath();
    const isInsideNoteTooltip =
      Boolean(state.noteTooltipEl) &&
      (path.includes(state.noteTooltipEl) ||
        path.some((node) => typeof state.noteTooltipEl?.contains === 'function' && state.noteTooltipEl.contains(node)));
    if (
      !path.includes(state.panel) &&
      !path.includes(state.fab) &&
      !path.includes(state.dialogMask) &&
      !isInsideNoteTooltip
    ) {
      ui.closePanel();
    }
  });

  GM_registerMenuCommand(utils.t('menu_open'), () => {
    state.isForcedShow = true;
    ui.init();
    if (state.fab) state.fab.style.display = 'flex';
    if (state.panel && !state.panel.classList.contains('show')) {
      state.panel.classList.add('show');
      ui.syncPanelPos();
    }
    ui.refresh();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    start();
  } else {
    window.addEventListener('DOMContentLoaded', start);
  }
})();
