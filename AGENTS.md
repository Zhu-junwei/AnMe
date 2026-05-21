# AGENTS.md

给后续编码代理看的项目协作说明。

## 项目概况

AnMe 是一个同时面向浏览器扩展和 userscript 的多网站多账号切换工具。扩展形态支持 Chrome、Edge、Firefox，脚本形态面向用户脚本管理器。它保存 Cookie、LocalStorage、SessionStorage 快照，并在不同运行环境下管理数据、Cookie、WebDAV 请求。

共享业务入口是 `src/main.js`。扩展后台入口是 `src/extension/background.js`。userscript 产物由 `npm run build:userscript` 生成到 `AnMe.user.js`。扩展开发加载目录和提交包由 `npm run build:extension` 生成到 `dist/`。全量构建用 `npm run build` 或 `npm run build:all`。

## 常用命令

- `npm test`：运行 Node 测试。
- `npm run build`：全量构建 userscript 和浏览器扩展。
- `npm run build:all`：同上，显式全量构建命令。
- `npm run build:userscript`：只构建 userscript，输出 `AnMe.user.js`。
- `npm run build:extension`：只构建浏览器扩展，输出 `dist/extension` 和 `dist/packages`。

改行为逻辑后要跑测试。改扩展入口、manifest、后台脚本或打包逻辑后，要跑 `npm run build:extension`，确认 `dist/extension/chromium`、`dist/extension/firefox`、`dist/packages` 都能生成。改脚本入口、userscript 头部元数据或脚本发布链路时，要跑 `npm run build:userscript`，确认 `AnMe.user.js` 能生成。改共享逻辑时优先跑 `npm run build` 做全量验证。

## 目录和文件职责

- `src/main.js`：共享业务入口，供扩展 content script 和脚本形态复用。
- `src/extension/background.js`：扩展后台脚本，处理 cookies、跨域请求、扩展图标打开面板。
- `src/app/runtime.js`：WebExtension 运行时兼容层，把 storage/cookies/http 映射成现有业务可调用的 API。
- `src/app/state.js`：运行时状态、存储 key、默认配置和全局状态容器。
- `src/app/config.js`：常量、图标、i18n 文案、注入 CSS。
- `src/app/templates.js`：面板和页面 HTML 模板。
- `src/app/fullscreen.js`：全屏状态检测，包含常规 fullscreen 和站点特定兜底。
- `src/app/ui.js`：组合 UI 方法。
- `src/app/ui/feedback.js`：弹窗、数据检查器、CK/LS/SS 表格、WebDAV 配置弹窗。
- `src/app/ui/events.js`：DOM 事件绑定。
- `src/app/ui/panel.js`：面板导航和页面切换。
- `src/app/ui/switching.js`：账号切换相关 UI 状态和按钮交互。
- `src/app/ui/webdav.js`：WebDAV 状态和备份列表 UI。
- `src/app/core.js`：组合核心方法。
- `src/app/core/accounts.js`：账号保存、切换、管理逻辑。
- `src/app/core/backup.js`：本地导入导出、备份文件读写和数据合并逻辑。
- `src/app/core/environment.js`：当前页面环境、host、语言和运行时上下文准备。
- `src/app/core/inspector.js`：账号数据检查、编辑、保存流程。
- `src/app/core/webdav.js`：WebDAV 验证、备份、恢复、缓存和超时处理。
- `src/app/utils.js`：通用工具，包括 host 提取和 Cookie 过期判断。
- `scripts/build-userscript.mjs`：userscript 构建脚本，打包共享入口并写入 userscript 头部。
- `scripts/userscript.header.txt`：userscript 头部元数据模板。
- `scripts/build-extension.mjs`：扩展 manifest、content script、background、zip/xpi 的构建脚本。
- `.github/workflows/build-artifacts.yml`：手动触发的 GitHub Actions 构建，上传 userscript、Chromium 扩展包、Firefox 扩展包三个下载产物。
- `tests/*.test.js`：账号、检查器、WebDAV、工具函数、全屏等测试。

## 修改原则

- 当前主线同时维护扩展和 userscript 两种形态，不要把项目收窄成单一形态。
- 不要无故删除或破坏 userscript 入口、头部元数据、Greasy Fork 发布链、油猴安装说明；也不要无故删除扩展 manifest、后台脚本或扩展打包逻辑。
- 优先改 `src/` 下的共享源码；扩展专属逻辑放在 `src/extension/` 和 `scripts/build-extension.mjs`；脚本专属逻辑放在对应脚本入口、元数据或发布脚本里；`dist/` 是生成物，不提交。
- 改用户可见文案时，尽量同步更新 `src/app/config.js` 里多语言文案。
- 改动范围要小，沿用当前 UI / core 组合方式，不要无故大重构。
- 改共享逻辑时，要同时考虑扩展和脚本运行环境的 API 差异，避免只在一种形态里可用。
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

## 构建和安装验证

1. 用 `git status --short --branch`、`git diff --stat`、`git diff --name-status` 先确认改动范围。
2. 跑 `npm test`。
3. 按改动范围选择构建命令：
   - 只改 userscript 链路：跑 `npm run build:userscript`
   - 只改扩展链路：跑 `npm run build:extension`
   - 改共享逻辑或发布前验证：跑 `npm run build`
4. 检查 userscript 生成产物：
   - `AnMe.user.js`
5. 检查扩展生成产物：
   - `dist/extension/chromium`
   - `dist/extension/firefox`
   - `dist/packages/AnMe-chromium-<version>.zip`
   - `dist/packages/AnMe-firefox-<version>.xpi`
6. Chrome / Edge 用开发者模式加载 `dist/extension/chromium`。
7. Firefox 用 `about:debugging#/runtime/this-firefox` 临时加载 `dist/extension/firefox/manifest.json`。
8. 如果本次改动涉及脚本形态，要在用户脚本管理器里做一次安装或更新验证。

扩展普通用户安装需要商店签名：Chrome Web Store、Edge Add-ons、Firefox AMO。脚本普通用户安装需要对应 userscript 发布页或脚本管理器可识别的安装入口。

GitHub 上需要临时构建下载包时，手动运行 `Build Artifacts` workflow；它会跑测试和 `npm run build`，并提供 `AnMe.user.js`、`AnMe-chromium-extension`、`AnMe-firefox-extension` 三个 artifact 下载项。

## 测试提示

- 检查器选择和“有真实修改才允许保存”的行为主要看 `tests/inspector.test.js`。
- WebDAV 时间戳、配置和相关工具逻辑主要看 `tests/webdav.test.js` 以及 utils 相关测试。
- 扩展 manifest 和打包逻辑主要看 `scripts/build-extension.mjs`，变更后至少跑 `npm run build`。
- 脚本入口、userscript 元数据和发布链路主要看 `scripts/build-userscript.mjs` 和 `scripts/userscript.header.txt`，变更后至少跑 `npm run build:userscript`。

改共享行为、序列化格式、WebDAV 逻辑、账号数据编辑流程时，要补或更新聚焦测试，并尽量确认扩展和脚本两种形态都不退化。
