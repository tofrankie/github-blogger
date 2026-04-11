import type { Plugin } from 'vite'
import path from 'node:path'
import vscode from '@tomjs/vite-plugin-vscode'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({}),
    webviewCssRelativeAssetUrls(),
    vscode({
      extension: {
        sourcemap: 'inline',
      },
      webview: {
        csp: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; font-src {{cspSource}} https: data:; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`,
      },
      devtools: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

// Fix: url(/assets/...) -> url(./assets/...)
function webviewCssRelativeAssetUrls(): Plugin {
  return {
    name: 'webview-css-relative-asset-urls',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'asset' || !item.fileName.endsWith('.css')) continue
        const { source } = item
        if (typeof source === 'string') {
          item.source = source.replace(/url\(\/assets\//g, 'url(./')
        } else if (source instanceof Uint8Array) {
          const text = new TextDecoder().decode(source)
          item.source = new TextEncoder().encode(text.replace(/url\(\/assets\//g, 'url(./'))
        }
      }
    },
  }
}
