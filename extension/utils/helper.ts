import type { ExtensionContext, Webview } from 'vscode'
import { getWebviewHtml } from 'virtual:vscode'

export class WebviewHelper {
  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   * @param webview
   * @param context
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   */
  public static setupHtml(webview: Webview, context: ExtensionContext): string {
    return getWebviewHtml({
      serverUrl: process.env.VITE_DEV_SERVER_URL,
      webview,
      context,
    })
  }
}
