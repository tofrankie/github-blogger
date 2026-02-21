import type { Disposable, ExtensionContext, Webview } from 'vscode'
import { getWebviewHtml } from 'virtual:vscode'
import { env, Uri } from 'vscode'
import { MESSAGE_TYPE } from '@/constants'
import { getSettings } from '@/utils'

export class WebviewHelper {
  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   * @param webview
   * @param context
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   */
  public static setupHtml(webview: Webview, context: ExtensionContext) {
    return getWebviewHtml({
      serverUrl: process.env.VITE_DEV_SERVER_URL,
      webview,
      context,
    })
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   * @param webview
   * @param disposables
   */
  public static setupWebviewHooks(webview: Webview, disposables: Disposable[]) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const { command, externalLink } = message

        switch (command) {
          case MESSAGE_TYPE.OPEN_EXTERNAL_LINK:
            void env.openExternal(Uri.parse(externalLink))
            break

          case MESSAGE_TYPE.GET_SETTINGS: {
            const settings = getSettings()
            webview.postMessage({
              command: MESSAGE_TYPE.GET_SETTINGS,
              payload: settings,
            })

            break
          }

          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)

          default:
        }
      },
      undefined,
      disposables
    )
  }
}
