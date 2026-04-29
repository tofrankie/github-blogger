import type { MinimalIssue, Settings } from '~/types'
import dayjs from 'dayjs'
import matter from 'gray-matter'
import { VITE_DEV } from '@/constants'
import { MESSAGE_TYPE } from '~/constants'

type VSCodeApi = ReturnType<typeof acquireVsCodeApi>

interface GetSettingsMessage {
  type?: string
  payload?: Settings
}

export function cdnURL({
  user,
  repo,
  branch,
  file,
}: {
  user: string
  repo: string
  branch: string
  file: string
}): string {
  const tag = branch ? `@${branch}` : ''
  return `https://cdn.jsdelivr.net/gh/${user}/${repo}${tag}/${file}`
}

declare global {
  interface Window {
    __vscode__?: VSCodeApi
  }
}

let settings: Settings

export async function getSettings(): Promise<Settings> {
  if (settings) return settings

  const vscode = getVscode()

  return new Promise<Settings>(resolve => {
    const onMessage = (event: MessageEvent<GetSettingsMessage>) => {
      const message = event.data

      if (message.type === MESSAGE_TYPE.GET_SETTINGS && message.payload) {
        window.removeEventListener('message', onMessage)
        settings = message.payload
        resolve(settings)
      }
    }

    window.addEventListener('message', onMessage)

    vscode.postMessage({ type: MESSAGE_TYPE.GET_SETTINGS })
  })
}

export function getVscode(): VSCodeApi {
  if (window.__vscode__) {
    return window.__vscode__
  }

  const vscode = acquireVsCodeApi()
  window.__vscode__ = vscode
  return vscode
}

export function generateMarkdown(issue: MinimalIssue): string {
  return matter.stringify(issue.body, {
    title: issue.title,
    number: `#${issue.number}`,
    link: issue.url,
    created_at: dayjs(issue.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    updated_at: dayjs(issue.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    labels: issue.labels.map(({ name }) => name),
  })
}

export function checkFileSize(file: File): boolean {
  const isLt2M = file.size / 1024 / 1024 < 2
  return isLt2M
}

export function openExternalLink(url: string): void {
  const vscode = getVscode()
  vscode.postMessage({
    type: MESSAGE_TYPE.OPEN_EXTERNAL_LINK,
    externalLink: url,
  })
}

export function setupExternalLinkInterceptor(): void {
  const originalWindowOpen = window.open

  const httpRegex = /^https?:\/\//

  // 正式环境下 sanbox 未设置 allow-popups，不能直接使用 window.open 打开链接
  window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
    if (typeof url === 'string' && httpRegex.test(url)) {
      openExternalLink(url)
      return null
    }

    // fallback
    return originalWindowOpen.call(window, url, target, features)
  }

  // 开发环境下点击连接，避免打开新页面
  if (VITE_DEV) {
    document.addEventListener('click', event => {
      const anchor = (event.target as HTMLElement).closest('a[href]')
      if (anchor instanceof HTMLAnchorElement && httpRegex.test(anchor.href)) {
        event.preventDefault()
        openExternalLink(anchor.href)
      }
    })
  }
}
