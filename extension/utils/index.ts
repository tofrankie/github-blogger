import { Uri, workspace } from 'vscode'

import { EXTENSION_NAME } from '@/constants'

/**
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 * @return A nonce
 */
export function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * A helper function which will get the webview URI of a given file or resource.
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @return A URI pointing to the file/resource
 */
export function getUri(webview, extensionUri, pathList) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
}

function getSettingValue<K extends SettingKey>(key: K): Settings[K] {
  return workspace.getConfiguration(EXTENSION_NAME).get<Settings[K]>(key) ?? ''
}

export function checkSettings() {
  const token = getSettingValue('token')
  const user = getSettingValue('user')
  const repo = getSettingValue('repo')
  return Boolean(token && user && repo)
}

let settings: Settings

const DEFAULT_BRANCH = 'main'

export function getSettings(): Settings {
  if (settings) return settings

  const token = getSettingValue('token')
  const user = getSettingValue('user')
  const repo = getSettingValue('repo')
  const branch = getSettingValue('branch') || DEFAULT_BRANCH

  settings = { token, user, repo, branch }
  return settings
}

export function cdnURL({
  user,
  repo,
  branch,
  filePath,
}: {
  user: string
  repo: string
  branch: string
  filePath: string
}) {
  const tag = branch ? `@${branch}` : ''
  return `https://cdn.jsdelivr.net/gh/${user}/${repo}${tag}/${filePath}`
}

export async function to<T, U = Error>(
  promise: Promise<T>,
  errorExt?: object
): Promise<ResultTuple<T, U>> {
  try {
    const data = await promise
    const result: [null, T] = [null, data]
    console.log('🚀 ~ extension ~ to ~ data:', data)
    return result
  } catch (err) {
    console.log('🚀 ~ extension ~ to ~ err:', err)
    if (errorExt) {
      Object.assign(err as object, errorExt)
    }
    const resultWithError: [U, null] = [err as U, null]
    return resultWithError
  }
}
