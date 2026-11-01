'use client'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {useState} from 'react'

/**
 * Created in state, not at module scope: a module-level client is shared
 * between requests on the server and would leak one user's cache into
 * another's. Single-user today, but the bug is silent and permanent.
 */
export function Providers({children}: {children: React.ReactNode}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /** Ingredients change rarely; refetching on focus is noise. */
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
