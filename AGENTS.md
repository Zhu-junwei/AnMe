# AGENTS.md

给后续编码代理看的项目协作说明。优先遵守这里的项目约定，再结合当前代码确认细节。

## 项目概况

AnMe 是一个运行在 Tampermonkey / ScriptCat 上的多网站多账号切换 userscript。它会保存 Cookie、LocalStorage、SessionStorage 快照，通过脚本管理器 API 存储数据，并支持可选的 WebDAV 备份和恢复。

源码入口是 `src/main.js`。最终发布/安装用的脚本文件是 `AnMe.user.js`，由 `npm run build` 生成。

## 常用命令

- `npm test`：运行 Node 测试。
- `npm run build`：用 `scripts/build.mjs` 把 `src/main.js` 打包成 `AnMe.user.js`。

改行为逻辑后要跑测试。改源码、头部元数据或版本发布相关内容后，要跑 build，让 `AnMe.user.js` 同步更新。

## 目录和文件职责

- `src/main.js`：userscript 入口。
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
- `scripts/userscript.header.txt`：userscript 头部元数据。
- `scripts/build.mjs`：esbuild 打包脚本。
- `tests/*.test.js`：账号、检查器、WebDAV、工具函数、元数据、全屏等测试。

## 修改原则

- 优先改 `src/` 下的源码和 `scripts/` 下的元数据；`AnMe.user.js` 视为生成物。
- 改用户可见文案时，尽量同步更新 `src/app/config.js` 里多语言文案。
- 改动范围要小，沿用当前 userscript 的 UI / core 组合方式，不要无故大重构。
- 小心账号 key、host/domain、WebDAV 密钥、导入导出格式等已有数据语义。
- 发布或提交前先看 `git status --short --branch`。不要回滚无关本次任务的本地改动。

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

## 发布和版本流程

用户说要发布、加版本、提交到 GitHub、合并到 main、保持本地和远程最新时，按这个仓库的流程做，除非当前 git 状态显示需要调整：

1. 用 `git status --short --branch`、`git diff --stat`、`git diff --name-status` 先确认改动范围。
2. 版本号需要同步 `package.json`、`package-lock.json`、`scripts/userscript.header.txt`。
3. 跑 `npm test`。
4. 跑 `npm run build`，重新生成 `AnMe.user.js`。
5. 在 `dev` 上提交。
6. 推送 `dev`，合并到 `main`，推送 `main`，再把 `dev` fast-forward 到 `main`，让本地和远程两个分支最终一致。

真正 push 前要重新确认分支名、远端和认证状态。

## 测试提示

- 检查器选择和“有真实修改才允许保存”的行为主要看 `tests/inspector.test.js`。
- WebDAV 时间戳、配置和相关工具逻辑主要看 `tests/webdav.test.js` 以及 utils 相关测试。
- userscript 头部元数据看 `tests/meta.test.js`。

改共享行为、序列化格式、WebDAV 逻辑、账号数据编辑流程时，要补或更新聚焦测试。
