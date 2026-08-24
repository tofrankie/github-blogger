## 1. 共享 RPC 契约

- [x] 1.1 盘点现有 RPC method、settings 消息和外链消息，建立迁移清单
- [x] 1.2 在 `shared/types/rpc.ts` 定义 `AppRPC` 和业务域 method
- [x] 1.3 将现有 tuple 参数转换为对象参数类型，并为无参数调用声明 `params: void`
- [x] 1.4 为 `settings.get`、业务 calls、`external-link.open` 定义 result 和 payload 类型
- [x] 1.5 删除不再需要的旧 RPC tuple 类型和重复 method 类型

## 2. WebView RPC 接入

- [x] 2.1 在 WebView 入口显式获取 vscode API 并创建唯一 `createWebviewRPC<AppRPC>` 实例
- [x] 2.2 将 RPC 实例通过入口依赖注入到 WebView 业务 API、hooks 或应用 provider
- [x] 2.3 将 `src/utils/rpc.ts` 的旧 `WebviewRPC` 和 `rpc.emit` 调用改为 typed `rpc.call`
- [x] 2.4 按业务域迁移 repository、issues、labels、git 和 image upload 调用
- [x] 2.5 将 `getSettings()` 改为调用 `settings.get`，移除独立的 `window.message` 响应监听
- [x] 2.6 将 `openExternalLink()` 和外链拦截逻辑改为发送 `external-link.open` notification
- [x] 2.7 将 WebView 端 RPC/远端错误适配为现有 `RpcError`，保留 UI 错误展示行为

## 3. Extension RPC 接入

- [x] 3.1 将 `extension/server/index.ts` 的旧 `ExtensionRPC` 替换为 `createExtensionRPC<AppRPC>`
- [x] 3.2 将 Service 业务方法从 rest tuple 参数改为 typed 对象参数
- [x] 3.3 将 label、issue、git、repository 和 image handlers 迁移到 `calls` 配置
- [x] 3.4 增加 `settings.get` call handler，返回当前 Extension settings
- [x] 3.5 增加 `external-link.open` notification handler，调用 VS Code 外链 API
- [x] 3.6 将 GitHub REST/GraphQL 错误转换为可序列化 RPC error data 并抛出
- [x] 3.7 确认 Extension handler 返回值与 `AppRPC` result 类型一致

## 4. 生命周期与旧通道清理

- [x] 4.1 将 RPC dispose 接入 `EditPanel.dispose()`，确保 message listener 和 pending calls 被释放
- [x] 4.2 移除 `WebviewHelper` 中 settings 和外链的旧消息处理分支
- [x] 4.3 检查 WebView 与 Extension 是否各自只创建一个 RPC 实例
- [x] 4.4 删除旧 `vscode-webview-rpc` import、类型引用和运行时 API 调用
- [x] 4.5 从 `package.json` 和 `pnpm-lock.yaml` 移除旧 RPC 依赖，保留新包依赖

## 5. 验证与文档

- [x] 5.1 执行旧包、旧 API 和旧 message type 的全仓搜索，确认没有残留业务引用
- [x] 5.2 执行 `pnpm typecheck`，修复共享 RPC 定义、handler 和调用方类型错误
- [x] 5.3 执行 `pnpm build`，确认 WebView bundle 和 Extension bundle 均能生成
- [x] 5.4 执行 `pnpm lint`，修复 ESLint、Prettier 和 Stylelint 问题
- [x] 5.5 验证 settings、外链、列表查询、标签编辑、issue 编辑和图片上传的 RPC 路径
- [x] 5.6 验证 handler 抛错、timeout、Panel dispose 和 dispose 后调用的错误行为
- [x] 5.7 更新项目相关文档，说明共享 `AppRPC`、单实例注入和 call/notify 使用方式
