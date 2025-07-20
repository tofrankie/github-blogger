# GitHub Blogger

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/toFrankie/github-blogger)

English | [中文](README-CN.md)

**GitHub Blogger** is a VS Code extension for writing and managing blog posts via GitHub Issue. It supports Markdown editing, live preview, and seamless publishing — all powered by GitHub.

## ✨ Features

- Manage and publish blog posts via GitHub Issue
- GitHub-native interaction experience
- Markdown editing with live preview and plugin support (Math, Mermaid, etc.)
- Images stored in your repository with jsDelivr CDN for display
- All content and edits stored directly in your repository

## 🚀 Quick Start

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Frankie.github-blogger) or [Open VSX](https://open-vsx.org/extension/frankie/github-blogger)
2. Generate your [GitHub Personal Access Token (classic)](https://github.com/settings/tokens)
3. Open the command palette (Cmd + Shift + P / Ctrl + Shift + P), search for `Configure GitHub Blogger` to set up
4. Then run `Open GitHub Blogger` and start writing!

Sample configuration:

```json
{
  "github-blogger.token": "your-github-token",
  "github-blogger.user": "your-github-username",
  "github-blogger.repo": "your-github-repo",
  "github-blogger.branch": "main"
}
```

## ⚠️ Notes

- **Your repository must be public** for jsDelivr CDN to work ([why](https://github.com/jsdelivr/jsdelivr/issues/18243#issuecomment-857512289))
- You can use any existing repository or create a new one
- Posts and images are saved under `archives` and `images` folders
- The working branch is set via `github-blogger.branch`. Ensure it exists—otherwise archiving and uploads may fail

## 🙏 Acknowledgements

This project is built upon and inspired by the open-source community, including:

- [Aaronphy/Blogger](https://github.com/Aaronphy/Blogger) – Project inspiration
- [@octokit/core](https://github.com/octokit/core.js) – GitHub's official SDKs
- [@primer/react](https://primer.style/react) – GitHub's official UI components
- [@tomjs/vite-plugin-vscode](https://github.com/tomjs/vite-plugin-vscode) – VS Code extension tooling
- [bytemd](https://github.com/bytedance/bytemd) – Markdown editor
- [jsDelivr](https://www.jsdelivr.com/?docs=gh) – Free CDN service

## 📷 Screenshots

![](./images/screenshot-1.png) ![](./images/screenshot-2.png) ![](./images/screenshot-3.png)

## 📚 Related Projects

- [github-issue-toc](https://github.com/toFrankie/github-issue-toc) – Generate a table of contents for GitHub Issue

## 📝 License

MIT
