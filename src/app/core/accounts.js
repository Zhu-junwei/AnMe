const getCookieSelectionKey = (cookie) =>
  [cookie?.name || '', cookie?.domain || '', cookie?.path || ''].join('\u0001');

export function createAccountMethods({ constants, utils, getUI, getCore, shared }) {
  return {
    async getCurrentSnapshotSources() {
      const cookies = await shared.listCookies();
      return {
        cookies: Array.isArray(cookies) ? cookies : [],
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage }
      };
    },
    async detectAvailableSnapshotSources() {
      const snapshotSources = await this.getCurrentSnapshotSources();
      return {
        ck: snapshotSources.cookies.length > 0,
        ls: Object.keys(snapshotSources.localStorage).length > 0,
        ss: Object.keys(snapshotSources.sessionStorage).length > 0
      };
    },
    async saveAccount(name, siteName, options = { ck: true, ls: false, ss: false, note: '' }) {
      const ui = getUI();
      const localStorageKeys = Array.isArray(options.localStorageKeys) ? new Set(options.localStorageKeys) : null;
      const sessionStorageKeys = Array.isArray(options.sessionStorageKeys) ? new Set(options.sessionStorageKeys) : null;
      const snapshot = {
        time: Date.now(),
        siteName: utils.normalizeSiteName(siteName),
        note: utils.normalizeNoteText(options.note),
        localStorage: options.ls
          ? Object.fromEntries(
              Object.entries(localStorage).filter(([storageKey]) => !localStorageKeys || localStorageKeys.has(storageKey))
            )
          : {},
        sessionStorage: options.ss
          ? Object.fromEntries(
              Object.entries(sessionStorage).filter(([storageKey]) => !sessionStorageKeys || sessionStorageKeys.has(storageKey))
            )
          : {},
        cookies: []
      };

      if (options.ck) {
        const cookieKeys = Array.isArray(options.cookieKeys) ? new Set(options.cookieKeys) : null;
        const cookies = await shared.listCookies();
        snapshot.cookies = cookieKeys
          ? (cookies || []).filter((cookie) => cookieKeys.has(getCookieSelectionKey(cookie)))
          : cookies;
      }

      const hasCookies = snapshot.cookies && snapshot.cookies.length > 0;
      const hasLS = Object.keys(snapshot.localStorage).length > 0;
      const hasSS = Object.keys(snapshot.sessionStorage).length > 0;

      if (!hasCookies && !hasLS && !hasSS) {
        await ui.alert(utils.t('save_empty_err'));
        return false;
      }

      GM_setValue(utils.makeKey(name), snapshot);
      this.updateSiteName(constants.HOST, snapshot.siteName);
      const currentOrder = GM_getValue(constants.ORDER_PREFIX + constants.HOST, []);
      if (!currentOrder.includes(name)) {
        currentOrder.push(name);
        GM_setValue(constants.ORDER_PREFIX + constants.HOST, currentOrder);
      }

      getCore()?.syncHostIconCache?.();

      return true;
    },
    renameAccount(oldKey, newName, host) {
      return this.updateAccount(oldKey, { name: newName }, host);
    },
    updateAccount(oldKey, nextValues, host) {
      const data = GM_getValue(oldKey);
      if (!data) return oldKey;

      const nextName = utils.normalizeText(nextValues?.name || utils.extractName(oldKey));
      const nextKey = utils.makeKey(nextName, host);
      const nextData = {
        ...data,
        note: utils.normalizeNoteText(nextValues?.note ?? data.note)
      };

      if (nextKey !== oldKey) {
        GM_deleteValue(oldKey);
      }
      GM_setValue(nextKey, nextData);

      const orderKey = constants.ORDER_PREFIX + host;
      if (nextKey !== oldKey) {
        const order = GM_getValue(orderKey, []);
        const idx = order.indexOf(utils.extractName(oldKey));
        if (idx !== -1) {
          order[idx] = nextName;
          GM_setValue(orderKey, order);
        }
      }

      return nextKey;
    },
    updateSiteName(host, siteName) {
      const normalizedSiteName = utils.normalizeSiteName(siteName, host);
      GM_setValue(constants.SITE_NAME_PREFIX + host, normalizedSiteName);
      utils.getSortedKeysByHost(host).forEach((key) => {
        const data = GM_getValue(key);
        if (!data) return;

        GM_setValue(key, {
          ...data,
          siteName: normalizedSiteName
        });
      });
    },
    deleteAccount(key, host) {
      GM_deleteValue(key);
      const orderKey = constants.ORDER_PREFIX + host;
      const name = utils.extractName(key);
      const order = GM_getValue(orderKey, []);
      const newOrder = order.filter((item) => item !== name);
      if (newOrder.length === 0) {
        GM_deleteValue(orderKey);
        getCore()?.removeHostIconCache?.(host);
      } else {
        GM_setValue(orderKey, newOrder);
      }
    },
    updateOrder(host, nameList) {
      GM_setValue(constants.ORDER_PREFIX + host, nameList);
    }
  };
}
