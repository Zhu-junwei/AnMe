# AnMe Browser Extension

中文 | [English](./README.md)

AnMe 是一个面向 Chrome、Edge、Firefox 的浏览器扩展。它可以保存和恢复多个网站的账号快照，包括 Cookie、LocalStorage、SessionStorage，让你通过紧凑的悬浮面板快速切换账号。

## 功能

- 同时保存和恢复 Cookie、LocalStorage、SessionStorage。
- 在同一个悬浮面板里管理多个网站和多个账号。
- 支持站点搜索、账号搜索、站点改名、已保存数据编辑、账号排序。
- 支持本地 JSON 导入导出。
- 支持可选的 WebDAV 备份与恢复。
- 支持简体中文、英文、西班牙语界面。

## 构建

```bash
npm install
npm test
npm run build
```

`npm run build` 就是浏览器扩展构建，会生成：

- `dist/extension/chromium`：Chrome / Edge 开发者模式加载目录。
- `dist/extension/firefox`：Firefox 临时调试加载目录。
- `dist/packages/AnMe-chromium-<version>.zip`：提交 Chrome Web Store 或 Edge Add-ons 的压缩包。
- `dist/packages/AnMe-firefox-<version>.xpi`：Firefox 调试或提交 AMO 的 XPI 包。

## 开发安装

### Chrome / Edge

1. 打开扩展管理页面。
2. 开启开发者模式。
3. 选择“加载已解压的扩展程序”。
4. 选择 `dist/extension/chromium`。

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 选择“临时载入附加组件”。
3. 选择 `dist/extension/firefox/manifest.json`。

普通用户安装需要浏览器商店签名：Chrome 对应 Chrome Web Store，Edge 对应 Edge Add-ons，Firefox 对应 AMO。

## 开发说明

- 源码入口：`src/main.js`。
- 扩展后台入口：`src/extension/background.js`。
- 扩展构建脚本：`scripts/build-extension.mjs`。
- 测试文件：`tests/*.test.js`。

生成的 `dist/` 目录不会提交到 git。
