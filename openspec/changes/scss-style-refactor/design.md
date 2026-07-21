## 背景

当前应用通过 `src/app.css` 串联多个样式文件，其中 `src/styles/bytemd.css`、`src/styles/editor.css`、`src/styles/preview.css` 和 `src/styles/base.css` 共同覆盖 Bytemd 编辑器的不同区域。现状有几个明显问题：

- Bytemd 的样式补丁分散在多个文件，编辑器主体、语法高亮、预览区和工具栏边界不够清晰
- 深色模式依赖 Primer 变量，但本地覆盖规则没有形成统一分层，后续补齐成本高
- `src/styles/preview.css` 目前只覆盖了部分 Mermaid 图表，且基本都是深色模式代码，未形成可继续扩展的结构
- `src/styles/lib/` 中既有第三方基线样式，也有对外部库的适配内容；草案已明确这些文件不作为这次重构对象

这次变更是一次跨 `src/app.css`、`src/styles/**`、构建依赖和样式检查规则的横切式改造，适合先用设计文档收敛方案，再进入实现。

## 目标 / 非目标

**目标：**

- 将编辑器样式迁移到更清晰的 SCSS 分层，按 Bytemd 区域与主题职责组织文件
- 保持当前样式入口和运行时功能不变，让改造聚焦在样式表达与维护性
- 为浅色 / 深色模式建立统一的覆盖方式，优先复用 Primer token，而不是复制颜色值
- 补齐 Mermaid 预览主题，使当前仓库内已接入的图表在深色模式下具备稳定、可读的呈现

**非目标：**

- 不修改 `src/styles/lib/**` 中的第三方或备份样式内容
- 不调整 Bytemd 插件列表、编辑器布局结构或 React 组件逻辑
- 不在这次变更中引入新的图表库、主题切换交互或视觉重设计

## 目录划分

目标样式目录按“入口、第三方基线、本地覆盖、编辑器区域”划分：

```text
src/styles/
├── app.scss
├── base.scss
├── primer.scss
├── toast.scss
├── lib/
│   ├── github.css
│   ├── github-markdown.css
│   └── github-mermaid.css
└── bytemd/
    ├── index.scss
    ├── tokens.scss
    ├── layout.scss
    ├── editor.scss
    └── preview/
        ├── index.scss
        ├── markdown.scss
        └── mermaid/
            ├── index.scss
            ├── shared.scss
            ├── flowchart.scss
            ├── sequence.scss
            └── gantt.scss
```

职责说明：

- `app.scss` 是应用样式总入口，负责按顺序导入第三方基线、本地组件样式和最终覆盖
- `lib/` 继续存放第三方或参考样式，本次保持只读
- `base.scss` 承接全局基础样式，包括应用布局变量、通用滚动条等跨模块规则
- `primer.scss`、`toast.scss` 承接现有非 Bytemd 专属样式
- `bytemd/index.scss` 是 Bytemd 覆盖层入口，只暴露一个导入点给 `app.scss`
- `bytemd/tokens.scss` 放置本地主题 token、选择器变量和 Mermaid 共用颜色，不放具体组件选择器
- `bytemd/layout.scss` 放置 `.app-bytemd`、`.bytemd`、toolbar、body、status、sidebar、fullscreen 等编辑器容器和布局规则
- `bytemd/editor.scss` 放置 CodeMirror 编辑区、Markdown 语法 token 和编辑态主题覆盖
- `bytemd/preview/index.scss` 是预览区入口，负责组合 GitHub Markdown 覆盖和 Mermaid 覆盖
- `bytemd/preview/markdown.scss` 承接原 `github.custom.css` 的 GitHub Markdown 预览覆盖
- `bytemd/preview/mermaid/index.scss` 是 Mermaid 预览入口，只负责按顺序导入共享规则和图表类型文件
- `bytemd/preview/mermaid/shared.scss` 放 Mermaid 通用选择器、浅色 / 深色主题变量、节点、文字、线条和箭头规则
- `bytemd/preview/mermaid/flowchart.scss`、`sequence.scss`、`gantt.scss` 分别放对应图表类型的结构差异规则；类型文件只消费共享变量，不重复声明主题模板

## 决策

### 1. 用单一 SCSS 入口替换现有编辑器样式导入链

将当前 `src/app.css` 迁移为 `src/styles/app.scss`，并让 `src/app.tsx` 只导入这个新的应用样式入口。编辑器相关样式由 `app.scss` 导入聚合 SCSS 文件，再由它继续拆分 partial。这样可以避免在组件层分散导入多个样式文件，同时让 Vite 沿用单入口样式处理方式。

备选方案：

- 继续保留多个 `.css` 文件，只做命名整理。放弃原因是无法充分利用嵌套、变量和 partial，后续主题维护收益有限。
- 直接在组件侧分别导入多个 `.scss`。放弃原因是样式边界会从目录层转移到组件层，和这次“集中整理主题层”的目标相反。

### 2. 以少量职责文件组织 Bytemd 覆盖，而不是按 DOM 区域过度拆分

新的 SCSS 结构把 Bytemd 样式收敛为 `layout`、`editor`、`preview` 三类主要职责，再配合 `tokens` 放置公共 token、选择器变量和暗色覆盖。这样既能让后续改动直接落到具体职责，也能避免因为 toolbar、body、status、sidebar 等区域拆得太细导致文件跳转成本上升。

备选方案：

- 按现有 `bytemd.css`、`editor.css`、`preview.css` 原样迁移为 `.scss`。放弃原因是目录结构仍然表达旧问题，难以体现区域职责。
- 按 toolbar、body、editor、preview、status、sidebar、scrollbar 等 DOM 区域逐个拆文件。放弃原因是文件数量偏多，很多规则需要一起理解，拆开后维护体验反而变差。

### 3. 将 `src/styles/lib/**` 视为只读基线，通过本地覆盖层扩展

草案已明确 `src/styles/lib/` 下文件不需要修改，因此设计上把这些文件当作只读基线，继续先导入，再在本地 SCSS 中叠加覆盖。这样既能保留第三方对齐参考，也能避免以后升级或回溯时失去边界。

备选方案：

- 直接修改 `src/styles/lib/github-mermaid.css` 或其他 lib 文件。放弃原因是会把“第三方基线”和“项目自定义覆盖”混在一起，后续维护风险更高。

### 4. Mermaid 样式继续挂在预览主题下，并按图表类型拆分

Mermaid 只在预览区生效，因此保持它属于 preview 主题的一部分。实现时以 `github-mermaid.css` 为外部参考，对当前 `preview.css` 已覆盖的甘特图、流程图、时序图做结构化整理，并为后续补齐其他图表预留类型文件。

为了避免深浅模式带来大量模板代码，Mermaid 主题采用“共享变量 + 类型差异”的方式：

- 浅色 / 深色的颜色、边框、文字、线条、标签背景等语义变量集中放在 `shared.scss`
- `flowchart.scss`、`sequence.scss`、`gantt.scss` 只写该图表生成结构特有的选择器和少量布局差异
- 新增图表类型时，优先复用 `shared.scss` 的变量和通用规则；只有 Mermaid 输出结构不同才新增类型文件规则
- 如果某个图表只需要通用节点、文字和线条规则即可正确显示，不为它单独创建文件

Mermaid token 设计采用三层，并且不覆盖 GitHub Markdown / Primer 的变量名：

1. Mermaid 引用层：只在 `[id^='bytemd-mermaid-']` 范围内用 `--mermaid-ref-*` 引用 Primer / GitHub Markdown 已存在的 CSS 变量，例如 `--bgColor-default`、`--fgColor-default`、`--borderColor-default`。这一层相当于 Mermaid 自己的 adapter，负责接入当前浅色 / 深色主题；其他文件不直接使用 GitHub Markdown / Primer 变量。实现时使用当前 Primer 变量即可，不需要继续保留旧 `--color-*` 变量兜底。
2. Mermaid 语义层：继续在 `[id^='bytemd-mermaid-']` 范围内定义 `--mermaid-*` 变量，按视觉角色命名，不按图表类型命名。语义 token 只引用 `--mermaid-ref-*` 或其他 `--mermaid-*`，避免图表类型文件和外部主题变量耦合。建议的核心 token 包括：

```scss
[id^='bytemd-mermaid-'] {
  --mermaid-ref-surface: var(--bgColor-default);
  --mermaid-ref-surface-muted: var(--bgColor-muted);
  --mermaid-ref-text: var(--fgColor-default);
  --mermaid-ref-text-muted: var(--fgColor-muted);
  --mermaid-ref-border: var(--borderColor-default);
  --mermaid-ref-border-muted: var(--borderColor-muted);
  --mermaid-ref-accent-muted: var(--bgColor-accent-muted);
  --mermaid-ref-neutral-muted: var(--bgColor-neutral-muted);
  --mermaid-ref-done-muted: var(--bgColor-done-muted);
  --mermaid-ref-attention-muted: var(--bgColor-attention-muted);

  --mermaid-surface: var(--mermaid-ref-surface);
  --mermaid-surface-muted: var(--mermaid-ref-surface-muted);
  --mermaid-node-bg: var(--mermaid-ref-surface-muted);
  --mermaid-node-border: var(--mermaid-ref-border);
  --mermaid-text: var(--mermaid-ref-text);
  --mermaid-text-muted: var(--mermaid-ref-text-muted);
  --mermaid-line: var(--mermaid-ref-border-muted);
  --mermaid-marker: var(--mermaid-line);
  --mermaid-label-bg: var(--mermaid-ref-surface);
  --mermaid-cluster-bg: var(--mermaid-ref-surface-muted);
  --mermaid-cluster-border: var(--mermaid-ref-border-muted);
  --mermaid-section-0: var(--mermaid-ref-accent-muted);
  --mermaid-section-1: var(--mermaid-ref-neutral-muted);
  --mermaid-section-2: var(--mermaid-ref-done-muted);
  --mermaid-section-3: var(--mermaid-ref-attention-muted);
}
```

3. 图表消费层：`flowchart.scss`、`sequence.scss`、`gantt.scss` 只使用 Mermaid 语义 token，不直接写浅色 / 深色颜色值，也不直接引用 GitHub Markdown / Primer 变量。类型文件允许保留图表结构差异，例如 flowchart 的 `.cluster rect`、sequence 的 `.actor`、gantt 的 `.section0`，但不重新声明完整主题。

深浅模式覆盖只在语义层做。若 Primer / GitHub Markdown 变量在某个 Mermaid 元素上不足以达到可读性，允许在 `shared.scss` 中用外层主题选择器覆盖少量 `--mermaid-*` 值，例如：

```scss
body:has(#root > div[data-color-mode='dark']),
body.vscode-dark:has(#root > div[data-color-mode='auto']) {
  [id^='bytemd-mermaid-'] {
    --mermaid-node-bg: #1f2020;
    --mermaid-line: lightgrey;
  }
}
```

这种覆盖必须仍然落在 `shared.scss`，避免在每个图表类型文件里重复写 dark/light 模板。

为了避免和 GitHub Markdown 样式冲突，Mermaid 样式遵守三个约束：

- 不声明或覆盖任何 `--color-*`、`--bgColor-*`、`--fgColor-*`、`--borderColor-*` 等外部变量
- 不在 `flowchart.scss`、`sequence.scss`、`gantt.scss` 中直接使用外部主题变量，只使用 `--mermaid-*`
- 所有 Mermaid token 都限定在 `[id^='bytemd-mermaid-']` 作用域内，避免影响 `.markdown-body` 的普通 Markdown 内容
- 不为 `--mermaid-ref-*` 添加旧变量兜底；实现时确认当前 Primer 变量存在，并把历史旧变量引用作为迁移清理内容

备选方案：

- 把所有 Mermaid 样式放进一个 `mermaid.scss`。放弃原因是后续补齐图表类型时会越来越长，图表结构差异不够清楚。
- 每个图表文件各自处理浅色 / 深色变量。放弃原因是会产生大量重复模板代码，后续调整主题时容易漏改。
- 按颜色用途直接写 `$dark-node-bg`、`$light-node-bg` 这类 Sass 变量。放弃原因是最终运行时无法跟随 VS Code / Primer 的主题变量变化，且不利于局部覆盖。

### 5. 构建和校验配置同步支持 SCSS

为了让迁移后的样式能正常构建和校验，需要补充 `sass` 依赖，并把样式检查范围从纯 `.css` 扩展到 `.scss`。这是重构的一部分，否则新结构无法纳入现有开发流程。

SCSS 接入边界如下：

- `src/app.tsx` 从导入 `@/app.css` 改为导入 `@/styles/app.scss`，让应用继续只有一个样式入口
- `src/styles/app.scss` 负责承接原 `src/app.css` 的导入顺序，继续先加载 `lib/` 基线样式，再加载本地 SCSS 覆盖，最后加载 `base.scss`
- `package.json` 增加 `sass` 开发依赖；Vite 可直接处理 `.scss`，不需要新增 Vite 插件
- `package.json` 的 `lint:stylelint` 范围从 `./**/*.{css,html}` 扩展到包含 `.scss`
- `stylelint.config.mjs` 继续忽略 `src/styles/lib/**`，并确保新 SCSS 文件进入检查范围
- 迁移完成后，删除或停止引用旧的 `src/app.css`、`src/styles/bytemd.css`、`src/styles/editor.css`、`src/styles/preview.css`；被迁移为 SCSS 的本地样式不保留双份入口
- `src/styles/lib/**` 下的 `.css` 文件保持原名和原内容，由 `app.scss` 继续导入

## 风险 / 权衡

- [风险] 样式文件重组后，选择器覆盖顺序变化可能导致局部回归
  缓解：保持单一入口导入顺序稳定，并在任务里加入构建与编辑器主题回归检查

- [风险] SCSS 接入只改文件但遗漏入口导入或 lint glob，导致构建能跑但检查漏掉新文件
  缓解：任务中单独列出 `src/app.tsx` 导入、`package.json` 依赖和 stylelint 范围更新

- [风险] SCSS 嵌套使用过度会让最终选择器变长、排查困难
  缓解：限制嵌套只服务于清晰的区域边界，不把层级当成“缩进版的旧 CSS”

- [风险] Mermaid 官方生成结构存在图表类型差异，一次性补齐全部图表成本过高
  缓解：先覆盖当前仓库已开始适配的图表类型，并按 GitHub 风格抽出可复用规则，后续按类型扩展

- [风险] 样式重构没有组件逻辑改动，容易忽略运行时视觉验证
  缓解：在任务中要求执行构建 / lint，并至少检查浅色、深色下的编辑区与 Mermaid 预览表现
