import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import ConversationHistory from '../User/pages/ConversationHistory/ConversationHistory'

vi.mock('src/apis/shopChat.api', () => ({
  default: {
    getConversations: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            conversations: [],
          },
        },
      }),
    ),
  },
}))

vi.mock('src/components/SEO', () => ({
  default: ({ title }: any) => <title>{title}</title>,
}))

vi.mock('src/components/Chat/ChatWindow', () => ({
  default: () => <div data-testid="chat-window" />,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    )
}

describe('ConversationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders conversation history page heading', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(ConversationHistory), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Chat with Shops')).toBeInTheDocument()
    })
  })

  it('displays page description', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(ConversationHistory), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Your conversation history with shops')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    const Wrapper = createWrapper()
    render(React.createElement(ConversationHistory), { wrapper: Wrapper })

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows empty state when no conversations', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(ConversationHistory), { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    })
  })
})
