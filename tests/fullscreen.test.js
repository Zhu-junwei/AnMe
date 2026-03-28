import assert from 'node:assert/strict';
import test from 'node:test';

import { isFullscreenPlaybackActive } from '../src/app/fullscreen.js';

test('returns true when the document has a native fullscreen element', () => {
  const doc = {
    fullscreenElement: { tagName: 'VIDEO' }
  };

  assert.equal(isFullscreenPlaybackActive({ doc, host: 'www.youtube.com' }), true);
});

test('detects YouTube fullscreen-like player state without native fullscreen element', () => {
  const selectors = new Set(['#movie_player.ytp-fullscreen']);
  const doc = {
    fullscreenElement: null,
    querySelector(selector) {
      return selectors.has(selector) ? { selector } : null;
    }
  };

  assert.equal(isFullscreenPlaybackActive({ doc, host: 'www.youtube.com' }), true);
});

test('ignores YouTube-specific selectors on non-YouTube hosts', () => {
  const doc = {
    fullscreenElement: null,
    querySelector() {
      return { selector: '#movie_player.ytp-fullscreen' };
    }
  };

  assert.equal(isFullscreenPlaybackActive({ doc, host: 'www.example.com' }), false);
});
