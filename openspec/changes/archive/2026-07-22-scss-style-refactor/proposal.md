## 背景与动机

当前编辑器样式分散在多个 CSS 文件里，Bytemd 补丁、Primer 主题覆盖和 Mermaid 预览适配交织在一起，深浅色模式下的维护成本正在持续上升。现在已经有明确的深色模式补齐需求，也有未完成的 Mermaid 深色样式，因此需要先把样式组织方式重构为可维护的 SCSS 结构，再继续做主题适配。

## 变更内容

- 将编辑器相关样式从松散的 CSS 导入链重构为按模块划分的 SCSS 结构，围绕 Bytemd 的 toolbar、body、editor、preview、status 等区域整理文件边界
- 保留 `src/styles/lib/` 下的第三方或备份样式文件不改动，通过本地 SCSS 覆盖层承接 GitHub Blogger 的主题补丁
- 统一梳理浅色 / 深色模式下的 Bytemd 编辑器与预览区样式，复用 Primer 已提供的主题变量，减少重复覆盖
- 补全 Mermaid 预览样式，参考现有 `github-mermaid.css`，让当前已支持的图表在深色模式下呈现一致、可读的 GitHub 风格
- 保证这次改动只涉及样式组织与主题表现，不改变编辑器功能、交互流程和业务逻辑

## 能力范围

### 新增能力

- `editor-theme-styles`: 定义 GitHub Blogger 编辑器在浅色 / 深色模式下的 Bytemd 主题覆盖、样式组织方式和 Mermaid 预览表现要求

### 修改能力

## 影响范围

- 影响 `src/app.css` 与 `src/styles/**` 的组织方式及导入关系
- 影响 Bytemd 编辑器、预览区、工具栏、状态栏和 Mermaid 图表的主题覆盖样式
- 需要新增 SCSS 编译依赖，并同步更新样式检查或构建配置以识别 `.scss`
- 不影响现有 React 组件层级、数据流、GitHub API 调用和编辑器功能行为
