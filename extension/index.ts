import * as vscode from 'vscode'
import type {ExtensionContext} from 'vscode'

import EditPanel, {getWebviewOptions} from './panels/edit-panel'
import MultiSelectInput from './panels/multi-select-input'
import {checkSettings} from './utils'
import {EXTENSION_COMMAND} from './constants'

export function activate(context: ExtensionContext) {
  const disposableOpen = vscode.commands.registerCommand(EXTENSION_COMMAND.OPEN, async () => {
    if (!(await checkSettings())) {
      return MultiSelectInput(context)
    }

    EditPanel.render(context)
  })

  const disposableConfig = vscode.commands.registerCommand(EXTENSION_COMMAND.CONFIGURE, () => {
    MultiSelectInput(context)
  })

  context.subscriptions.push(disposableOpen, disposableConfig)

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(EditPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri)
        EditPanel.revive(webviewPanel, context)
      },
    })
  }
}
