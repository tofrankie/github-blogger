import path from 'node:path'
import vscode from '@tomjs/vite-plugin-vscode'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vscode({
      extension: {
        sourcemap: 'inline',
      },
      webview: {
        csp: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`,
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
