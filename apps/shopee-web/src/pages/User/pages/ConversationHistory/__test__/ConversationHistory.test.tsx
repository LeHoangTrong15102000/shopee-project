import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ConversationHistory from '../ConversationHistory'
import React from 'react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}))

const mockConversations = [
  {
    _id: 'conv-1',
    title: 'Conversation 1',
    status: 'active',
    lastActivity: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'conv-2',
    title: 'Conversation 2',
    status: 'archived',
    lastActivity: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]
let mockGetConversations = vi.fn(() =>
  Promise.resolve({ data: { data: { conversations: mockConversations } } }),
)
const mockDeleteConversation = vi.fn(() => Promise.resolve())

vi.mock('src/apis/chatbot.api', () => ({
  default: {
    getConversations: (...args: any[]) => mockGetConversations(...args),
    deleteConversation: (...args: any[]) => mockDeleteConversation(...args),
  },
}))

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

  it('should render conversations list', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument()
      expect(screen.getByText('Conversation 2')).toBeInTheDocument()
    })
  })

  it('should show empty state when no conversations', async () => {
    mockGetConversations = vi.fn(() => Promise.resolve({ data: { data: { conversations: [] } } }))
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Chưa có cuộc hội thoại nào')).toBeInTheDocument()
    })
  })

  it('should show delete confirmation modal', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByLabelText(/Xóa hội thoại/)
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText('Xác nhận xóa')).toBeInTheDocument()
  })

  it('should close delete modal on cancel', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByLabelText(/Xóa hội thoại/)
    fireEvent.click(deleteButtons[0])
    const cancelButton = screen.getByText('Hủy')
    fireEvent.click(cancelButton)
    await waitFor(() => {
      expect(screen.queryByText('Xác nhận xóa')).not.toBeInTheDocument()
    })
  })

  it('should delete conversation on confirm', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument()
    })
    const deleteButtons = screen.getAllByLabelText(/Xóa hội thoại/)
    fireEvent.click(deleteButtons[0])
    const confirmButton = screen.getByText('Xóa')
    fireEvent.click(confirmButton)
    await waitFor(() => {
      expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1')
    })
  })

  it('should display conversation status', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()
      expect(screen.getByText('Đã lưu trữ')).toBeInTheDocument()
    })
  })

  it('should format date correctly', async () => {
    render(<ConversationHistory />, { wrapper })
    await waitFor(() => {
      const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/)
      expect(dateElements.length).toBeGreaterThan(0)
    })
  })
})
