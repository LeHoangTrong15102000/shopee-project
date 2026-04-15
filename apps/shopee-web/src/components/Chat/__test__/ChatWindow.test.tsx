import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatWindow from '../ChatWindow'

const mockJoinChat = vi.fn()
const mockLeaveChat = vi.fn()
const mockSendMessage = vi.fn()
const mockStartTyping = vi.fn()
const mockStopTyping = vi.fn()

let mockChatState = {
  messages: [],
  currentChatId: null as string | null,
  isLoading: false,
  isConnected: true,
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        defaultSeller: 'Default Seller',
        'status.connecting': 'Connecting',
        'status.noConnection': 'No Connection',
        'status.online': 'Online',
        'button.minimize': 'Minimize',
        'button.close': 'Close',
      }
      return translations[key] || key
    },
  }),
}))

vi.mock('src/hooks/useChat', () => ({
  default: () => ({
    messages: mockChatState.messages,
    currentChatId: mockChatState.currentChatId,
    isLoading: mockChatState.isLoading,
    isConnected: mockChatState.isConnected,
    joinChat: mockJoinChat,
    leaveChat: mockLeaveChat,
    sendMessage: mockSendMessage,
  }),
}))

vi.mock('src/hooks/useTypingIndicator', () => ({
  default: () => ({
    typingUsers: [],
    startTyping: mockStartTyping,
    stopTyping: mockStopTyping,
  }),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, title, animated }: any) => (
    <button onClick={onClick} className={className} title={title}>
      {children}
    </button>
  ),
}))

vi.mock('../MessageList', () => ({
  default: ({ messages, isLoading, currentUserId }: any) => (
    <div data-testid="message-list">
      MessageList: {messages.length} messages, loading: {isLoading ? 'yes' : 'no'}, userId:{' '}
      {currentUserId || 'none'}
    </div>
  ),
}))

vi.mock('../MessageInput', () => ({
  default: ({ onSendMessage, onTypingStart, onTypingStop, disabled }: any) => (
    <div data-testid="message-input">
      <button onClick={() => onSendMessage('test')}>Send</button>
      <button onClick={onTypingStart}>Start Typing</button>
      <button onClick={onTypingStop}>Stop Typing</button>
      <span data-testid="input-disabled">Disabled: {disabled ? 'yes' : 'no'}</span>
    </div>
  ),
}))

vi.mock('../TypingIndicator', () => ({
  default: ({ typingUsers }: any) => (
    <div data-testid="typing-indicator">Typing: {typingUsers.length}</div>
  ),
}))

describe('ChatWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChatState = {
      messages: [],
      currentChatId: null,
      isLoading: false,
      isConnected: true,
    }
  })

  describe('Minimized State', () => {
    it('renders minimized chat button by default', () => {
      render(<ChatWindow />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('rounded-full')
    })

    it('shows chat icon in minimized state', () => {
      render(<ChatWindow />)
      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('h-6', 'w-6', 'text-white')
    })

    it('expands chat window when minimized button is clicked', () => {
      render(<ChatWindow />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(screen.getByText('Default Seller')).toBeInTheDocument()
    })
  })

  describe('Expanded State', () => {
    it('displays seller name when provided', () => {
      render(<ChatWindow sellerName="Shop ABC" />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(screen.getByText('Shop ABC')).toBeInTheDocument()
    })

    it('displays default seller name when not provided', () => {
      render(<ChatWindow />)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(screen.getByText('Default Seller')).toBeInTheDocument()
    })

    it('renders chat window with correct structure', () => {
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-list')).toBeInTheDocument()
      expect(screen.getByTestId('message-input')).toBeInTheDocument()
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })

    it('passes currentUserId to MessageList', () => {
      render(<ChatWindow currentUserId="user123" />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText(/userId: user123/)).toBeInTheDocument()
    })

    it('passes messages to MessageList', () => {
      mockChatState.messages = [
        { id: '1', text: 'Hello' },
        { id: '2', text: 'World' },
      ] as any
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText(/MessageList: 2 messages/)).toBeInTheDocument()
    })

    it('passes isLoading to MessageList', () => {
      mockChatState.isLoading = true
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText(/loading: yes/)).toBeInTheDocument()
    })
  })

  describe('Connection Status', () => {
    it('shows online status when connected', () => {
      mockChatState.isConnected = true
      mockChatState.isLoading = false
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('shows connecting status when loading', () => {
      mockChatState.isLoading = true
      mockChatState.isConnected = false
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Connecting')).toBeInTheDocument()
    })

    it('shows no connection status when not connected', () => {
      mockChatState.isLoading = false
      mockChatState.isConnected = false
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('No Connection')).toBeInTheDocument()
    })

    it('displays green status indicator when online', () => {
      mockChatState.isConnected = true
      mockChatState.isLoading = false
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const statusDot = screen.getByText('Online').previousElementSibling
      expect(statusDot).toHaveClass('bg-green-400')
    })

    it('displays yellow status indicator when connecting', () => {
      mockChatState.isLoading = true
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const statusDot = screen.getByText('Connecting').previousElementSibling
      expect(statusDot).toHaveClass('bg-yellow-400')
    })

    it('displays red status indicator when disconnected', () => {
      mockChatState.isConnected = false
      mockChatState.isLoading = false
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const statusDot = screen.getByText('No Connection').previousElementSibling
      expect(statusDot).toHaveClass('bg-red-400')
    })
  })

  describe('Chat Actions', () => {
    it('joins chat when expanded with conversationId and connected', () => {
      mockChatState.isConnected = true
      render(<ChatWindow conversationId="conv123" />)
      fireEvent.click(screen.getByRole('button'))

      expect(mockJoinChat).toHaveBeenCalledWith('conv123')
    })

    it('does not join chat when minimized', () => {
      render(<ChatWindow conversationId="conv123" />)
      expect(mockJoinChat).not.toHaveBeenCalled()
    })

    it('does not join chat when not connected', () => {
      mockChatState.isConnected = false
      render(<ChatWindow conversationId="conv123" />)
      fireEvent.click(screen.getByRole('button'))

      expect(mockJoinChat).not.toHaveBeenCalled()
    })

    it('minimizes chat window when minimize button is clicked', () => {
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const minimizeButton = screen.getByTitle('Minimize')
      fireEvent.click(minimizeButton)

      expect(screen.queryByText('Default Seller')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('rounded-full')
    })

    it('closes chat and leaves when close button is clicked with active chat', () => {
      mockChatState.currentChatId = 'chat123'
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const closeButton = screen.getByTitle('Close')
      fireEvent.click(closeButton)

      expect(mockLeaveChat).toHaveBeenCalled()
      expect(screen.queryByText('Default Seller')).not.toBeInTheDocument()
    })

    it('closes chat without leaving when no active chat', () => {
      mockChatState.currentChatId = null
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const closeButton = screen.getByTitle('Close')
      fireEvent.click(closeButton)

      expect(mockLeaveChat).not.toHaveBeenCalled()
    })

    it('leaves chat on unmount when chat is active', () => {
      mockChatState.currentChatId = 'chat123'
      const { unmount } = render(<ChatWindow conversationId="conv123" />)
      fireEvent.click(screen.getByRole('button'))

      unmount()
      expect(mockLeaveChat).toHaveBeenCalled()
    })

    it('does not leave chat on unmount when no active chat', () => {
      mockChatState.currentChatId = null
      const { unmount } = render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      unmount()
      expect(mockLeaveChat).not.toHaveBeenCalled()
    })
  })

  describe('Message Input', () => {
    it('disables message input when not connected', () => {
      mockChatState.isConnected = false
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('input-disabled')).toHaveTextContent('Disabled: yes')
    })

    it('enables message input when connected', () => {
      mockChatState.isConnected = true
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('input-disabled')).toHaveTextContent('Disabled: no')
    })

    it('passes sendMessage handler to MessageInput', () => {
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      const sendButton = screen.getByText('Send')
      fireEvent.click(sendButton)

      expect(mockSendMessage).toHaveBeenCalledWith('test')
    })

    it('passes typing handlers to MessageInput', () => {
      render(<ChatWindow />)
      fireEvent.click(screen.getByRole('button'))

      fireEvent.click(screen.getByText('Start Typing'))
      expect(mockStartTyping).toHaveBeenCalled()

      fireEvent.click(screen.getByText('Stop Typing'))
      expect(mockStopTyping).toHaveBeenCalled()
    })
  })

  describe('Toggle Behavior', () => {
    it('toggles between minimized and expanded states', () => {
      render(<ChatWindow />)

      // Initially minimized
      expect(screen.getByRole('button')).toHaveClass('rounded-full')

      // Expand
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Default Seller')).toBeInTheDocument()

      // Minimize
      fireEvent.click(screen.getByTitle('Minimize'))
      expect(screen.queryByText('Default Seller')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('rounded-full')
    })

    it('maintains state through multiple toggles', () => {
      render(<ChatWindow sellerName="Test Shop" />)

      // Expand
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Test Shop')).toBeInTheDocument()

      // Minimize
      fireEvent.click(screen.getByTitle('Minimize'))

      // Expand again
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Test Shop')).toBeInTheDocument()
    })
  })
})
