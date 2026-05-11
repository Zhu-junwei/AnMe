const EXTENSION_MESSAGE_TYPE = 'ANME_EXTENSION_BRIDGE';

function getApi() {
  if (typeof browser !== 'undefined' && browser?.runtime) return browser;
  return chrome;
}

const api = getApi();

function callApi(method, ...args) {
  if (typeof browser !== 'undefined' && browser?.runtime) {
    return Promise.resolve(method(...args));
  }

  return new Promise((resolve, reject) => {
    try {
      const maybePromise = method(...args, (result) => {
        const lastError = globalThis.chrome?.runtime?.lastError;
        if (lastError) {
          reject(new Error(lastError.message || 'extension_api_error'));
          return;
        }
        resolve(result);
      });
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function cookieUrl(cookie = {}, fallbackUrl = '') {
  try {
    const fallback = new URL(fallbackUrl || 'https://example.com/');
    const host = String(cookie.domain || fallback.hostname).replace(/^\./, '') || fallback.hostname;
    const scheme = cookie.secure || fallback.protocol === 'https:' ? 'https:' : 'http:';
    const path = String(cookie.path || '/').startsWith('/') ? String(cookie.path || '/') : '/';
    return `${scheme}//${host}${path}`;
  } catch {
    return fallbackUrl;
  }
}

function normalizeCookieForSet(details = {}) {
  const pageUrl = details.url || '';
  const cookie = { ...details };
  delete cookie.hostOnly;
  delete cookie.session;
  delete cookie.url;

  if (!cookie.url) {
    cookie.url = cookieUrl(cookie, pageUrl);
  }
  if (cookie.expirationDate !== undefined && cookie.expirationDate !== null) {
    const expirationDate = Number(cookie.expirationDate);
    if (Number.isFinite(expirationDate) && expirationDate > 0) {
      cookie.expirationDate = expirationDate;
    } else {
      delete cookie.expirationDate;
    }
  }
  if (!cookie.path) cookie.path = '/';
  if (cookie.sameSite === 'no_restriction') cookie.secure = true;
  return cookie;
}

function dataToBody(data) {
  if (!data || data.kind === 'empty') return undefined;
  if (data.kind === 'bytes') return new Uint8Array(data.value || []).buffer;
  return String(data.value || '');
}

function headersToText(headers) {
  return [...headers.entries()].map(([key, value]) => `${key}: ${value}`).join('\r\n');
}

async function httpRequest(request = {}) {
  const response = await fetch(request.url, {
    method: request.method || 'GET',
    headers: request.headers || {},
    body: dataToBody(request.data),
    cache: 'no-store',
    credentials: 'omit'
  });
  const responseType = request.responseType || 'text';
  const result = {
    url: request.url,
    finalUrl: response.url,
    status: response.status,
    statusText: response.statusText,
    responseHeaders: headersToText(response.headers),
    contentType: response.headers.get('content-type') || '',
    responseType
  };

  if (responseType === 'arraybuffer' || responseType === 'blob') {
    result.bodyBytes = [...new Uint8Array(await response.arrayBuffer())];
  } else {
    result.bodyText = await response.text();
  }
  return result;
}

async function handleMessage(payload = {}) {
  if (payload.action === 'cookies.list') {
    return callApi(api.cookies.getAll.bind(api.cookies), payload.details || {});
  }
  if (payload.action === 'cookies.delete') {
    const details = payload.details || {};
    return callApi(api.cookies.remove.bind(api.cookies), {
      url: cookieUrl(details, details.url),
      name: details.name,
      storeId: details.storeId
    });
  }
  if (payload.action === 'cookies.set') {
    return callApi(api.cookies.set.bind(api.cookies), normalizeCookieForSet(payload.details || {}));
  }
  if (payload.action === 'http.request') {
    return httpRequest(payload.request || {});
  }
  throw new Error(`unknown_action:${payload.action}`);
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== EXTENSION_MESSAGE_TYPE) return undefined;

  handleMessage(message.payload)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});

async function openPanel(tab) {
  if (!tab?.id) return;
  try {
    await callApi(api.tabs.sendMessage.bind(api.tabs), tab.id, {
      type: EXTENSION_MESSAGE_TYPE,
      payload: { action: 'menu.open' }
    });
  } catch {
    // Restricted pages cannot receive content scripts. The browser quietly ignores them.
  }
}

api.action?.onClicked?.addListener?.(openPanel);
api.browserAction?.onClicked?.addListener?.(openPanel);
