import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode'
import { commands, Uri, ViewColumn, window } from 'vscode'

import Server from '@/server'
import { WebviewHelper } from '@/utils/helper'

export function getWebviewOptions(extensionUri: Uri) {
  return {
    // Enable javascript in the webview
    enableScripts: true,
    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [Uri.joinPath(extensionUri, 'dist')],
    // Controls if the find widget is enabled in the panel.
    enableFindWidget: true,
    // Controls if the webview panel's content (iframe) is kept around even when the panel is no longer visible.
    retainContextWhenHidden: true,
  }
}

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export default class EditPanel {
  public static currentPanel: EditPanel | undefined

  public static readonly viewType = 'EditPanel'

  private readonly _context: ExtensionContext

  private readonly _panel: WebviewPanel

  private _disposables: Disposable[] = []

  private _server: Server

  /**
   * The EditPanel class private constructor (called only from the render method).
   * @param panel A reference to the webview panel
   * @param context A reference to the extension context
   */
  constructor(panel: WebviewPanel, context: ExtensionContext) {
    this._panel = panel
    this._context = context
    this._server = new Server(panel.webview)

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(
      () => {
        this.dispose()
      },
      null,
      this._disposables
    )

    // Set the HTML content for the webview panel
    this._panel.webview.html = WebviewHelper.setupHtml(this._panel.webview, context)

    // Set an event listener to listen for messages passed from the webview context
    WebviewHelper.setupWebviewHooks(this._panel.webview, this._disposables)
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   * @param context A reference to the extension context
   */
  static render(context: ExtensionContext) {
    const { extensionUri } = context

    // If the webview panel already exists reveal it
    if (EditPanel.currentPanel) {
      EditPanel.currentPanel._panel.reveal(ViewColumn.One)
      return
    }

    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined

    // If a webview panel does not already exist create and show a new one
    const panel = window.createWebviewPanel(
      EditPanel.viewType,
      'Blogger',
      column || ViewColumn.One,
      getWebviewOptions(extensionUri)
    )

    panel.iconPath = Uri.joinPath(extensionUri, 'images/icon.png')

    EditPanel.currentPanel = new EditPanel(panel, context)

    commands.executeCommand('workbench.action.closeSidebar')
    commands.executeCommand('workbench.action.closePanel')
  }

  static revive(panel: WebviewPanel, context: ExtensionContext) {
    EditPanel.currentPanel = new EditPanel(panel, context)
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  dispose() {
    EditPanel.currentPanel = undefined

    // Dispose of the current webview panel
    this._panel.dispose()

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length > 0) {
      const disposable: any = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
