export function createAccountMethods({ constants, utils, getUI, getCore, shared }) {
  return {
    async detectAvailableSnapshotSources() {
      const cookies = await shared.listCookies();
      return {
        ck: Array.isArray(cookies) && cookies.length > 0,
        ls: Object.keys(localStorage || {}).length > 0,
        ss: Object.keys(sessionStorage || {}).length > 0
      };
    },
    async saveAccount(name, siteName, options = { ck: true, ls: false, ss: false }) {
      const ui = getUI();
      const snapshot = {
        time: Date.now(),
        siteName: utils.normalizeSiteName(siteName),
        localStorage: options.ls ? { ...localStorage } : {},
        sessionStorage: options.ss ? { ...sessionStorage } : {},
        cookies: []
      };

      if (options.ck) {
        snapshot.cookies = await shared.listCookies();
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
      const data = GM_getValue(oldKey);
      GM_deleteValue(oldKey);
      GM_setValue(utils.makeKey(newName, host), data);

      const orderKey = constants.ORDER_PREFIX + host;
      const order = GM_getValue(orderKey, []);
      const idx = order.indexOf(utils.extractName(oldKey));
      if (idx !== -1) {
        order[idx] = newName;
        GM_setValue(orderKey, order);
      }
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
