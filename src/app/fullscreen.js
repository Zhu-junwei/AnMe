const YOUTUBE_HOST_RE = /(^|\.)youtube\.com$/i;
const YOUTUBE_FULLSCREEN_SELECTORS = [
  '#movie_player.ytp-fullscreen',
  '.html5-video-player.ytp-fullscreen',
  'ytd-watch-flexy[fullscreen]',
  'ytd-player[fullscreen]',
  'ytd-reel-video-renderer[fullscreen]'
];

function safeQuerySelector(doc, selector) {
  if (!doc || typeof doc.querySelector !== 'function') {
    return null;
  }

  try {
    return doc.querySelector(selector);
  } catch (_) {
    return null;
  }
}

export function isFullscreenPlaybackActive({
  doc = typeof document !== 'undefined' ? document : null,
  host = typeof location !== 'undefined' ? location.hostname : ''
} = {}) {
  if (!doc) {
    return false;
  }

  const fullscreenElement =
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement;

  if (fullscreenElement) {
    return true;
  }

  if (YOUTUBE_HOST_RE.test(host)) {
    return YOUTUBE_FULLSCREEN_SELECTORS.some((selector) => Boolean(safeQuerySelector(doc, selector)));
  }

  return false;
}
