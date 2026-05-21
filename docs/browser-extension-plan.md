# AnMe 浏览器插件化开发计划

## 可行性结论

可行，而且适合渐进迁移。AnMe 的主体能力是“注入页面 UI + 保存 CK/LS/SS 快照 + 切换时恢复快照”，这与浏览器扩展的 content script 模式天然接近。主要成本不在 UI，而在把存储、Cookie、跨域请求统一放到 WebExtension 运行时里。

主流浏览器适配建议：

- Chrome / Edge：优先使用 Manifest V3，后台入口为 `background.service_worker`。
- Firefox：保留单独 manifest。由于 Firefox 的后台脚本兼容细节和 Chromium 不完全一致，先使用 Firefox 专用 manifest，复用同一套 `content.js` 和 `background.js`。
- 代码层：业务逻辑尽量只维护一份，差异集中在 manifest 和 runtime bridge。

## 关键迁移点

1. `GM_getValue / GM_setValue / GM_listValues / GM_deleteValue`
   - 扩展版本映射到 `storage.local`。
   - 因为现有业务大量同步读取配置，扩展启动时先异步预加载 `storage.local` 到内存缓存，再提供同步兼容 API。

2. `GM_cookie`
   - content script 不能直接完整管理 cookies。
   - 扩展版本通过 `runtime.sendMessage` 交给后台脚本调用 `cookies` API。

3. `GM_xmlhttpRequest`
   - favicon 和 WebDAV 请求统一交给后台脚本 `fetch`。
   - WebDAV 的 `PROPFIND / MKCOL / PUT / DELETE` 等方法保留。

4. `GM_registerMenuCommand`
   - 扩展里映射为点击扩展图标后通知当前 tab 打开 AnMe 面板。

5. 页面存储
   - 账号快照里的 `localStorage / sessionStorage` 仍由 content script 在目标页面上下文读取和写入。
   - 切换账号后继续刷新当前页面。

## 当前第一阶段目标

已开始实现第一阶段：浏览器插件交付不依赖 `AnMe.user.js`。扩展构建单独输出可加载目录和打包文件。

产物路径：

- `dist/extension/chromium`：Chrome / Edge 开发者模式“加载已解压的扩展程序”目录。
- `dist/extension/firefox`：Firefox `about:debugging` 临时加载目录。
- `dist/packages/AnMe-chromium-<version>.zip`：Chrome Web Store / Edge Add-ons 提交用压缩包。
- `dist/packages/AnMe-firefox-<version>.xpi`：Firefox 调试/AMO 提交用 XPI 包。

命令：

```bash
npm run build:extension
```

## 后续阶段

1. 手动加载验证
   - Chrome / Edge 打开扩展管理页，加载 `dist/extension/chromium`。
   - Firefox 打开 `about:debugging#/runtime/this-firefox`，加载 `dist/extension/firefox/manifest.json`。
   - 验证扩展图标能打开面板，保存/切换账号能操作 CK/LS/SS。
   - 注意：Chrome / Edge 普通用户直接安装通常需要商店发布或开发者模式；Firefox 普通安装 XPI 需要 AMO 签名，未签名 XPI 主要用于调试或自用环境。

2. 权限收敛
   - 第一版先使用 `http://*/*` 和 `https://*/*` 覆盖主要网站。
   - 后续可以改成 `optional_permissions` 或用户主动授权站点，降低商店审核和用户心理负担。

3. 数据迁移
   - 设计从旧版数据导出 JSON 到扩展导入的流程。
   - 保持现有导入导出格式，避免用户数据语义变化。

4. 打包发布
   - 增加 zip 打包脚本。
   - 分别准备 Chrome Web Store、Edge Add-ons、Firefox AMO 的截图、权限说明和隐私说明。

5. 浏览器兼容性回归
   - WebDAV 请求方法、Cookie sameSite/secure、扩展图标打开面板、切换后刷新，是三端重点回归项。
