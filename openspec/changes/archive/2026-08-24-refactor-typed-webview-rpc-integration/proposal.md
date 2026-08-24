## Why

当前 GitHub Blogger 同时声明了新旧两套 WebView RPC 依赖，业务代码仍使用旧的字符串方法名、tuple 参数和 `emit/on` 注册方式，且 settings 与外链操作还维护着独立的手写 `postMessage` 协议。这使通信契约分散在 WebView、Extension 和共享类型之间，缺少统一的参数/返回值提示、错误语义和生命周期管理。

现在引入 `@tofrankie/vscode-webview-rpc`，需要按照其 typed RPC 设计完成一次完整重构，而不是只替换依赖名称。

## What Changes

- **BREAKING** 使用 `@tofrankie/vscode-webview-rpc` 的 `createWebviewRPC` 和 `createExtensionRPC` 替换旧 `vscode-webview-rpc` API
- **BREAKING** 将业务请求从 `rpc.emit(method, params[])` 重构为 typed `rpc.call(method, params)`
- **BREAKING** 将现有 tuple 参数改为共享 RPC 定义中的对象参数和 `void` 无参数调用
- 新增共享 `RPCDefinition`，统一声明 method、参数、返回值和通知 payload
- 按 `settings`、`repo`、`issues`、`labels`、`git`、`images` 等业务域整理命名空间 method
- 将 settings 获取和外链打开从手写 `postMessage` 迁移到 `call` / `notify`
- 将 Extension 端的 RPC handler 从实例方法批量注册改为 typed `calls` / `notifications` 处理定义
- 保证每个 WebView 通道只创建一个 RPC 实例，并让业务模块共享该实例
- 接入 RPC `dispose()`，随 WebView Panel 生命周期释放监听器和 pending calls
- **BREAKING** 移除旧 `vscode-webview-rpc` 依赖及其运行时 API
- 保留 GitHub REST/GraphQL 业务错误的语义，并将其适配到新 RPC 的标准错误通道

## Capabilities

### New Capabilities

- `typed-webview-rpc-integration`: GitHub Blogger 在 WebView 与 Extension 之间使用共享 typed RPC 定义进行双端调用、单向通知、错误传递和生命周期管理

### Modified Capabilities

## Impact

- 影响 `shared/types/rpc.ts` 及 WebView、Extension 两端的 RPC 调用和处理逻辑
- 影响 `src/utils/index.ts`、`src/utils/rpc.ts`、`src/main.tsx`、`src/app-provider.tsx` 的实例创建、依赖注入和手写消息处理
- 影响 `extension/server/index.ts`、`extension/panels/edit-panel.ts`、`extension/utils/helper.ts` 的消息注册和 Panel 生命周期
- 影响业务错误类型、RPC 错误适配以及相关测试/验证方式
- 更新 `package.json` 和 `pnpm-lock.yaml`，移除旧 RPC 包
- 不改变 GitHub Blogger 的 issue、label、repository、image upload 和 archive 等业务功能
