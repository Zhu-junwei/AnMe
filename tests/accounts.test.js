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

test('saveAccount stores edited values only in extension snapshot', async () => {
  const cookies = [
    { name: 'keepCookie', value: 'cookie-value', domain: 'current.test', path: '/' }
  ];
  const methods = createMethods({ cookies });

  const saved = await methods.saveAccount('Edited', 'Current Site', {
    ck: true,
    ls: true,
    ss: true,
    cookieKeys: ['keepCookie\u0001current.test\u0001/'],
    localStorageKeys: ['keepLocal'],
    sessionStorageKeys: ['keepSession'],
    cookieValues: {
      ['keepCookie\u0001current.test\u0001/']: 'edited-cookie-value'
    },
    localStorageValues: {
      keepLocal: 'edited-local-value'
    },
    sessionStorageValues: {
      keepSession: 'edited-session-value'
    }
  });

  assert.equal(saved, true);
  const snapshot = globalThis.GM_getValue('acc_stable_current.test::Edited');
  assert.deepEqual(snapshot.localStorage, { keepLocal: 'edited-local-value' });
  assert.deepEqual(snapshot.sessionStorage, { keepSession: 'edited-session-value' });
  assert.deepEqual(snapshot.cookies, [
    { name: 'keepCookie', value: 'edited-cookie-value', domain: 'current.test', path: '/' }
  ]);
  assert.equal(globalThis.localStorage.keepLocal, 'local-value');
  assert.equal(globalThis.sessionStorage.keepSession, 'session-value');
  assert.equal(cookies[0].value, 'cookie-value');
});

test('saveAccount can store editor rows with new cookie and storage fields', async () => {
  const methods = createMethods({ cookies: [] });

  const saved = await methods.saveAccount('Rows', 'Current Site', {
    ck: true,
    ls: true,
    ss: true,
    cookieRows: [
      {
        name: 'addedCookie',
        value: 'added-cookie-value',
        domain: 'current.test',
        path: '/',
        secure: false,
        sameSite: 'lax'
      }
    ],
    localStorageRows: [['addedLocal', 'added-local-value']],
    sessionStorageRows: [['addedSession', 'added-session-value']]
  });

  assert.equal(saved, true);
  const snapshot = globalThis.GM_getValue('acc_stable_current.test::Rows');
  assert.deepEqual(snapshot.localStorage, { addedLocal: 'added-local-value' });
  assert.deepEqual(snapshot.sessionStorage, { addedSession: 'added-session-value' });
  assert.deepEqual(snapshot.cookies, [
    {
      name: 'addedCookie',
      value: 'added-cookie-value',
      domain: 'current.test',
      path: '/',
      secure: false,
      sameSite: 'lax'
    }
  ]);
  assert.equal(globalThis.localStorage.addedLocal, undefined);
  assert.equal(globalThis.sessionStorage.addedSession, undefined);
});
