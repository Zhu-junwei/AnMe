# AnMe Browser Extension

[中文](./README_zh.md) | English

AnMe is a browser extension for Chrome, Edge, and Firefox. It saves and restores account snapshots for multiple websites, including Cookies, LocalStorage, and SessionStorage, so you can switch accounts from a compact floating panel.

## Features

- Save and restore Cookies, LocalStorage, and SessionStorage together.
- Manage multiple websites and accounts from one floating panel.
- Search sites and accounts, rename sites, edit saved account data, and reorder records.
- Import and export local JSON backups.
- Optional WebDAV backup and restore.
- Simplified Chinese, English, and Spanish UI.

## Build

```bash
npm install
npm test
npm run build
```

`npm run build` is the extension build. It creates:

- `dist/extension/chromium`: unpacked extension for Chrome and Edge developer mode.
- `dist/extension/firefox`: unpacked extension for Firefox temporary debugging.
- `dist/packages/AnMe-chromium-<version>.zip`: package for Chrome Web Store or Edge Add-ons submission.
- `dist/packages/AnMe-firefox-<version>.xpi`: package for Firefox debugging or AMO submission.

## Install for Development

### Chrome / Edge

1. Open the extensions page.
2. Enable developer mode.
3. Choose `Load unpacked`.
4. Select `dist/extension/chromium`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose `Load Temporary Add-on`.
3. Select `dist/extension/firefox/manifest.json`.

Normal user installation requires store signing: Chrome Web Store for Chrome, Edge Add-ons for Edge, and AMO signing for Firefox.

## Development

- Source entry: `src/main.js`.
- Extension background entry: `src/extension/background.js`.
- Extension build script: `scripts/build-extension.mjs`.
- Tests: `tests/*.test.js`.

Generated `dist/` output is ignored by git.
