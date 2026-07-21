## 1. SCSS 基础迁移

- [x] 1.1 为样式重构补充 `sass` 开发依赖，保持 Vite 使用内建 SCSS 处理能力，不新增额外 Vite 插件
- [x] 1.2 将 `src/app.css` 迁移为 `src/styles/app.scss`，并把 `src/app.tsx` 的样式导入改为 `@/styles/app.scss`
- [x] 1.3 建立 `src/styles/bytemd/` 目录，包含 `index.scss`、`layout.scss`、`toolbar.scss`、`editor.scss` 和 `preview/` 目录，文件名不使用 `_` 前缀
- [x] 1.4 建立 `src/styles/bytemd/preview/` 目录，包含 `index.scss`、`markdown.scss` 和 `mermaid/` 目录
- [x] 1.5 建立 `src/styles/bytemd/preview/mermaid/` 目录，包含 `index.scss`、`shared.scss`、`flowchart.scss`、`sequence.scss`、`gantt.scss`
- [x] 1.6 更新 `package.json` 的 `lint:stylelint` glob，让 `.scss` 文件进入样式检查；保留 `stylelint.config.mjs` 对 `src/styles/lib/**` 的忽略
- [x] 1.7 迁移现有本地覆盖样式到新的 SCSS 目录，将通用滚动条规则归入 `base.scss`，将原 `github.custom.css` 归入 Bytemd preview 体系，并保持 `src/styles/lib/**` 不变
- [x] 1.8 删除或停止引用已迁移的旧本地 CSS 入口，避免 `app.css`、`bytemd.css`、`editor.css`、`preview.css` 与新 SCSS 入口并存

## 2. 主题与 Mermaid 适配

- [x] 2.1 统一梳理浅色 / 深色模式下的 Bytemd layout、toolbar、editor、preview 本地主题覆盖，并将跨模块滚动条样式留在 `base.scss`，复用 Primer 变量并保持现有功能与交互不变
- [x] 2.2 在 `preview/mermaid/shared.scss` 中按 `--mermaid-ref-*` 引用层和 `--mermaid-*` 语义层集中定义 Mermaid 浅色 / 深色主题变量和通用节点、文字、线条、箭头规则，`--mermaid-ref-*` 只引用当前 Primer 变量且不保留旧变量兜底，避免每个图表文件重复主题模板或直接引用 GitHub Markdown 变量
- [x] 2.3 参考 `src/styles/lib/github-mermaid.css`，分别在 `flowchart.scss`、`sequence.scss`、`gantt.scss` 中补齐对应 Mermaid 图表类型的结构差异规则

## 3. 验证与收尾

- [x] 3.1 运行 `pnpm build`，确认 `sass` 接入、`src/app.tsx` 样式导入和 Vite 构建正常
- [x] 3.2 运行样式检查，确认 `.scss` 文件被 stylelint 覆盖且 `src/styles/lib/**` 仍被忽略
- [ ] 3.3 在浅色、深色和跟随系统模式下检查编辑器与 Mermaid 预览表现，确认没有明显视觉回归
