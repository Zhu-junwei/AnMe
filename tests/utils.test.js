import assert from 'node:assert/strict';
import test from 'node:test';

import { createUtils } from '../src/app/utils.js';
import {
  resolveWebDavPasswordForSubmit,
  syncSaveNoteFromMatchedAccount,
  trackSaveNoteManualEdit
} from '../src/app/ui/feedback.js';

const constants = {
  PREFIX: 'acc_stable_',
  ORDER_PREFIX: 'acc_order_',
  SITE_NAME_PREFIX: 'acc_site_name_',
  HOST: 'current.test'
};

function createStore(entries = {}) {
  return new Map(Object.entries(entries));
}

function createTestUtils(storeEntries = {}, { lang = 'en' } = {}) {
  const store = createStore(storeEntries);

  globalThis.GM_listValues = () => [...store.keys()];
  globalThis.GM_getValue = (key, defaultValue) => (store.has(key) ? store.get(key) : defaultValue);
  globalThis.document = { title: 'Current Portal' };

  return createUtils({
    state: { currentLang: lang, hostDisplayMode: 'siteName' },
    constants,
    i18nData: {
      en: { default_account_prefix: 'Account' },
      zh: { default_account_prefix: '\u8d26\u53f7' },
      es: { default_account_prefix: 'Cuenta' }
    }
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

test('suggestAccountName follows the active language and skips exact collisions', () => {
  const zhPrefix = '\u8d26\u53f7';
  const storeEntries = {
    [`acc_stable_current.test::${zhPrefix}-01`]: { time: 100 },
    'acc_stable_current.test::Other Name': { time: 90 },
    [`acc_stable_current.test::${zhPrefix}-04`]: { time: 80 },
    'acc_order_current.test': [`${zhPrefix}-01`, 'Other Name', `${zhPrefix}-04`]
  };
  const englishUtils = createTestUtils(storeEntries);
  const chineseUtils = createTestUtils(storeEntries, { lang: 'zh' });

  assert.equal(englishUtils.suggestAccountName('current.test'), 'Account-04');
  assert.equal(chineseUtils.suggestAccountName('current.test'), `${zhPrefix}-05`);
});

test('getSiteNameByHost prefers stored site name and falls back to current document title', () => {
  const siteName = '\u5df2\u4fdd\u5b58\u7ad9\u70b9\u540d';
  const accountName = '\u8d26\u53f7-01';
  const utils = createTestUtils({
    [`acc_stable_current.test::${accountName}`]: { time: 100, siteName },
    [`acc_stable_other.test::${accountName}`]: { time: 90 }
  });

  assert.equal(utils.getSiteNameByHost('current.test'), siteName);
  assert.equal(utils.getSiteNameByHost('other.test'), 'other.test');
});

test('getSiteNameByHost falls back to domain when no site name has been saved yet', () => {
  const utils = createTestUtils();

  assert.equal(utils.getSiteNameByHost('current.test'), 'current.test');
  assert.equal(utils.suggestSiteName('Current Portal', 'current.test'), 'Current Portal');
});

test('getHostDisplayName switches between site name and domain mode', () => {
  const siteName = '\u5f53\u524d\u7ad9\u70b9';
  const accountName = '\u8d26\u53f7-01';
  const utils = createTestUtils({
    [`acc_stable_current.test::${accountName}`]: { time: 100, siteName }
  });

  assert.equal(utils.getHostDisplayName('current.test', 'siteName'), siteName);
  assert.equal(utils.getHostDisplayName('current.test', 'domain'), 'current.test');
});

test('save modal note autofill reuses the stored note for an existing account name', () => {
  const utils = createTestUtils();
  const getExistingAccount = (name) =>
    name === 'Alpha'
      ? { key: 'acc_stable_current.test::Alpha', note: 'Existing note' }
      : null;

  const result = syncSaveNoteFromMatchedAccount({
    name: ' Alpha ',
    currentNote: '',
    syncState: {},
    getExistingAccount,
    normalizeName: (value) => utils.normalizeText(value),
    normalizeNote: (value) => utils.normalizeNoteText(value)
  });

  assert.equal(result.nextNote, 'Existing note');
  assert.deepEqual(result.nextState, {
    lastMatchedKey: 'acc_stable_current.test::Alpha',
    lastAutoFilledNote: 'Existing note',
    lockedKey: ''
  });
});

test('save modal stops overwriting the note after the user edits the auto-filled remark', () => {
  const utils = createTestUtils();
  const getExistingAccount = (name) =>
    name === 'Alpha'
      ? { key: 'acc_stable_current.test::Alpha', note: 'Existing note' }
      : name === 'Beta'
        ? { key: 'acc_stable_current.test::Beta', note: 'Second note' }
        : null;

  const initial = syncSaveNoteFromMatchedAccount({
    name: 'Alpha',
    currentNote: '',
    syncState: {},
    getExistingAccount,
    normalizeName: (value) => utils.normalizeText(value),
    normalizeNote: (value) => utils.normalizeNoteText(value)
  });

  const editedState = trackSaveNoteManualEdit({
    currentNote: 'Existing note updated',
    syncState: initial.nextState,
    normalizeNote: (value) => utils.normalizeNoteText(value)
  });

  const sameAccountResult = syncSaveNoteFromMatchedAccount({
    name: 'Alpha',
    currentNote: 'Existing note updated',
    syncState: editedState,
    getExistingAccount,
    normalizeName: (value) => utils.normalizeText(value),
    normalizeNote: (value) => utils.normalizeNoteText(value)
  });
  assert.equal(sameAccountResult.nextNote, 'Existing note updated');
  assert.equal(sameAccountResult.nextState.lockedKey, 'acc_stable_current.test::Alpha');

  const otherAccountResult = syncSaveNoteFromMatchedAccount({
    name: 'Beta',
    currentNote: 'Existing note updated',
    syncState: sameAccountResult.nextState,
    getExistingAccount,
    normalizeName: (value) => utils.normalizeText(value),
    normalizeNote: (value) => utils.normalizeNoteText(value)
  });
  assert.equal(otherAccountResult.nextNote, 'Second note');
  assert.deepEqual(otherAccountResult.nextState, {
    lastMatchedKey: 'acc_stable_current.test::Beta',
    lastAutoFilledNote: 'Second note',
    lockedKey: ''
  });
});

test('webdav config submit keeps the newly typed password after logout', () => {
  assert.equal(
    resolveWebDavPasswordForSubmit({
      hasSavedPassword: false,
      passwordDirty: false,
      passwordInputValue: 'new-password',
      savedPassword: ''
    }),
    'new-password'
  );
});

test('webdav config submit keeps the saved password when the masked field was not edited', () => {
  assert.equal(
    resolveWebDavPasswordForSubmit({
      hasSavedPassword: true,
      passwordDirty: false,
      passwordInputValue: '******',
      savedPassword: 'saved-password'
    }),
    'saved-password'
  );
});
