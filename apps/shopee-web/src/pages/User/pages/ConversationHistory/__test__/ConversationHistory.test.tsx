import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ConversationHistory from '../ConversationHistory'
import React from 'react'

vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

vi.mock('src/components/Chat/ChatWindow', () => ({
  default: ({ sellerName }: any) => <div data-testid="chat-window">{sellerName}</div>,
}))

const mockConversations = [
  {
    _id: 'conv-1',
    shopId: 'shop-1',
    shopName: 'Test Shop 1',
    shopAvatar: '',
    lastMessage: 'Hello from shop 1',
    lastMessageAt: '2024-01-01T10:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  },
  {
    _id: 'conv-2',
    shopId: 'shop-2',
    shopName: 'Test Shop 2',
    shopAvatar: '',
    lastMessage: 'Hello from shop 2',
    lastMessageAt: '2024-01-02T10:00:00.000Z',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T10:00:00.000Z',
  },
]

let mockGetConversations = vi.fn(() =>
  Promise.resolve({ data: { data: { conversations: mockConversations } } }),
)

vi.mock('src/apis/shopChat.api', () => ({
  default: {
    getConversations: (...args: any[]) => mockGetConversations(...args),
    createConversation: vi.fn(() => Promise.resolve({ data: { data: mockConversations[0] } })),
    getMessages: vi.fn(() => Promise.resolve({ data: { data: { messages: [] } } })),
    sendMessage: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}))

describe('ConversationHistory', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
    mockGetConversations = vi.fn(() =>
      Promise.resolve({ data: { data: { conversations: mockConversations } } }),
    )
  })

  it('should render loading state', () => {
    mockGetConversations = vi.fn(() => new Promise(() => {}))
    render(<ConversationHistory />, { wrapper })
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render conversations list with shop names', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Test Shop 1')).toBeInTheDocument()
      expect(screen.getByText('Test Shop 2')).toBeInTheDocument()
    })
  })

  it('should show empty state when no conversations', async () => {
    mockGetConversations = vi.fn(() =>
      Promise.resolve({ data: { data: { conversations: [] } } }),
    )
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    })
  })

  it('should render last message preview', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Hello from shop 1')).toBeInTheDocument()
    })
  })

  it('should open ChatWindow when conversation is clicked', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Test Shop 1')).toBeInTheDocument()
    })
    const convButton = screen.getAllByRole('button')[0]
    fireEvent.click(convButton)
    await waitFor(() => {
      expect(screen.getByTestId('chat-window')).toBeInTheDocument()
    })
  })

  it('should close ChatWindow when close button is clicked', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Test Shop 1')).toBeInTheDocument()
    })
    const convButton = screen.getAllByRole('button')[0]
    fireEvent.click(convButton)
    await waitFor(() => {
      expect(screen.getByTestId('chat-window')).toBeInTheDocument()
    })
    const closeButton = screen.getByText('Close chat')
    fireEvent.click(closeButton)
    await waitFor(() => {
      expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument()
    })
  })
})
