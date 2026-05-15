export async function resolveSenderCookieStoreId({ api, callApi, sender } = {}) {
  const tab = sender?.tab;
  if (tab?.cookieStoreId) return tab.cookieStoreId;

  const tabId = tab?.id;
  const getAllCookieStores = api?.cookies?.getAllCookieStores;
  if (typeof tabId !== 'number' || !getAllCookieStores || typeof callApi !== 'function') {
    return undefined;
  }

  const stores = await callApi(getAllCookieStores.bind(api.cookies)).catch(() => []);
  const store = (Array.isArray(stores) ? stores : []).find((item) =>
    Array.isArray(item?.tabIds) && item.tabIds.includes(tabId)
  );
  return store?.id;
}

export function applySenderCookieStore(details = {}, storeId, sender = {}) {
  const nextDetails = { ...details };
  if (storeId) {
    nextDetails.storeId = storeId;
  } else if (sender?.tab?.incognito) {
    delete nextDetails.storeId;
  }
  return nextDetails;
}
