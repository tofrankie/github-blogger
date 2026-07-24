// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import { createRoot } from 'react-dom/client'
import AppProvider from '@/app-provider'
import { setupExternalLinkInterceptor } from '@/utils'
import { initRpc } from '@/utils/rpc'

// for gray-matter
// eslint-disable-next-line node/prefer-global/buffer
window.Buffer = Buffer

const rpc = initRpc()

setupExternalLinkInterceptor()
window.addEventListener('unload', () => rpc.dispose(), { once: true })

const rootElem = document.getElementById('root')
if (rootElem) {
  const root = createRoot(rootElem)
  root.render(<AppProvider />)
}
