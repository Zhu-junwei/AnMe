import { createAccountMethods } from './core/accounts.js';
import { createBackupMethods } from './core/backup.js';
import { createEnvironmentMethods } from './core/environment.js';
import { createInspectorMethods } from './core/inspector.js';
import { createCoreShared } from './core/shared.js';
import { createWebDavMethods } from './core/webdav.js';

export function createCore({ state, constants, utils }) {
  let ui = null;
  const shared = createCoreShared();
  const hostIconFetchJobs = new Map();

  const getHostIconCache = () => {
    if (!state.hostIconCache || typeof state.hostIconCache !== 'object' || Array.isArray(state.hostIconCache)) {
      state.hostIconCache = {};
    }
    return state.hostIconCache;
  };

  const syncHostIconCache = () => {
    const nextCache = {};
    Object.entries(getHostIconCache()).forEach(([host, entry]) => {
      if (host && entry?.dataUrl && utils.getSortedKeysByHost(host).length > 0) {
        nextCache[host] = { dataUrl: entry.dataUrl };
      }
    });
    GM_setValue(constants.CFG.HOST_ICON_CACHE, nextCache);
  };

  const getCachedHostIcon = (host) => {
    const entry = host ? getHostIconCache()[host] : null;
    return entry && typeof entry === 'object' && entry.dataUrl ? entry.dataUrl : '';
  };

  const blobToDataUrl = (blob, mimeType) =>
    new Promise((resolve, reject) => {
      try {
        const normalizedBlob = mimeType && blob.type !== mimeType ? blob.slice(0, blob.size, mimeType) : blob;
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('favicon_read_failed'));
        reader.readAsDataURL(normalizedBlob);
      } catch (error) {
        reject(error);
      }
    });

  const buildCurrentHostIconSources = () => {
    const sources = [];
    if (typeof document !== 'undefined') {
      document.querySelectorAll('link[rel*="icon"][href]').forEach((element) => {
        try {
          const rawHref = String(element.getAttribute('href') || '').trim();
          if (!rawHref) return;

          if (/^data:/i.test(rawHref)) {
            sources.push({ type: 'inline', value: rawHref });
            return;
          }

          const iconUrl = new URL(rawHref, location.href);
          if (iconUrl.protocol === 'http:' || iconUrl.protocol === 'https:') {
            sources.push({ type: 'request', value: iconUrl.href });
          }
        } catch (_) {
          return;
        }
      });
    }

    sources.push({ type: 'request', value: new URL('/favicon.ico', location.origin).href });

    return [...new Map(sources.filter((source) => source?.value).map((source) => [source.value, source])).values()];
  };

  const requestHostIcon = (url) =>
    new Promise((resolve, reject) => {
      const xhr = GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'blob',
        timeout: 5000,
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        onload: async (response) => {
          if (response.status < 200 || response.status >= 300 || !response.response) {
            reject(new Error(`favicon_http_${response.status || 0}`));
            return;
          }

          try {
            const blob = response.response;
            if (!blob.size) {
              reject(new Error('favicon_empty'));
              return;
            }

            const dataUrl = await blobToDataUrl(blob, blob.type || 'image/x-icon');
            if (!dataUrl) {
              reject(new Error('favicon_empty'));
              return;
            }
            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        },
        ontimeout: () => reject(new Error('favicon_timeout')),
        onerror: () => reject(new Error('favicon_request_failed'))
      });

      if (!xhr) {
        reject(new Error('favicon_request_failed'));
      }
    });

  const core = {
    setUI(nextUi) {
      ui = nextUi;
    },
    syncHostIconCache() {
      syncHostIconCache();
    },
    removeHostIconCache(host) {
      if (!host) return;
      delete getHostIconCache()[host];
      hostIconFetchJobs.delete(host);
      syncHostIconCache();
    },
    async ensureHostIcon(host) {
      if (!host) return '';

      const cachedIcon = getCachedHostIcon(host);
      if (cachedIcon) {
        return cachedIcon;
      }
      if (host !== constants.HOST) {
        return '';
      }
      if (hostIconFetchJobs.has(host)) {
        return hostIconFetchJobs.get(host);
      }

      const job = (async () => {
        try {
          for (const source of buildCurrentHostIconSources()) {
            try {
              const dataUrl =
                source.type === 'inline'
                  ? source.value
                  : await requestHostIcon(source.value);
              getHostIconCache()[host] = { dataUrl };
              syncHostIconCache();
              return dataUrl;
            } catch (_) {
              continue;
            }
          }
          return '';
        } finally {
          hostIconFetchJobs.delete(host);
        }
      })();

      hostIconFetchJobs.set(host, job);
      return job;
    }
  };

  const getUI = () => ui;
  const getCore = () => core;

  Object.assign(
    core,
    createAccountMethods({ constants, utils, getUI, getCore, shared }),
    createEnvironmentMethods({ getUI, shared }),
    createInspectorMethods({ constants, utils }),
    createBackupMethods({ constants, utils, getUI }),
    createWebDavMethods({ constants, utils, getUI, getCore })
  );

  syncHostIconCache();

  return core;
}
