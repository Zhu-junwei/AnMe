import assert from 'node:assert/strict';
import test from 'node:test';

import { createAccountMethods } from '../src/app/core/accounts.js';

const constants = {
  HOST: 'current.test',
  PREFIX: 'acc_stable_',
  ORDER_PREFIX: 'acc_order_',
  SITE_NAME_PREFIX: 'acc_site_name_'
};

function createStore() {
  const store = new Map();
  globalThis.GM_getValue = (key, defaultValue) => (store.has(key) ? store.get(key) : defaultValue);
  globalThis.GM_setValue = (key, value) => store.set(key, value);
  return store;
}

function createMethods({ cookies }) {
  createStore();
  globalThis.localStorage = {
    keepLocal: 'local-value',
    dropLocal: 'drop-local'
  };
  globalThis.sessionStorage = {
    keepSession: 'session-value',
    dropSession: 'drop-session'
  };

  const methods = createAccountMethods({
    constants,
    utils: {
      normalizeSiteName: (value) => value,
      normalizeNoteText: (value) => value || '',
      makeKey: (name, host = constants.HOST) => `${constants.PREFIX}${host}::${name}`,
      extractName: (key) => key.split('::').pop(),
      getSortedKeysByHost: () => [],
      t: (key) => key
    },
    getUI: () => ({ alert: async () => {} }),
    getCore: () => ({ syncHostIconCache: () => {} }),
    shared: {
      listCookies: async () => cookies
    }
  });

  return methods;
}

test('saveAccount stores only selected cookie and storage keys', async () => {
  const cookies = [
    { name: 'keepCookie', value: 'cookie-value', domain: 'current.test', path: '/' },
    { name: 'dropCookie', value: 'drop-cookie', domain: 'current.test', path: '/' }
  ];
  const methods = createMethods({ cookies });

  const saved = await methods.saveAccount('Alpha', 'Current Site', {
    ck: true,
    ls: true,
    ss: true,
    cookieKeys: ['keepCookie\u0001current.test\u0001/'],
    localStorageKeys: ['keepLocal'],
    sessionStorageKeys: ['keepSession'],
    note: 'Important'
  });

  assert.equal(saved, true);
  const snapshot = globalThis.GM_getValue('acc_stable_current.test::Alpha');
  assert.deepEqual(snapshot.localStorage, { keepLocal: 'local-value' });
  assert.deepEqual(snapshot.sessionStorage, { keepSession: 'session-value' });
  assert.deepEqual(snapshot.cookies, [cookies[0]]);
  assert.equal(snapshot.note, 'Important');
});
