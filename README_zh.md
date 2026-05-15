# AnMe

中文 | [English](./README.md)

AnMe 是一个通用的多网站多账号切换器。它可以保存和恢复网站登录快照，包括 Cookies、LocalStorage、SessionStorage，让你通过紧凑的悬浮面板切换账号。

AnMe 提供两种形态：

- 面向 Firefox、Edge、Chrome 和其他 Chromium 系浏览器的浏览器插件。
- 面向 Tampermonkey 和 ScriptCat 的 userscript 脚本。

## 下载地址

### Userscript 脚本

| 平台 | 下载地址 | 说明 |
| :-- | :-- | :-- |
| Greasy Fork | [从 Greasy Fork 安装](https://greasyfork.org/zh-CN/scripts/563142) | 推荐的 Tampermonkey 安装来源。 |
| ScriptCat | [从 ScriptCat 安装](https://scriptcat.org/zh-CN/script-show-page/5275) | 推荐的 ScriptCat 安装来源。 |
| jsDelivr | [AnMe.user.js](https://cdn.jsdelivr.net/gh/Zhu-junwei/AnMe/AnMe.user.js) | 直接脚本文件。 |

### 浏览器插件

| 浏览器 | 下载地址 | 说明 |
| :-- | :-- | :-- |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/anme/) | 已可安装。 |
| Edge | 审核中 | Edge Add-ons 商店仍在审核。 |
| Chrome | 自行构建 | 作者未完成 Chrome Web Store 认证费用，Chrome 用户需要自行构建并加载插件。 |

## 构建浏览器插件

在 browser-extension 分支上：

```bash
npm install
npm test
npm run build
```

扩展构建会生成：

- `dist/extension/chromium`：Chrome 和 Edge 开发者模式加载目录。
- `dist/extension/firefox`：Firefox 临时调试加载目录。
- `dist/packages/AnMe-chromium-<version>.zip`：Chromium 插件包。
- `dist/packages/AnMe-firefox-<version>.xpi`：Firefox 插件包。

## 手动加载浏览器插件

Chrome / Edge：

1. 打开扩展管理页面。
2. 开启开发者模式。
3. 选择 `Load unpacked` / 加载已解压的扩展程序。
4. 选择 `dist/extension/chromium`。

Firefox：

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 选择 `Load Temporary Add-on` / 临时载入附加组件。
3. 选择 `dist/extension/firefox/manifest.json`。

## Userscript 脚本设置

安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [ScriptCat](https://scriptcat.org)，然后从 [Greasy Fork](https://greasyfork.org/zh-CN/scripts/563142)、[ScriptCat](https://scriptcat.org/zh-CN/script-show-page/5275) 或 [jsDelivr 脚本文件](https://cdn.jsdelivr.net/gh/Zhu-junwei/AnMe/AnMe.user.js) 安装 AnMe。

Tampermonkey 需要开启 Cookie 访问：

1. 打开 Tampermonkey 管理面板。
2. 进入 `Settings`。
3. 将 `Config mode` 改为 `Advanced`。
4. 在 `Security` 中把 `Allow scripts to access cookies` 设为 `ALL`。
5. 保存设置。

ScriptCat 会在需要时请求权限，不需要额外设置。

## 功能

- 一键恢复快照，快速切换账号。
- 同时保存 Cookies、LocalStorage、SessionStorage。
- 在一个悬浮面板中管理多个网站和多个账号。
- 支持站点搜索、账号搜索、站点改名、已保存账号数据编辑和排序。
- 支持本地 JSON 备份导入导出。
- 支持可选 WebDAV 备份与恢复。
- 支持简体中文、英文、西班牙语界面。

## 基本用法

### 保存账号

1. 登录你要保存的网站。
2. 打开悬浮面板。
3. 点击保存按钮。
4. 确认站点名称和账号名称。
5. 选择要保存的数据类型。
6. 保存快照。

### 切换账号

1. 在目标网站打开面板。
2. 选择一个账号卡片。
3. AnMe 会清理当前环境，恢复所选快照，然后重新加载页面。

你可以直接从账号卡片标签查看已保存的 `CK`、`LS`、`SS` 数据。

## 备份与恢复

- 将当前站点或全部保存数据导出为 JSON。
- 在其他浏览器或设备中导入 JSON 备份。
- 配置可选 WebDAV 备份与恢复。
- 在内置备份页面恢复或删除 WebDAV 备份。

## 隐私与安全

- 账号数据默认存储在本地。
- AnMe 不会上传任何数据，除非你明确配置并使用 WebDAV 同步。
- 快照是否有效仍取决于各网站自己的会话策略。
- 不要在公共或不可信设备上保存敏感账号。

## 开发说明

源码入口：`src/main.js`

可用命令：

```bash
npm test
npm run build
```

构建产物取决于所在分支：

- Userscript 分支生成 `AnMe.user.js`。
- 浏览器插件分支生成 `dist/extension/*` 和 `dist/packages/*`。

生成的扩展 `dist/` 目录不会提交到 git。

## 支持

如果这个项目对你有帮助，欢迎给它一个 star，或支持作者。

| 微信支付 | 支付宝 |
| :--: | :--: |
| ![](https://cdn.jsdelivr.net/gh/Zhu-junwei/media-library@master/imgs/qrcode/wechatpay.png) | ![](https://cdn.jsdelivr.net/gh/Zhu-junwei/media-library@master/imgs/qrcode/alipay.png) |
