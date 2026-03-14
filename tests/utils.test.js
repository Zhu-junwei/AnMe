import assert from 'node:assert/strict';
import test from 'node:test';

import { createUtils } from '../src/app/utils.js';

const constants = {
  PREFIX: 'acc_stable_',
  ORDER_PREFIX: 'acc_order_',
  SITE_NAME_PREFIX: 'acc_site_name_',
  HOST: 'current.test'
};

function createStore(entries = {}) {
  return new Map(Object.entries(entries));
}

function createTestUtils(storeEntries = {}) {
  const store = createStore(storeEntries);

  globalThis.GM_listValues = () => [...store.keys()];
  globalThis.GM_getValue = (key, defaultValue) => (store.has(key) ? store.get(key) : defaultValue);
  globalThis.document = { title: 'Current Portal' };

  return createUtils({
    state: { currentLang: 'en', hostDisplayMode: 'siteName' },
    constants,
    i18nData: { en: {} }
  });
}

test('makeKey and extractName keep host and account name aligned', () => {
  const utils = createTestUtils();
  const key = utils.makeKey('Alpha', 'demo.test');

  assert.equal(key, 'acc_stable_demo.test::Alpha');
  assert.equal(utils.extractName(key), 'Alpha');
});

test('listAllHosts and getSortedKeysByHost respect saved order before timestamp fallback', () => {
  const utils = createTestUtils({
    'acc_stable_current.test::Gamma': { time: 100 },
    'acc_stable_current.test::Alpha': { time: 300 },
    'acc_stable_current.test::Beta': { time: 200 },
    'acc_stable_other.test::Zed': { time: 50 },
    'acc_order_current.test': ['Beta', 'Alpha']
  });

  assert.deepEqual(utils.listAllHosts().sort(), ['current.test', 'other.test']);
  assert.deepEqual(utils.getSortedKeysByHost('current.test'), [
    'acc_stable_current.test::Beta',
    'acc_stable_current.test::Alpha',
    'acc_stable_current.test::Gamma'
  ]);
});

test('suggestAccountName starts from host account count and skips collisions', () => {
  const utils = createTestUtils({
    'acc_stable_current.test::账号-01': { time: 100 },
    'acc_stable_current.test::Other Name': { time: 90 },
    'acc_stable_current.test::账号-04': { time: 80 },
    'acc_order_current.test': ['账号-01', 'Other Name', '账号-04']
  });

  assert.equal(utils.suggestAccountName('current.test'), '账号-05');
});

test('getSiteNameByHost prefers stored site name and falls back to current document title', () => {
  const utils = createTestUtils({
    'acc_stable_current.test::账号-01': { time: 100, siteName: '已保存站点名' },
    'acc_stable_other.test::账号-01': { time: 90 }
  });

  assert.equal(utils.getSiteNameByHost('current.test'), '已保存站点名');
  assert.equal(utils.getSiteNameByHost('other.test'), 'other.test');
});

test('getSiteNameByHost falls back to domain when no site name has been saved yet', () => {
  const utils = createTestUtils();

  assert.equal(utils.getSiteNameByHost('current.test'), 'current.test');
  assert.equal(utils.suggestSiteName('Current Portal', 'current.test'), 'Current Portal');
});

test('getHostDisplayName switches between site name and domain mode', () => {
  const utils = createTestUtils({
    'acc_stable_current.test::账号-01': { time: 100, siteName: '当前站点' }
  });

  assert.equal(utils.getHostDisplayName('current.test', 'siteName'), '当前站点');
  assert.equal(utils.getHostDisplayName('current.test', 'domain'), 'current.test');
});
