const EXTENSION_MESSAGE_TYPE = 'ANME_EXTENSION_BRIDGE';

function getExtensionApi() {
  if (typeof globalThis.browser !== 'undefined' && globalThis.browser?.runtime?.sendMessage) {
    return globalThis.browser;
  }
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome?.runtime?.sendMessage) {
    return globalThis.chrome;
  }
  return null;
}

function callExtensionApi(method, ...args) {
  if (typeof globalThis.browser !== 'undefined' && globalThis.browser?.runtime) {
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

async function sendExtensionMessage(payload) {
  const extensionApi = getExtensionApi();
  if (!extensionApi?.runtime?.sendMessage) {
    throw new Error('extension_runtime_unavailable');
  }
  const response = await callExtensionApi(extensionApi.runtime.sendMessage.bind(extensionApi.runtime), {
    type: EXTENSION_MESSAGE_TYPE,
    payload
  });
  if (!response?.ok) {
    throw new Error(response?.error || 'extension_bridge_error');
  }
  return response.result;
}

function cloneValue(value) {
  if (value === undefined) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function normalizeStorageMap(items) {
  return items && typeof items === 'object' && !Array.isArray(items) ? { ...items } : {};
}

function bytesToArrayBuffer(bytes) {
  const source = Array.isArray(bytes) ? bytes : [];
  return new Uint8Array(source).buffer;
}

async function normalizeRequestData(data) {
  if (data === undefined || data === null) {
    return { kind: 'empty' };
  }
  if (typeof data === 'string') {
    return { kind: 'text', value: data };
  }
  if (data instanceof Blob) {
    return { kind: 'bytes', value: [...new Uint8Array(await data.arrayBuffer())] };
  }
  if (data instanceof ArrayBuffer) {
    return { kind: 'bytes', value: [...new Uint8Array(data)] };
  }
  if (ArrayBuffer.isView(data)) {
    return { kind: 'bytes', value: [...new Uint8Array(data.buffer, data.byteOffset, data.byteLength)] };
  }
  return { kind: 'text', value: String(data) };
}

function createXhrResponse(response) {
  const responseType = response?.responseType || 'text';
  let responsePayload = response?.bodyText || '';

  if (responseType === 'arraybuffer') {
    responsePayload = bytesToArrayBuffer(response?.bodyBytes);
  } else if (responseType === 'blob') {
    responsePayload = new Blob([bytesToArrayBuffer(response?.bodyBytes)], {
      type: response?.contentType || 'application/octet-stream'
    });
  }

  return {
    status: Number(response?.status) || 0,
    statusText: String(response?.statusText || ''),
    responseHeaders: String(response?.responseHeaders || ''),
    responseText: String(response?.bodyText || ''),
    response: responsePayload,
    finalUrl: String(response?.finalUrl || response?.url || '')
  };
}

async function installStorageBridge(extensionApi) {
  const storageArea = extensionApi?.storage?.local;
  if (!storageArea?.get) {
    throw new Error('extension_storage_unavailable');
  }

  const store = normalizeStorageMap(await callExtensionApi(storageArea.get.bind(storageArea), null));

  globalThis.GM_getValue = (key, defaultValue) => (Object.prototype.hasOwnProperty.call(store, key) ? cloneValue(store[key]) : defaultValue);
  globalThis.GM_setValue = (key, value) => {
    store[key] = cloneValue(value);
    callExtensionApi(storageArea.set.bind(storageArea), { [key]: store[key] }).catch((error) => console.error('[AnMe] storage set failed', error));
  };
  globalThis.GM_deleteValue = (key) => {
    delete store[key];
    callExtensionApi(storageArea.remove.bind(storageArea), key).catch((error) => console.error('[AnMe] storage remove failed', error));
  };
  globalThis.GM_listValues = () => Object.keys(store);

  if (storageArea.onChanged || extensionApi.storage?.onChanged) {
    extensionApi.storage.onChanged?.addListener?.((changes, areaName) => {
      if (areaName && areaName !== 'local') return;
      Object.entries(changes || {}).forEach(([key, change]) => {
        if (Object.prototype.hasOwnProperty.call(change, 'newValue')) {
          store[key] = cloneValue(change.newValue);
        } else {
          delete store[key];
        }
      });
    });
  }
}

function installCookieBridge() {
  globalThis.GM_cookie = {
    list(details = {}, callback) {
      sendExtensionMessage({
        action: 'cookies.list',
        details: {
          ...details,
          url: details.url || location.href
        }
      })
        .then((cookies) => callback?.(cookies || []))
        .catch((error) => {
          console.error('[AnMe] cookie list failed', error);
          callback?.([]);
        });
    },
    delete(details = {}, callback) {
      sendExtensionMessage({
        action: 'cookies.delete',
        details: {
          ...details,
          url: details.url || location.href
        }
      })
        .then((result) => callback?.(result))
        .catch((error) => {
          console.error('[AnMe] cookie delete failed', error);
          callback?.(null);
        });
    },
    set(details = {}, callback) {
      sendExtensionMessage({
        action: 'cookies.set',
        details: {
          ...details,
          url: details.url || location.href
        }
      })
        .then((cookie) => callback?.(cookie))
        .catch((error) => {
          console.error('[AnMe] cookie set failed', error);
          callback?.(null);
        });
    }
  };
}

function installHttpBridge() {
  globalThis.GM_xmlhttpRequest = (options = {}) => {
    let aborted = false;

    (async () => {
      try {
        const result = await sendExtensionMessage({
          action: 'http.request',
          request: {
            method: options.method || 'GET',
            url: options.url,
            headers: options.headers || {},
            responseType: options.responseType || 'text',
            data: await normalizeRequestData(options.data)
          }
        });
        if (!aborted) {
          options.onload?.(createXhrResponse(result));
        }
      } catch (error) {
        if (!aborted) {
          options.onerror?.(error);
        }
      }
    })();

    return {
      abort() {
        aborted = true;
        options.onabort?.();
      }
    };
  };
}

function installMenuBridge(extensionApi) {
  const menuCallbacks = [];
  globalThis.GM_registerMenuCommand = (_name, callback) => {
    if (typeof callback === 'function') {
      menuCallbacks.push(callback);
    }
    return menuCallbacks.length;
  };

  extensionApi.runtime?.onMessage?.addListener?.((message) => {
    if (message?.type !== EXTENSION_MESSAGE_TYPE || message?.payload?.action !== 'menu.open') {
      return undefined;
    }
    menuCallbacks.forEach((callback) => callback());
    return undefined;
  });
}

export async function installExtensionRuntimeIfNeeded() {
  if (typeof globalThis.GM_getValue === 'function') {
    return false;
  }

  const extensionApi = getExtensionApi();
  if (!extensionApi) {
    return false;
  }

  await installStorageBridge(extensionApi);
  installCookieBridge();
  installHttpBridge();
  installMenuBridge(extensionApi);
  return true;
}
