# AGENTS.md

给后续编码代理看的项目协作说明。这个分支只做浏览器扩展，不再维护 userscript 发布产物。

## 项目概况

AnMe 是一个面向 Chrome、Edge、Firefox 的多网站多账号切换浏览器扩展。它保存 Cookie、LocalStorage、SessionStorage 快照，通过扩展存储和后台脚本管理数据、Cookie、WebDAV 请求。

源码入口是 `src/main.js`。扩展后台入口是 `src/extension/background.js`。最终开发加载目录和提交包由 `npm run build` / `npm run build:extension` 生成到 `dist/`。

## 常用命令

- `npm test`：运行 Node 测试。
- `npm run build`：构建浏览器扩展。
- `npm run build:extension`：同上，显式扩展构建命令。

改行为逻辑后要跑测试。改扩展入口、manifest、后台脚本或打包逻辑后，要跑 `npm run build`，确认 `dist/extension/chromium`、`dist/extension/firefox`、`dist/packages` 都能生成。

## 目录和文件职责

- `src/main.js`：content script 入口。
- `src/extension/background.js`：扩展后台脚本，处理 cookies、跨域请求、扩展图标打开面板。
- `src/app/runtime.js`：WebExtension 运行时兼容层，把 storage/cookies/http 映射成现有业务可调用的 API。
- `src/app/config.js`：常量、图标、i18n 文案、注入 CSS。
- `src/app/templates.js`：面板和页面 HTML 模板。
- `src/app/ui.js`：组合 UI 方法。
- `src/app/ui/feedback.js`：弹窗、数据检查器、CK/LS/SS 表格、WebDAV 配置弹窗。
- `src/app/ui/events.js`：DOM 事件绑定。
- `src/app/ui/panel.js`：面板导航和页面切换。
- `src/app/ui/webdav.js`：WebDAV 状态和备份列表 UI。
- `src/app/core.js`：组合核心方法。
- `src/app/core/accounts.js`：账号保存、切换、管理逻辑。
- `src/app/core/inspector.js`：账号数据检查、编辑、保存流程。
- `src/app/core/webdav.js`：WebDAV 验证、备份、恢复、缓存和超时处理。
- `src/app/utils.js`：通用工具，包括 host 提取和 Cookie 过期判断。
- `scripts/build-extension.mjs`：扩展 manifest、content script、background、zip/xpi 的构建脚本。
- `tests/*.test.js`：账号、检查器、WebDAV、工具函数、全屏等测试。

## 修改原则

- 这个分支不要重新引入 `AnMe.user.js`、userscript 头部元数据、Greasy Fork 发布链或油猴安装说明。
- 优先改 `src/` 下的源码和 `scripts/build-extension.mjs`；`dist/` 是生成物，不提交。
- 改用户可见文案时，尽量同步更新 `src/app/config.js` 里多语言文案。
- 改动范围要小，沿用当前 UI / core 组合方式，不要无故大重构。
- 小心账号 key、host/domain、WebDAV 密钥、导入导出格式等已有数据语义。
- 提交前先看 `git status --short --branch`。不要回滚无关本次任务的本地改动。

## 产品和 UI 约定

- 这是一个紧凑的账号管理面板，不是落地页。界面要密集、直接、实用。
- 紧凑操作优先用已有的 `constants.ICONS` 图标按钮。
- 保存弹窗和数据检查器要共用同一套 CK / LS / SS 来源选择状态；外层来源勾选和检查器里的行选择必须保持一致。
- 半选状态要用真实的 checkbox `indeterminate`，不要只做视觉假状态。
- 保存弹窗里的眼睛/隐私图标如果存在，要放在 `SS` 后面，并且更贴近 `SS`。
- 检查器保存按钮必须等有真实修改后才可用。现有开关是从 `src/app/core/inspector.js` 传入 `showDataInspectorTabs()` 的 `confirmDisabledUntilDirty: true`。
- 编辑某个已管理网站的数据并新增 Cookie 时，`domain` 默认用被管理网站的 host，也就是 `utils.extractHost(key)`，不要用当前页面的 `location.hostname`。
- CK / LS / SS 表头排序要用可点击表头，不显示 `asc` / `desc` 文字，只保留紧凑的视觉箭头。
- 过期 Cookie 使用 `.is-expired`；过期行样式要压过斑马纹，让过期行保持一致突出。
- WebDAV 保持“顶部按钮进入 WebDAV”的现有流程。之前拆到设置里的方案已经回滚，不要重新引入，除非用户明确再次要求。

## 扩展构建和安装验证

1. 用 `git status --short --branch`、`git diff --stat`、`git diff --name-status` 先确认改动范围。
2. 跑 `npm test`。
3. 跑 `npm run build`。
4. 检查生成产物：
   - `dist/extension/chromium`
   - `dist/extension/firefox`
   - `dist/packages/AnMe-chromium-<version>.zip`
   - `dist/packages/AnMe-firefox-<version>.xpi`
5. Chrome / Edge 用开发者模式加载 `dist/extension/chromium`。
6. Firefox 用 `about:debugging#/runtime/this-firefox` 临时加载 `dist/extension/firefox/manifest.json`。

普通用户安装需要商店签名：Chrome Web Store、Edge Add-ons、Firefox AMO。

## 测试提示

- 检查器选择和“有真实修改才允许保存”的行为主要看 `tests/inspector.test.js`。
- WebDAV 时间戳、配置和相关工具逻辑主要看 `tests/webdav.test.js` 以及 utils 相关测试。
- 扩展 manifest 和打包逻辑主要看 `scripts/build-extension.mjs`，变更后至少跑 `npm run build`。

改共享行为、序列化格式、WebDAV 逻辑、账号数据编辑流程时，要补或更新聚焦测试。
