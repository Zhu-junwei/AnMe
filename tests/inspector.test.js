import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectorMethods } from '../src/app/core/inspector.js';

const constants = {
  PREFIX: 'acc_stable_'
};

function createStore(initialData) {
  const store = new Map(Object.entries(initialData));
  globalThis.GM_getValue = (key, defaultValue) => (store.has(key) ? store.get(key) : defaultValue);
  globalThis.GM_setValue = (key, value) => store.set(key, value);
  return store;
}

function createMethods({ ui }) {
  return createInspectorMethods({
    utils: {
      extractName: (key) => key.split('::').pop(),
      extractHost: (key) => key.split('::')[0].replace(constants.PREFIX, ''),
      t: (key) => key
    },
    getUI: () => ui
  });
}

test('inspectData edits selected userscript data after confirmation and refreshes time', async () => {
  const accountKey = `${constants.PREFIX}current.test::Alpha`;
  const store = createStore({
    [accountKey]: {
      time: 100,
      cookies: [
        { name: 'keepCookie', value: 'old-cookie', domain: 'current.test', path: '/' }
      ],
      localStorage: {},
      sessionStorage: {}
    }
  });
  let inspectorArgs;
  let refreshed = false;
  let toastMessage = '';
  const originalNow = Date.now;
  Date.now = () => 123456;

  try {
    const methods = createMethods({
      ui: {
        showDataInspectorTabs: async (args) => {
          inspectorArgs = args;
          return {
            tabs: {
              cookies: {
                data: [
                  { name: 'keepCookie', value: 'new-cookie', domain: 'current.test', path: '/' }
                ],
                rows: [],
                selectedKeys: ['keepCookie\u0001current.test\u0001/']
              }
            },
            activeType: 'cookies'
          };
        },
        confirm: async () => true,
        refresh: () => {
          refreshed = true;
        },
        showToast: (message) => {
          toastMessage = message;
        }
      }
    });

    await methods.inspectData(accountKey, 'cookies');

    assert.equal(inspectorArgs.selectable, true);
    assert.equal(inspectorArgs.confirmDisabledUntilDirty, true);
    assert.equal(inspectorArgs.host, 'current.test');
    assert.equal(inspectorArgs.initialType, 'cookies');
    assert.deepEqual(inspectorArgs.tabs.map((tab) => tab.type), ['cookies']);
    assert.deepEqual(inspectorArgs.tabs[0].selectedKeys, ['keepCookie\u0001current.test\u0001/']);
    const snapshot = store.get(accountKey);
    assert.equal(snapshot.time, 123456);
    assert.deepEqual(snapshot.cookies, [
      { name: 'keepCookie', value: 'new-cookie', domain: 'current.test', path: '/' }
    ]);
    assert.equal(refreshed, true);
    assert.equal(toastMessage, 'toast_account_updated');
  } finally {
    Date.now = originalNow;
  }
});

test('inspectData skips confirmation and save when data is unchanged', async () => {
  const accountKey = `${constants.PREFIX}current.test::Alpha`;
  const originalSnapshot = {
    time: 100,
    cookies: [
      { name: 'keepCookie', value: 'old-cookie', domain: 'current.test', path: '/' }
    ],
    localStorage: {},
    sessionStorage: {}
  };
  const store = createStore({ [accountKey]: originalSnapshot });
  let confirmCalled = false;
  let refreshed = false;
  let toastMessage = '';

  const methods = createMethods({
    ui: {
      showDataInspectorTabs: async () => ({
        tabs: {
          cookies: {
            data: [
              { path: '/', domain: 'current.test', value: 'old-cookie', name: 'keepCookie' }
            ],
            rows: [],
            selectedKeys: ['keepCookie\u0001current.test\u0001/']
          }
        },
        activeType: 'cookies'
      }),
      confirm: async () => {
        confirmCalled = true;
        return true;
      },
      refresh: () => {
        refreshed = true;
      },
      showToast: (message) => {
        toastMessage = message;
      }
    }
  });

  await methods.inspectData(accountKey, 'cookies');

  assert.equal(confirmCalled, false);
  assert.equal(refreshed, false);
  assert.equal(toastMessage, '');
  assert.equal(store.get(accountKey), originalSnapshot);
});
