import { createEventMethods } from './ui/events.js';
import { createFeedbackMethods } from './ui/feedback.js';
import { createPanelMethods } from './ui/panel.js';
import { createSwitchingMethods } from './ui/switching.js';
import { createWebDavUiMethods } from './ui/webdav.js';

export function createUI({ state, constants, utils, templates, core, styleCss }) {
  const ui = {
    getPageTitle(pageId) {
      if (pageId === 'pg-set') return utils.t('nav_set');
      if (pageId === 'pg-notice') return utils.t('nav_notice');
      if (pageId === 'pg-about') return utils.t('nav_about');
      if (pageId === 'pg-account-settings') return utils.t('account_settings');
      if (pageId === 'pg-webdav') return utils.t('nav_webdav');
      return '';
    },
    qs(selector) {
      return state.uiRoot ? state.uiRoot.querySelector(selector) : null;
    },
    qsa(selector) {
      return state.uiRoot ? state.uiRoot.querySelectorAll(selector) : [];
    }
  };

  Object.assign(
    ui,
    createFeedbackMethods({ state, constants, utils, core, ui }),
    createSwitchingMethods({ state, constants, utils, templates, core, ui }),
    createWebDavUiMethods({ state, constants, utils, core, ui }),
    createPanelMethods({ state, constants, utils, templates, styleCss, ui }),
    createEventMethods({ state, constants, utils, core, ui }),
    {
      init() {
        ui.createShadowHost();
        ui.createFab();
        ui.createPanel();
        ui.refresh();
      }
    }
  );

  return ui;
}
