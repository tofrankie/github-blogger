## ADDED Requirements

### Requirement: 编辑器主题样式必须按可编辑区域组织

系统 SHALL（必须）将编辑器主题覆盖维护在按 Bytemd 职责拆分的 SCSS 模块中，包括 layout、toolbar、editor、preview，以及 Mermaid 相关共享主题基础。

#### Scenario: 编辑器样式完成重组

- **WHEN** 维护者查看 GitHub Blogger 的编辑器样式入口
- **THEN** 可以看到按 layout、toolbar、editor、preview 等职责组织的 SCSS 模块，而不是一组扁平且边界不清的覆盖文件

### Requirement: SCSS 入口必须接入现有构建和检查流程

系统 SHALL（必须）通过单一应用样式入口接入 SCSS，并让构建、样式检查和旧 CSS 迁移状态保持一致。

#### Scenario: 应用加载样式入口

- **WHEN** 应用入口组件加载样式
- **THEN** 它导入 `@/styles/app.scss`，并由该文件按顺序组合第三方基线和本地 SCSS 覆盖

#### Scenario: 样式检查覆盖 SCSS

- **WHEN** 维护者运行样式检查
- **THEN** `.scss` 文件会被 stylelint 检查，且 `src/styles/lib/**` 仍作为第三方基线被忽略

#### Scenario: 旧 CSS 入口完成迁移

- **WHEN** 本地样式迁移到 SCSS 后
- **THEN** 旧的本地 CSS 入口不再被应用引用，避免同一覆盖规则在 CSS 和 SCSS 中双份维护

### Requirement: 编辑器样式目录必须暴露清晰职责

系统 SHALL（必须）提供清晰的 SCSS 目录划分，使应用入口、第三方基线、Bytemd 区域样式、GitHub Markdown 预览覆盖和 Mermaid 图表样式各自有稳定位置。

#### Scenario: 维护者查找 Mermaid 样式

- **WHEN** 维护者需要修改 Mermaid 流程图、时序图或甘特图的预览主题
- **THEN** 可以在 `src/styles/bytemd/preview/mermaid/` 下找到对应类型文件，并在 `shared.scss` 中找到通用节点、文字、线条和箭头规则

#### Scenario: 维护者新增 Mermaid 图表类型

- **WHEN** 维护者需要为新的 Mermaid 图表类型添加预览主题
- **THEN** 复用 `src/styles/bytemd/preview/mermaid/shared.scss` 中的 `--mermaid-*` 语义 token 和通用规则，只在新类型文件中添加图表结构差异规则

#### Scenario: Mermaid 样式引用外部主题变量

- **WHEN** Mermaid 样式需要引用 Primer 或 GitHub Markdown 的主题变量
- **THEN** 只能在 `src/styles/bytemd/preview/mermaid/shared.scss` 中通过 `--mermaid-ref-*` 建立引用，再由 `--mermaid-*` 语义 token 消费，图表类型文件不得直接引用外部主题变量，且 `--mermaid-ref-*` 不保留旧变量兜底

#### Scenario: 维护者调整 Mermaid 深色主题

- **WHEN** 维护者需要调整 Mermaid 深色模式下的节点、文字、线条、箭头或标签颜色
- **THEN** 只需要修改 `src/styles/bytemd/preview/mermaid/shared.scss` 中对应的 `--mermaid-*` token，而不需要分别修改每个图表类型文件

#### Scenario: 维护者查找滚动条样式

- **WHEN** 维护者需要修改通用滚动条规则
- **THEN** 可以在 `src/styles/base.scss` 中找到相关样式，而不是在 Bytemd 专属文件中查找

### Requirement: 编辑器主题必须在不同颜色模式下保持现有编辑行为

系统 SHALL（必须）在通过项目自有样式提供一致浅色 / 深色主题覆盖时，保持当前编辑器布局、交互行为和 Bytemd 功能集合不变。

#### Scenario: 编辑时切换颜色模式

- **WHEN** 应用以浅色、深色或跟随 VS Code 系统主题模式渲染编辑器
- **THEN** toolbar、editor pane、preview pane、status 区域和语法高亮内容保持可读，并与当前主题一致，同时不改变编辑器功能

### Requirement: Mermaid 预览必须提供对齐 GitHub 风格的深色覆盖

系统 SHALL（必须）为已支持的图表类型定义项目自有 Mermaid 预览覆盖样式，以现有 GitHub 风格 Mermaid 样式为视觉参考，并将规则限定在 Bytemd 预览输出范围内。

#### Scenario: 已支持 Mermaid 图表在深色模式下渲染

- **WHEN** Markdown 预览包含项目当前支持的 Mermaid 图表
- **THEN** 图表背景、边框、文字、连接线和标签以可读的深色主题样式渲染，并与周围预览主题保持一致
