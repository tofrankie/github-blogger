## Purpose

为 GitHub Blogger 建立统一、可类型推导的 WebView 与 Extension 通信契约，覆盖业务请求、单向通知、错误传递和通信生命周期。

## Requirements

### Requirement: Shared typed RPC contract

系统 SHALL 使用一份 WebView 与 Extension 双端共享的 RPC 定义描述 RPC method、参数、返回值和 notification payload。

#### Scenario: Call method names are type constrained

- **WHEN** WebView 或 Extension 调用 RPC call
- **THEN** TypeScript MUST 只允许共享 calls 定义中声明的 method 名称

#### Scenario: Call parameters and results are inferred

- **WHEN** 调用方选择一个带参数的 call method
- **THEN** TypeScript MUST 根据该 method 推导对象参数类型和返回值类型

#### Scenario: Void calls omit parameters

- **WHEN** 一个 call method 声明无参数
- **THEN** 调用方 MUST 能以只传 method 的形式调用

### Requirement: Typed business call integration

系统 SHALL 将 repository、issue、label、git、image 和 settings 等需要结果的业务操作接入 typed call。

#### Scenario: WebView requests a business result

- **WHEN** WebView 调用一个业务 call method
- **THEN** Extension MUST 通过对应的 call handler 执行业务操作并返回该 method 声明的 result

#### Scenario: Object parameters preserve business meaning

- **WHEN** 一个业务操作需要多个输入参数
- **THEN** RPC 参数 MUST 使用具名对象表达，而不是依赖位置 tuple 或未约束的数组

#### Scenario: Concurrent calls remain independent

- **WHEN** WebView 并发发起多个相同或不同的业务 call
- **THEN** 每个 Promise MUST 根据唯一消息标识获得对应的 result 或 error

### Requirement: Settings and external link semantic integration

系统 SHALL 将 settings 获取和外链打开统一接入 RPC，并分别使用请求响应和单向通知语义。

#### Scenario: WebView gets settings through call

- **WHEN** WebView 请求 settings
- **THEN** Extension MUST 通过 call handler 返回当前 settings，且 WebView MUST 不再注册独立的 settings message 响应监听

#### Scenario: WebView opens an external link through notify

- **WHEN** WebView 发送外链打开 notification
- **THEN** Extension MUST 调用 VS Code 外链打开能力，且该消息 MUST 不创建等待 response 的 pending call

### Requirement: Single RPC instance per WebView channel

系统 SHALL 为每个 WebView 通道创建一个 RPC 实例，并让 WebView 与 Extension 的业务模块共享该实例。

#### Scenario: WebView creates one RPC instance

- **WHEN** WebView 应用启动
- **THEN** 入口 MUST 创建一个 RPC 实例并将其注入需要通信的业务模块

#### Scenario: Extension creates one RPC instance

- **WHEN** Extension 创建或恢复编辑面板
- **THEN** Service MUST 创建一个 RPC 实例，并使用该实例注册所有 typed handlers

#### Scenario: Modules do not create duplicate transports

- **WHEN** 多个业务模块需要发起或处理 RPC
- **THEN** 模块 MUST 复用入口实例，且不得为同一 WebView 通道创建额外 transport listener

### Requirement: Typed incoming handlers

系统 SHALL 通过 calls 和 notifications 配置注册 Extension 端处理函数，并使用共享定义约束处理函数的参数和返回值。

#### Scenario: Call handler receives typed object parameters

- **WHEN** Extension 为带参数的 call method 提供 handler
- **THEN** handler MUST 接收该 method 声明的对象参数，并返回兼容声明 result 的值或 Promise

#### Scenario: Notification handler receives typed payload

- **WHEN** Extension 为外链打开提供 notification handler
- **THEN** handler MUST 接收包含 url 字段的 payload，并且不返回业务 response

### Requirement: RPC error adaptation

系统 SHALL 将 transport、timeout、method not found 和远端 handler 错误通过 RPC 的 reject 语义传递，并保留 GitHub API 错误的业务详情。

#### Scenario: GitHub request error keeps request details

- **WHEN** Extension 端 GitHub REST 或 GraphQL 请求失败
- **THEN** WebView 端 MUST 能读取错误类型、message、status、request URL 和 method（如果存在）

#### Scenario: Remote call failure rejects

- **WHEN** Extension call handler 抛出错误
- **THEN** WebView 端对应的 call Promise MUST reject，而不是返回表示失败的成功 Promise

#### Scenario: Timeout rejects and clears pending call

- **WHEN** call 在配置的 timeout 内没有收到 response
- **THEN** 调用 MUST reject，并且该 pending call MUST 被清理

### Requirement: RPC lifecycle disposal

系统 SHALL 将 RPC 实例释放接入编辑面板生命周期，并在释放后阻止继续使用。

#### Scenario: Panel disposal releases RPC resources

- **WHEN** 编辑面板被销毁
- **THEN** Extension 侧 RPC MUST dispose message listener、handler registry 和 pending calls

#### Scenario: Pending call rejects on disposal

- **WHEN** 面板销毁时仍存在未完成的 call
- **THEN** 对应 Promise MUST 以明确的 disposed error reject

#### Scenario: Calls after disposal fail clearly

- **WHEN** 业务在 RPC dispose 后再次调用 call 或 notify
- **THEN** RPC MUST 阻止该操作并返回明确的 disposed error

### Requirement: Legacy RPC removal

系统 SHALL 移除旧 RPC 运行时 API 和依赖，避免新旧 envelope 在同一 WebView 通道并存。

#### Scenario: Package dependency is replaced

- **WHEN** 依赖安装和构建完成
- **THEN** package manifest 和 lockfile MUST 只保留新 RPC 包，不得继续声明旧包

#### Scenario: Legacy API imports are absent

- **WHEN** 对源码执行旧包和旧 API 搜索
- **THEN** WebView 与 Extension 源码 MUST 不再导入旧 RPC 包，也不得创建旧 RPC 实例
