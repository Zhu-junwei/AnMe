import { createAccountMethods } from './core/accounts.js';
import { createBackupMethods } from './core/backup.js';
import { createEnvironmentMethods } from './core/environment.js';
import { createInspectorMethods } from './core/inspector.js';
import { createCoreShared } from './core/shared.js';
import { createWebDavMethods } from './core/webdav.js';

export function createCore({ constants, utils }) {
  let ui = null;
  const shared = createCoreShared();

  const core = {
    setUI(nextUi) {
      ui = nextUi;
    }
  };

  const getUI = () => ui;
  const getCore = () => core;

  Object.assign(
    core,
    createAccountMethods({ constants, utils, getUI, shared }),
    createEnvironmentMethods({ getUI, shared }),
    createInspectorMethods({ constants, utils }),
    createBackupMethods({ constants, utils, getUI }),
    createWebDavMethods({ constants, utils, getUI, getCore })
  );

  return core;
}
