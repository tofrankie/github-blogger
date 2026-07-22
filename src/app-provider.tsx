import type { ColorMode } from '~/types'
import { BaseStyles, ThemeProvider } from '@primer/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'
import App from '@/app'
import { ToastProvider } from '@/providers/toast-provider'
import { getSettings } from '@/utils'
import { COLOR_MODE, SETTING_KEY } from '~/constants'

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

export default function AppProvider() {
  const [colorMode, setColorMode] = useState<ColorMode>(COLOR_MODE.SYSTEM)
  const [systemColorMode, setSystemColorMode] = useState(getSystemColorMode)
  const resolvedColorMode = colorMode === COLOR_MODE.SYSTEM ? systemColorMode : colorMode

  useEffect(() => {
    let mounted = true

    void getSettings().then(settings => {
      if (!mounted) return
      setColorMode(settings[SETTING_KEY.COLOR_MODE])
    })

    const observer = new MutationObserver(() => {
      setSystemColorMode(getSystemColorMode())
    })

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-vscode-theme-kind'],
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
      <ThemeProvider colorMode={resolvedColorMode} dayScheme="light" nightScheme="dark">
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

type ThemeKind = 'vscode-light' | 'vscode-dark'

function getSystemColorMode(): typeof COLOR_MODE.LIGHT | typeof COLOR_MODE.DARK {
  if (document.body?.classList.contains('vscode-dark')) {
    return COLOR_MODE.DARK
  }

  const themeKind = document.body?.dataset?.vscodeThemeKind as ThemeKind | undefined

  if (themeKind === 'vscode-dark') {
    return COLOR_MODE.DARK
  }

  return COLOR_MODE.LIGHT
}
