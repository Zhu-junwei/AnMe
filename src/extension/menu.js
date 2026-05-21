export const MENU_OPEN_ID = 'anme-open-manager';
export const MENU_LANGUAGE_STORAGE_KEY = 'cfg_lang';

export const MENU_OPEN_TITLES = {
  zh: '🚀 开启账号管理',
  en: '🚀 Open Manager',
  es: '🚀 Abrir gestor de cuentas'
};

export function normalizeMenuLanguage(language, fallbackLanguage = 'en') {
  const code = String(language || '').toLowerCase().split(/[-_]/)[0];
  if (Object.prototype.hasOwnProperty.call(MENU_OPEN_TITLES, code)) return code;
  if (Object.prototype.hasOwnProperty.call(MENU_OPEN_TITLES, fallbackLanguage)) return fallbackLanguage;
  return 'en';
}

export function getMenuOpenTitle(language, fallbackLanguage = 'en') {
  return MENU_OPEN_TITLES[normalizeMenuLanguage(language, fallbackLanguage)];
}
