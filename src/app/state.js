export function createState({ constants, i18nData }) {
  const navLang = navigator.language.split('-')[0];
  let currentLang = GM_getValue(constants.CFG.LANG, i18nData[navLang] ? navLang : 'en');
  const storedHostIconCache = GM_getValue(constants.CFG.HOST_ICON_CACHE, {});

  if (!i18nData[currentLang]) {
    currentLang = 'en';
  }

  const hostIconCache =
    storedHostIconCache && typeof storedHostIconCache === 'object' && !Array.isArray(storedHostIconCache)
      ? storedHostIconCache
      : {};

  return {
    currentLang,
    currentViewingHost: constants.HOST,
    hostDisplayMode: GM_getValue(constants.CFG.HOST_DISPLAY_MODE, 'siteName'),
    hostIconCache,
    hostEditingHost: null,
    hostEditingValue: '',
    isForcedShow: false,
    activePage: 'pg-switch',
    settingsReturnPage: 'pg-switch',
    accountSettingsKey: null,
    accountSettingsReturnPage: 'pg-switch',
    accountSettingsHost: constants.HOST,
    hostSearchQuery: '',
    accountSearchQuery: '',
    accountSearchActive: false,
    webdavBackups: [],
    uiRoot: null,
    fab: null,
    panel: null,
    dialogMask: null,
    saveFormMask: null,
    noteTooltipEl: null,
    noteTooltipTarget: null,
    noteTooltipItem: null,
    toastEl: null,
    toastTimer: null
  };
}
