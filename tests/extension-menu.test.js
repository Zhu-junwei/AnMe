import assert from 'node:assert/strict';
import test from 'node:test';

import { getMenuOpenTitle, MENU_OPEN_ID, normalizeMenuLanguage } from '../src/extension/menu.js';

test('extension context menu keeps the userscript menu title', () => {
  assert.equal(MENU_OPEN_ID, 'anme-open-manager');
  assert.equal(getMenuOpenTitle('zh'), '🚀 开启账号管理');
});

test('extension context menu title follows supported language fallback', () => {
  assert.equal(getMenuOpenTitle('zh-CN'), '🚀 开启账号管理');
  assert.equal(getMenuOpenTitle('en-US'), '🚀 Open Manager');
  assert.equal(getMenuOpenTitle('es-MX'), '🚀 Abrir gestor de cuentas');
  assert.equal(normalizeMenuLanguage('fr-FR', 'zh'), 'zh');
  assert.equal(getMenuOpenTitle('fr-FR', 'zh'), '🚀 开启账号管理');
});
