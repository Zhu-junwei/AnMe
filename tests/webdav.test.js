import assert from 'node:assert/strict';
import test from 'node:test';

import { formatLocalTimestampForFileName } from '../src/app/core/webdav.js';

test('formatLocalTimestampForFileName uses local date parts without a UTC suffix', () => {
  const value = formatLocalTimestampForFileName(new Date(2026, 3, 15, 10, 26, 45, 465));

  assert.equal(value, '2026-04-15T10-26-45-465');
  assert.equal(value.endsWith('Z'), false);
});
