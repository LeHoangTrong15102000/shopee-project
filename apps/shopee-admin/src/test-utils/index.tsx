import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

export function createQueryWrapper() {
  const queryClient = createTestQueryClient()
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries']
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    user: userEvent.setup(),
  }
}
