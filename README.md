# AnMe

[中文](./README_zh.md) | English

AnMe is a universal multi-site, multi-account switcher. It saves and restores login snapshots for websites, including Cookies, LocalStorage, and SessionStorage, so you can switch accounts from a compact floating panel.

AnMe is available in two forms:

- Browser extension for Firefox, Edge, Chrome, and other Chromium-based browsers.
- Userscript for Tampermonkey and ScriptCat.

## Browser Extension

- Firefox: [Install from Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/anme/).
- Edge: the Edge Add-ons listing is under review.
- Chrome: the author has not completed the Chrome Web Store verification fee, so Chrome users need to build and load the extension manually.

### Build the Extension

On the browser-extension branch:

```bash
npm install
npm test
npm run build
```

The extension build creates:

- `dist/extension/chromium`: unpacked extension for Chrome and Edge developer mode.
- `dist/extension/firefox`: unpacked extension for Firefox temporary debugging.
- `dist/packages/AnMe-chromium-<version>.zip`: Chromium package.
- `dist/packages/AnMe-firefox-<version>.xpi`: Firefox package.

### Load the Extension Manually

Chrome / Edge:

1. Open the extensions page.
2. Enable developer mode.
3. Choose `Load unpacked`.
4. Select `dist/extension/chromium`.

Firefox:

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose `Load Temporary Add-on`.
3. Select `dist/extension/firefox/manifest.json`.

## Userscript

Install [Tampermonkey](https://www.tampermonkey.net/) or [ScriptCat](https://scriptcat.org), then install AnMe from [Greasy Fork](https://greasyfork.org/scripts/563142-anme) or build this repository and install the generated `AnMe.user.js`.

For Tampermonkey, enable Cookie access:

1. Open the Tampermonkey dashboard.
2. Go to `Settings`.
3. Change `Config mode` to `Advanced`.
4. In `Security`, set `Allow scripts to access cookies` to `ALL`.
5. Save the settings.

ScriptCat asks for permission when needed and does not require this extra setting.

## Features

- Fast account switching with one-click snapshot restore.
- Save Cookies, LocalStorage, and SessionStorage together.
- Manage multiple websites and accounts from one floating panel.
- Search sites and accounts, rename sites, edit saved account data, and reorder records.
- Import and export local JSON backups.
- Optional WebDAV backup and restore.
- Simplified Chinese, English, and Spanish UI.

## Basic Usage

### Save an Account

1. Log in to the website you want to save.
2. Open the floating panel.
3. Click the save button.
4. Confirm the site name and account name.
5. Choose which data types to store.
6. Save the snapshot.

### Switch an Account

1. Open the panel on the target site.
2. Pick an account card.
3. AnMe clears the current environment, restores the selected snapshot, and reloads the page.

You can inspect stored `CK`, `LS`, and `SS` data directly from the account card tags.

## Backup and Restore

- Export the current site or all saved data as JSON.
- Import a JSON backup on another browser or machine.
- Configure optional WebDAV backup and restore.
- Restore or delete WebDAV backups from the built-in backup page.

## Privacy and Security

- Account data is stored locally by default.
- AnMe does not upload anything unless you explicitly configure and use WebDAV sync.
- Snapshot validity still depends on each website's own session policy.
- Do not store sensitive accounts on public or untrusted devices.

## Development

Source entry: `src/main.js`

Available commands:

```bash
npm test
npm run build
```

Build output depends on the branch:

- Userscript branches generate `AnMe.user.js`.
- Browser-extension branches generate `dist/extension/*` and `dist/packages/*`.

Generated extension `dist/` output is ignored by git.

## Support

If this project is useful to you, give it a star or support the author.

| WeChat Pay | Alipay |
| :--: | :--: |
| ![](https://cdn.jsdelivr.net/gh/Zhu-junwei/media-library@master/imgs/qrcode/wechatpay.png) | ![](https://cdn.jsdelivr.net/gh/Zhu-junwei/media-library@master/imgs/qrcode/alipay.png) |
