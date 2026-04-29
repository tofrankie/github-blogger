# GitHub Blogger

[![Visual Studio Marketplace Version](https://vsmarketplacebadges.dev/version/frankie.github-blogger.svg?color=4d9375)
](https://marketplace.visualstudio.com/items?itemName=frankie.github-blogger) [![Open VSX Version](https://img.shields.io/open-vsx/v/frankie/github-blogger.svg?label=Open%20VSX&color=a60ee5)
](https://open-vsx.org/extension/frankie/github-blogger)

[English](README.md) | 中文

**GitHub Blogger** 是一款基于 VS Code 的扩展，通过 GitHub issue 编写和管理博客文章。支持 Markdown 编辑、实时预览和无缝发布，这一切都由 GitHub 驱动。

理论上支持所有基于 VSCodium 的编辑器，如 Cursor、TRAE、Kiro、Google Antigravity 等。

## ✨ 功能特性

- 通过 GitHub issue 管理和发布博客文章
- 原生 GitHub 交互体验
- 支持实时预览和插件的 Markdown 编辑器（数学公式、Mermaid 图表等）
- 支持免费图床功能，图片存储在你的博客仓库里，通过 jsDelivr CDN 提供显示服务
- 所有文章以及编辑记录（以 Git Commit 形式）存储在你的博客仓库中

> [!IMPORTANT]
> **你的博客仓库必须是公开仓库**，jsDelivr CDN 才能正常工作（[原因](https://github.com/jsdelivr/jsdelivr/issues/18243#issuecomment-857512289)，[设置仓库可见性](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)）

## 🚀 快速开始

1. 创建 [GitHub](https://docs.github.com/en/get-started/start-your-journey/creating-an-account-on-github#signing-up-for-a-new-personal-account) 账号（如已有可跳过）
2. 创建一个[公开仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository#creating-a-new-repository-from-the-web-ui)（若使用已有仓库可跳过）
3. 生成一个 [GitHub Personal Access Token (classic)](https://github.com/settings/tokens)，至少勾选 `public_repo` scope
4. 从 [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=frankie.github-blogger) 或 [Open VSX](https://open-vsx.org/extension/frankie/github-blogger) 安装 GitHub Blogger 扩展
5. 在 VS Code 命令面板输入 `Configure GitHub Blogger` 完成必要配置（命令面板快捷键 `Cmd + Shift + P` / `Ctrl + Shift + P`）
6. 在 VS Code 命令面板输入 `Open GitHub Blogger` 打开编辑器，开始写作！

## ⚙️ 更新配置

更新扩展配置可通过 `Configure GitHub Blogger` 命令，或直接在 VS Code 的 `settings.json`。示例如下：

```json
{
  "github-blogger.token": "your-github-token",
  "github-blogger.user": "your-github-username",
  "github-blogger.repo": "your-github-repo",
  "github-blogger.branch": "main"
}
```

## 🔐 GitHub PAT

本扩展需要一个 [GitHub Personal Access Token (classic)](https://github.com/settings/tokens)，至少包含以下 scope 之一：

- `public_repo` - 使用公开仓库时，本扩展所需的最小必需权限（issues、labels、contents/git 等场景）
- `repo` - 仅在你要访问或创建私有仓库时需要

## ⚠️ 说明

- 文章和图片保存在博客仓库的 `archives` 和 `images` 目录
- 工作分支通过 `github-blogger.branch` 设置，默认为 `main` 分支，通常无需修改。若分支不存在，可能会导致文章、图片存储失败，甚至文章中的图片无法正常显示

## 📷 截图

![](./images/screenshot-1.png) ![](./images/screenshot-2.png) ![](./images/screenshot-3.png)

## 🙏 致谢

本项目基于开源社区的工作构建和启发，包括但不限于：

- [Aaronphy/Blogger](https://github.com/Aaronphy/Blogger) – 项目灵感来源
- [@octokit/core](https://github.com/octokit/core.js) – GitHub 官方 SDK
- [@primer/react](https://primer.style/react) – GitHub 官方 UI 组件
- [@tomjs/vite-plugin-vscode](https://github.com/tomjs/vite-plugin-vscode) – VS Code 扩展工具
- [bytemd](https://github.com/bytedance/bytemd) – Markdown 编辑器
- [jsDelivr](https://www.jsdelivr.com/?docs=gh) – 免费 CDN 服务

## 📚 相关项目

- [github-issue-toc](https://github.com/tofrankie/github-issue-toc) – 为 GitHub issue 生成目录

## 📝 License

[MIT](./LICENSE) License © [Frankie](https://github.com/tofrankie)
