import { BaseStyles, ThemeProvider } from '@primer/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from '@/app'
import { ToastProvider } from '@/providers/toast-provider'

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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
