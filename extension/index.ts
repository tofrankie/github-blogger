import type { ExtensionContext } from 'vscode'
import { commands, window } from 'vscode'

import { EXTENSION_COMMAND } from './constants'
import EditPanel, { getWebviewOptions } from './panels/edit-panel'
import MultiSelectInput from './panels/multi-select-input'
import { checkSettings } from './utils'

export function activate(context: ExtensionContext) {
  const disposableOpen = commands.registerCommand(EXTENSION_COMMAND.OPEN, async () => {
    if (!checkSettings()) {
      return MultiSelectInput(context)
    }

    EditPanel.render(context)
  })

  const disposableConfig = commands.registerCommand(EXTENSION_COMMAND.CONFIGURE, () => {
    MultiSelectInput(context)
  })

  context.subscriptions.push(disposableOpen, disposableConfig)

  if (window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    window.registerWebviewPanelSerializer(EditPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri)
        EditPanel.revive(webviewPanel, context)
      },
    })
  }
}
