import assert from 'node:assert/strict';
import test from 'node:test';

import { extractUserscriptMetadataValue, resolveScriptUpdatedAt } from '../src/app/meta.js';

test('extractUserscriptMetadataValue reads custom userscript metadata fields', () => {
  const meta = `// ==UserScript==
// @name         AnMe
// @updated      2026-04-27
// ==/UserScript==`;

  assert.equal(extractUserscriptMetadataValue(meta, 'updated'), '2026-04-27');
});

test('resolveScriptUpdatedAt falls back to an empty string when the metadata is missing', () => {
  assert.equal(resolveScriptUpdatedAt({ scriptMetaStr: '', script: {} }), '');
});
