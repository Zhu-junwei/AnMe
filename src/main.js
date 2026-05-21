import { CONST, I18N_DATA, STYLE_CSS } from './app/config.js';
import { createState } from './app/state.js';
import { createUtils } from './app/utils.js';
import { createTemplates } from './app/templates.js';
import { createCore } from './app/core.js';
import { createUI } from './app/ui.js';
import { installExtensionRuntimeIfNeeded } from './app/runtime.js';

(async () => {
  'use strict';

  if (window.self !== window.top) return;
  await installExtensionRuntimeIfNeeded();

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

    ui.syncFabPosition?.();
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
    const isNode = (value) => value instanceof Node;
    const isInside = (target) =>
      Boolean(target) &&
      (path.includes(target) ||
        path.some((node) => isNode(node) && typeof target.contains === 'function' && target.contains(node)));
    const isTooltipVisible = Boolean(state.noteTooltipEl?.classList.contains('show'));
    const isInsideNoteTooltip =
      Boolean(state.noteTooltipEl) && isInside(state.noteTooltipEl);
    const isInsideTooltipTrigger =
      Boolean(state.noteTooltipTarget) && isInside(state.noteTooltipTarget);
    const isInsideDataInspector = isInside(state.dataInspectorMask);

    if (
      isTooltipVisible &&
      !isInsideNoteTooltip &&
      !isInsideTooltipTrigger &&
      !path.includes(state.dialogMask) &&
      !isInsideDataInspector
    ) {
      ui.hideNoteTooltip();
    }

    if (
      !path.includes(state.panel) &&
      !path.includes(state.fab) &&
      !path.includes(state.dialogMask) &&
      !isInsideDataInspector &&
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

  start();
})();
