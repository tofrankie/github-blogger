## Context

GitHub Blogger 的 WebView 与 Extension 当前通过两种方式通信：

- issue、label、repository、GitHub 内容写入等业务使用旧 `vscode-webview-rpc`，以字符串 method、tuple 参数和 `emit/on` API 为主
- settings 获取和外链打开使用独立的 `window.postMessage` / `vscode.postMessage` 消息

项目已经声明 `@tofrankie/vscode-webview-rpc`，但尚未接入。参考仓库的设计明确要求使用共享 `RPCDefinition`、对象参数、`call`/`notify`/`event` 语义、单通道单实例和 `dispose()` 生命周期。本次重构需要同时调整共享类型、WebView 入口、Extension Service、Panel 生命周期和业务错误适配。

## Goals / Non-Goals

**Goals:**

- 使用 `@tofrankie/vscode-webview-rpc` 作为唯一 RPC 依赖
- 在 `shared/types/rpc.ts` 中定义 WebView 与 Extension 共用的 `AppRPC`
- 使用对象参数和 `void` 参数表达业务调用
- 将所有请求响应消息统一为 `rpc.call`
- 将外链打开统一为 `rpc.notify`
- 让 settings 获取也使用 RPC，而不是手写消息监听
- 保证一个 WebView 通道只创建一个 RPC 实例，并由入口注入给业务模块
- 保留 GitHub API 错误的 REST/GraphQL/UNKNOWN 分类
- 在 Panel 销毁时释放 RPC listener 和 pending calls
- 通过类型检查、构建和必要的运行时测试验证双端协议一致

**Non-Goals:**

- 不修改 GitHub API 请求、分页、归档和图片上传的业务规则
- 不引入方向型 RPC 定义，Extension 和 WebView 继续共享同一套能力模型
- 不在本次重构中新增 event 业务；event 仅保留为新 RPC 实例的可用能力
- 不为 RPC 引入额外 runtime schema 校验库
- 不保留旧 `vscode-webview-rpc` 的运行时兼容层
- 不把业务 API 改造成网络服务或跨 WebView 通道共享

## Decisions

### Decision: 以共享 AppRPC 作为唯一通信契约

`shared/types/rpc.ts` 只放类型，不放任何一端的运行时代码。它使用新包的 `RPCDefinition` 描述 calls、notifications 和 events：

```text
AppRPC
├── calls
│   ├── settings.get
│   ├── repo.get
│   ├── issues.*
│   ├── labels.*
│   ├── git.*
│   └── images.upload
├── notifications
│   └── external-link.open
└── events
    └── 暂无业务事件
```

method 使用业务命名空间，避免 `get_*` 这类全局名称冲突。每个带参数的方法使用对象参数，只有无参数方法使用 `params: void`。

### Decision: 按通信语义迁移消息

需要返回业务结果的操作使用 `call`，例如 `settings.get`、`issues.list` 和 `images.upload`。打开外链不等待结果，使用 `notify('external-link.open', { url })`。

WebView 端和 Extension 端都使用同一个 RPC 实例完成发送与接收。业务模块不能自行创建第二个 RPC 实例，也不能重新监听同一 WebView 的原始消息通道来实现 RPC。

### Decision: WebView 端在入口创建实例并注入

WebView 端在 `main.tsx` 创建 `createWebviewRPC<AppRPC>(vscode)`，再将实例传入 `AppProvider`、业务 API 工厂或需要通信的模块。`src/utils/rpc.ts` 不再隐式创建并导出全局旧 RPC 单例。

这样可以显式表达依赖，避免模块导入时绑定全局 `window`，也方便测试时注入兼容 transport。

### Decision: Extension 端由 Service 创建并注册 typed handlers

Extension 端在创建 `Service` 时调用 `createExtensionRPC<AppRPC>(webview, options)`。原先通过 `Object.entries(...).forEach(rpc.on)` 的注册方式改为 `calls` 和 `notifications` 配置对象。

Service 内部方法改为接收对象参数，方法返回值与 `AppRPC` 中对应的 result 类型保持一致。需要 `this` 的方法通过闭包或绑定后的 handler 接入，不将 Service 实例方法暴露给共享类型。

### Decision: 保留业务错误信息，但使用 RPC 错误通道传递

GitHub REST/GraphQL 错误仍然需要包含现有的 type、message、status、request URL 和 method 信息。Extension 端在 RPC handler 中将业务错误转换为可序列化的 RPC error data 并抛出，WebView 端将远端 RPC 错误适配为现有 `RpcError`，从而保留 UI 对 `RpcError` 的判断能力。

成功结果直接作为 `rpc.call` 的返回值，不再把“通信失败”包装成成功的 Promise + `ApiResponse.success: false`。这样 timeout、method not found、Panel 销毁和 handler 抛错可以使用新库统一的 reject 语义。

### Decision: settings 和外链消息一起迁移

`settings.get` 改为 Extension 侧的 call handler，WebView 侧直接 `await rpc.call('settings.get')`。`external-link.open` 改为 Extension 侧 notification handler，WebView 侧通过 `rpc.notify` 发出。

迁移完成后，`WebviewHelper.setupWebviewHooks` 只保留非 RPC 的 Panel 初始化职责；不再为 settings 和外链继续维护独立的消息结构。

### Decision: RPC dispose 绑定 Panel 生命周期

`Service` 提供或暴露 RPC dispose 能力，`EditPanel.dispose()` 在销毁 WebView 时调用它。dispose 必须释放 Extension 侧 message listener，并让未完成的 call 以明确错误结束。WebView 侧使用的 RPC 实例也应在入口生命周期结束时具备清理路径。

### Decision: 分阶段迁移并保持单次切换

由于新旧包的 envelope 不兼容，不能让 WebView 端和 Extension 端长期分别运行新旧协议。实现时应在同一个变更中完成共享定义、双端实例、所有调用方和依赖清理，再统一构建验证。

## Target Structure

```text
shared/
  types/
    rpc.ts                 # AppRPC 及业务参数/结果契约

src/
  main.tsx                 # 创建 WebView RPC
  rpc.ts                   # WebView 业务 API 与错误适配

extension/
  server/
    index.ts               # 创建 Extension RPC 和 handlers
  panels/
    edit-panel.ts          # 绑定 dispose 生命周期

package.json               # 移除旧 RPC 包
```

如果实现过程中 `shared/types/rpc.ts` 过大，再按业务域拆分局部定义并在该文件组合；拆分不能导致多个底层 RPC 实例。

## Risks / Trade-offs

- [Risk] 一次切换会同时改变参数形态和错误处理，回归面较大。→ Mitigation：先锁定 `AppRPC` method 表，再按 settings、labels、issues、git、images 顺序迁移，并为每个域执行类型检查。
- [Risk] 新库只序列化通用 RPC error，可能丢失 GitHub 请求详情。→ Mitigation：将现有 `ApiError` 放入 RPC error 的 `data`，WebView 端统一恢复为 `RpcError.apiError`。
- [Risk] WebView 入口注入 RPC 后，现有 hooks 的导入方式需要调整。→ Mitigation：先保留稳定的业务函数 API，通过工厂或 React context 注入底层 rpc，避免组件直接依赖 transport。
- [Risk] Panel dispose 时漏掉 RPC listener 会造成重复处理或资源泄漏。→ Mitigation：将 RPC disposer 纳入 `EditPanel` 的统一销毁路径，并增加 dispose 后调用失败的验证。
- [Risk] 新旧协议同时存在时，开发环境可能出现请求无响应。→ Mitigation：不保留并行运行方案，完成双端切换后再执行 dev/build 验证。

## Migration Plan

1. 定义 `AppRPC` 和各业务域的对象参数类型，确认 method 表与返回值。
2. 在 WebView 入口创建 typed RPC，并将 settings、外链和业务 API 迁移到该实例。
3. 在 Extension Service 创建 typed RPC，将现有 handler 改为 `calls` / `notifications`。
4. 将 API 错误适配到新 RPC error，并更新 WebView `RpcError` 处理。
5. 将 RPC dispose 接入 `EditPanel.dispose()`，删除旧消息监听和旧包依赖。
6. 执行 typecheck、build、lint 和打包产物检查。

回滚时需要整体恢复双端旧 RPC 和旧消息通道，不能只回滚 WebView 或 Extension 单侧。

## Open Questions

- 是否将 `ApiResponse<T>` 从跨端返回契约中完全移除，还是保留为部分业务 API 的内部转换类型？
- WebView RPC 应通过函数参数注入，还是通过 React context 提供给 hooks？首版优先使用函数参数和集中业务 API，避免新增全局 context。
- 是否在本次变更中为 `external-link.open` 增加通知发送失败的本地日志？默认不阻塞用户操作。
