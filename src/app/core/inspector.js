const normalizeStorageRows = (rows) => Object.fromEntries((rows || []).filter(([key]) => key));
const getCookieSelectionKey = (cookie) =>
  [cookie?.name || '', cookie?.domain || '', cookie?.path || ''].join('\u0001');

const normalizeForCompare = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(normalizeForCompare)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeForCompare(value[key])])
    );
  }
  return value;
};

const isSameData = (left, right) =>
  JSON.stringify(normalizeForCompare(left)) === JSON.stringify(normalizeForCompare(right));

const getSelectedKeys = (type, content) => {
  if (type === 'cookies') {
    return (Array.isArray(content) ? content : []).map(getCookieSelectionKey);
  }
  return Object.keys(content || {});
};

const hasContent = (type, content) =>
  type === 'cookies'
    ? (Array.isArray(content) ? content.length : 0) > 0
    : Object.keys(content || {}).length > 0;

const getContentByType = (data, type) => {
  if (type === 'cookies') return data.cookies;
  if (type === 'localStorage') return data.localStorage;
  if (type === 'sessionStorage') return data.sessionStorage;
  return null;
};

export function createInspectorMethods({ utils, getUI }) {
  return {
    async inspectData(key, type) {
      const data = GM_getValue(key);
      if (!data) return;

      const content = getContentByType(data, type);
      if (!content) return;
      const typeTitles = {
        cookies: 'Cookie',
        localStorage: 'LocalStorage',
        sessionStorage: 'SessionStorage'
      };
      const tabs = ['cookies', 'localStorage', 'sessionStorage']
        .map((tabType) => ({
          type: tabType,
          title: typeTitles[tabType],
          data: getContentByType(data, tabType)
        }))
        .filter((tab) => hasContent(tab.type, tab.data))
        .map((tab) => ({
          ...tab,
          selectedKeys: getSelectedKeys(tab.type, tab.data)
        }));
      if (tabs.length === 0) return;

      const ui = getUI();
      const result = await ui?.showDataInspectorTabs({
        tabs,
        initialType: type,
        selectable: true,
        editable: true,
        addable: true,
        submitText: utils.t('save_changes'),
        confirmDisabledUntilDirty: true,
        host: utils.extractHost?.(key)
      });
      if (!result) return;

      const nextValues = {};
      Object.entries(result.tabs || {}).forEach(([tabType, tabResult]) => {
        nextValues[tabType] = tabType === 'cookies' ? tabResult.data : normalizeStorageRows(tabResult.rows);
      });
      const hasChanges = Object.entries(nextValues).some(([tabType, nextContent]) =>
        !isSameData(getContentByType(data, tabType), nextContent)
      );
      if (!hasChanges) return;

      const confirmed = await ui?.confirm?.(utils.t('confirm_save_changes'));
      if (!confirmed) return;

      const nextData = GM_getValue(key);
      if (!nextData) return;

      GM_setValue(key, {
        ...nextData,
        time: Date.now(),
        ...nextValues
      });
      ui?.refresh?.();
      ui?.showToast?.(utils.t('toast_account_updated'));
    }
  };
}
