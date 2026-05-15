import assert from 'node:assert/strict';
import test from 'node:test';

import { applySenderCookieStore, resolveSenderCookieStoreId } from '../src/extension/cookie-store.js';

test('cookie bridge targets the cookie store used by the sender tab', async () => {
  const api = {
    cookies: {
      getAllCookieStores: () => {}
    }
  };
  const calls = [];
  const callApi = async (method) => {
    calls.push(method);
    return [
      { id: '0', tabIds: [1, 2] },
      { id: '1', tabIds: [9] }
    ];
  };

  const storeId = await resolveSenderCookieStoreId({
    api,
    callApi,
    sender: { tab: { id: 9, incognito: true } }
  });

  assert.equal(storeId, '1');
  assert.equal(calls.length, 1);
});

test('cookie bridge overwrites a saved normal store id in incognito tabs', () => {
  assert.deepEqual(
    applySenderCookieStore(
      { url: 'https://example.com/', name: 'sid', storeId: '0' },
      '1',
      { tab: { id: 9, incognito: true } }
    ),
    { url: 'https://example.com/', name: 'sid', storeId: '1' }
  );
});

test('cookie bridge avoids forcing a stale store id when incognito store lookup is unavailable', () => {
  assert.deepEqual(
    applySenderCookieStore(
      { url: 'https://example.com/', name: 'sid', storeId: '0' },
      undefined,
      { tab: { id: 9, incognito: true } }
    ),
    { url: 'https://example.com/', name: 'sid' }
  );
});
