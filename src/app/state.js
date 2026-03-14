export function createState({ constants, i18nData }) {
  const navLang = navigator.language.split('-')[0];
  let currentLang = GM_getValue(constants.CFG.LANG, i18nData[navLang] ? navLang : 'en');

  if (!i18nData[currentLang]) {
    currentLang = 'en';
  }

  return {
    currentLang,
    currentViewingHost: constants.HOST,
    hostDisplayMode: GM_getValue(constants.CFG.HOST_DISPLAY_MODE, 'siteName'),
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
    toastEl: null,
    toastTimer: null
  };
}
