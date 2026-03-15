export function createUtils({ state, constants, i18nData }) {
  return {
    normalizeText(value) {
      return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
    },
    t(key) {
      return i18nData[state.currentLang][key] || key;
    },
    isWebDavTimeoutError(error) {
      const message = String(error?.message || error || '').trim();
      return message === this.t('webdav_timeout');
    },
    isWebDavRequestError(error) {
      const message = String(error?.message || error || '').trim();
      return /^(GET|PUT|POST|DELETE|PROPFIND|MKCOL|HEAD|OPTIONS|PATCH)\s+/i.test(message);
    },
    getWebDavErrorMessage(error, fallbackKey = '') {
      const message = String(error?.message || error || '').trim();
      if (this.isWebDavTimeoutError(error) || this.isWebDavRequestError(error)) {
        return this.t('webdav_timeout_check_settings');
      }
      return message || (fallbackKey ? this.t(fallbackKey) : '');
    },
    escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    extractName(key) {
      return key.split('::')[1] || key;
    },
    makeKey(name, host = constants.HOST) {
      return `${constants.PREFIX}${host}::${name}`;
    },
    listAllHosts() {
      return [
        ...new Set(
          GM_listValues()
            .filter((value) => value.startsWith(constants.PREFIX))
            .map((value) => value.split('::')[0].replace(constants.PREFIX, ''))
        )
      ];
    },
    getSortedKeysByHost(host) {
      const allKeys = GM_listValues().filter((key) => key.startsWith(`${constants.PREFIX}${host}::`));
      const savedOrder = GM_getValue(constants.ORDER_PREFIX + host, []);

      return allKeys.sort((a, b) => {
        const nameA = this.extractName(a);
        const nameB = this.extractName(b);
        let idxA = savedOrder.indexOf(nameA);
        let idxB = savedOrder.indexOf(nameB);

        if (idxA === -1) idxA = 9999;
        if (idxB === -1) idxB = 9999;
        if (idxA !== idxB) return idxA - idxB;

        const dataA = GM_getValue(a);
        const dataB = GM_getValue(b);
        return new Date(dataB.time || 0) - new Date(dataA.time || 0);
      });
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleString();
      }
      const parsed = new Date(timestamp);
      return Number.isNaN(parsed.getTime()) ? String(timestamp) : parsed.toLocaleString();
    },
    formatBytes(size) {
      const bytes = Number(size) || 0;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
    normalizeSiteName(siteName, host = constants.HOST) {
      return this.normalizeText(siteName) || host;
    },
    getPageTitle() {
      return typeof document !== 'undefined' ? document.title : '';
    },
    findStoredSiteName(host) {
      const savedSiteName = this.normalizeText(GM_getValue(constants.SITE_NAME_PREFIX + host, ''));
      if (savedSiteName) {
        return savedSiteName;
      }

      const keys = this.getSortedKeysByHost(host);
      for (const key of keys) {
        const siteName = this.normalizeText(GM_getValue(key)?.siteName);
        if (siteName) {
          return siteName;
        }
      }

      return '';
    },
    getSiteNameByHost(host, fallbackTitle = '') {
      const storedSiteName = this.findStoredSiteName(host);
      if (storedSiteName) {
        return storedSiteName;
      }

      return host;
    },
    getHostDisplayName(host, mode = state.hostDisplayMode || 'siteName') {
      return mode === 'domain' ? host : this.getSiteNameByHost(host);
    },
    getCachedHostIcon(host) {
      const cacheEntry = state.hostIconCache?.[host];
      if (!cacheEntry || typeof cacheEntry !== 'object') return '';
      return typeof cacheEntry.dataUrl === 'string' ? cacheEntry.dataUrl : '';
    },
    getHostIconFallbackText(host, label = '') {
      const normalized = this.normalizeText(label || host).replace(/^www\./i, '');
      const firstChar = Array.from(normalized).find((char) => /[A-Za-z0-9\u4E00-\u9FFF]/.test(char));
      return (firstChar || '#').toUpperCase();
    },
    suggestSiteName(pageTitle = this.getPageTitle(), host = constants.HOST) {
      const storedSiteName = this.findStoredSiteName(host);
      if (storedSiteName) {
        return storedSiteName;
      }

      return this.normalizeSiteName(pageTitle, host);
    },
    suggestAccountName(host = constants.HOST) {
      const existingNames = this.getSortedKeysByHost(host).map((key) => this.extractName(key));
      const translatedPrefix = this.t('default_account_prefix');
      const fallbackPrefixes = {
        zh: '账号',
        en: 'Account',
        es: 'Cuenta'
      };
      const prefix =
        this.normalizeText(
          translatedPrefix && translatedPrefix !== 'default_account_prefix'
            ? translatedPrefix
            : fallbackPrefixes[state.currentLang]
        ) || 'Account';
      let index = existingNames.length + 1;
      let candidate = '';
      do {
        candidate = `${prefix}-${String(index).padStart(2, '0')}`;
        index += 1;
      } while (existingNames.includes(candidate));

      return candidate;
    }
  };
}
