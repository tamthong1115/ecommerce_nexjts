'use client'

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 1 minute (prevents immediate refetching)
        staleTime: 60 * 1000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) {
    // Server: Always make a new query client
    return makeQueryClient()
  } else {
    // Browser: Make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React suspends
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may suspend
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
  {/* DevTools will only show in development environment */}
  <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
}