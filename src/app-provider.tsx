import { BaseStyles, ThemeProvider } from '@primer/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'
import App from '@/app'
import { ToastProvider } from '@/providers/toast-provider'
import { getSettings } from '@/utils'
import { COLOR_MODE } from '~/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

type ThemeKind = 'vscode-light' | 'vscode-dark'

function getSystemColorMode(): typeof COLOR_MODE.LIGHT | typeof COLOR_MODE.DARK {
  const themeKind = (document.body?.dataset?.vscodeThemeKind ?? 'vscode-light') as ThemeKind

  if (themeKind === 'vscode-dark') {
    return COLOR_MODE.DARK
  }

  return COLOR_MODE.LIGHT
}

export default function AppProvider() {
  const [colorMode, setColorMode] = useState(COLOR_MODE.SYSTEM)
  const [systemColorMode, setSystemColorMode] = useState(getSystemColorMode)
  const resolvedColorMode = colorMode === COLOR_MODE.SYSTEM ? systemColorMode : colorMode
  const primerColorMode = colorMode === COLOR_MODE.SYSTEM ? 'auto' : colorMode

  useEffect(() => {
    let mounted = true

    void getSettings().then(settings => {
      if (!mounted) return
      setColorMode(settings['color-mode'])
    })

    const observer = new MutationObserver(() => {
      setSystemColorMode(getSystemColorMode())
    })

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-vscode-theme-kind'],
      })
    }

    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.colorScheme = resolvedColorMode

    return () => {
      document.documentElement.style.removeProperty('color-scheme')
    }
  }, [resolvedColorMode])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider colorMode={primerColorMode} dayScheme="light" nightScheme="dark">
        <BaseStyles>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BaseStyles>
      </ThemeProvider>
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  )
}
