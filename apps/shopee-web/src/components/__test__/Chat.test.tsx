import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chat from '../Chat'

const mockJoinChat = vi.fn()
const mockLeaveChat = vi.fn()
const mockSendMessage = vi.fn()
const mockStartTyping = vi.fn()
const mockStopTyping = vi.fn()

let mockChatState = {
  messages: [] as any[],
  currentChatId: null as string | null,
  isLoading: false,
  isConnected: true,
}

let mockTypingState = {
  typingUsers: [] as string[],
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
    typingUsers: mockTypingState.typingUsers,
    startTyping: mockStartTyping,
    stopTyping: mockStopTyping,
  }),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, title }: any) => (
    <button onClick={onClick} className={className} title={title}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/Chat/MessageList', () => ({
  default: ({ messages, isLoading, currentUserId }: any) => (
    <div data-testid="message-list">
      {messages.length === 0 && !isLoading && <div data-testid="empty-state">No messages</div>}
      {isLoading && <div data-testid="loading-state">Loading messages...</div>}
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.text}
        </div>
      ))}
      <span data-testid="current-user-id">{currentUserId || 'none'}</span>
    </div>
  ),
}))

vi.mock('src/components/Chat/MessageInput', () => ({
  default: ({ onSendMessage, onTypingStart, onTypingStop, disabled }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="message-input-field"
        placeholder="Type a message"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value) onTypingStart()
          else onTypingStop()
        }}
      />
      <button
        data-testid="send-button"
        onClick={() => onSendMessage('test message')}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  ),
}))

vi.mock('src/components/Chat/TypingIndicator', () => ({
  default: ({ typingUsers }: any) => (
    <div data-testid="typing-indicator">
      {typingUsers.length > 0 && (
        <span data-testid="typing-users">{typingUsers.join(', ')} typing...</span>
      )}
    </div>
  ),
}))

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChatState = {
      messages: [],
      currentChatId: null,
      isLoading: false,
      isConnected: true,
    }
    mockTypingState = {
      typingUsers: [],
    }
  })

  describe('Rendering', () => {
    it('renders chat container in minimized state by default', () => {
      render(<Chat />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('rounded-full')
    })

    it('renders chat icon in minimized button', () => {
      render(<Chat />)
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('h-6', 'w-6', 'text-white')
    })

    it('renders expanded chat window when toggled', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-list')).toBeInTheDocument()
      expect(screen.getByTestId('message-input')).toBeInTheDocument()
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })

    it('renders seller name in header', () => {
      render(<Chat sellerName="Test Shop" />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Test Shop')).toBeInTheDocument()
    })

    it('renders default seller name when not provided', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Default Seller')).toBeInTheDocument()
    })

    it('renders minimize and close buttons in header', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTitle('Minimize')).toBeInTheDocument()
      expect(screen.getByTitle('Close')).toBeInTheDocument()
    })
  })

  describe('Message List Rendering', () => {
    it('renders empty message list', () => {
      mockChatState.messages = []
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('No messages')).toBeInTheDocument()
    })

    it('renders multiple messages', () => {
      mockChatState.messages = [
        { id: '1', text: 'Hello', senderId: 'user1' },
        { id: '2', text: 'How are you?', senderId: 'user2' },
        { id: '3', text: 'Fine, thanks!', senderId: 'user1' },
      ]
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-1')).toHaveTextContent('Hello')
      expect(screen.getByTestId('message-2')).toHaveTextContent('How are you?')
      expect(screen.getByTestId('message-3')).toHaveTextContent('Fine, thanks!')
    })

    it('passes currentUserId to message list', () => {
      render(<Chat currentUserId="user123" />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('current-user-id')).toHaveTextContent('user123')
    })

    it('shows none when currentUserId is not provided', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('current-user-id')).toHaveTextContent('none')
    })
  })

  describe('Input Field Rendering', () => {
    it('renders message input field', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-input-field')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type a message')).toBeInTheDocument()
    })

    it('renders send button', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('send-button')).toBeInTheDocument()
      expect(screen.getByText('Send')).toBeInTheDocument()
    })

    it('enables input when connected', () => {
      mockChatState.isConnected = true
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const input = screen.getByTestId('message-input-field')
      expect(input).not.toBeDisabled()
    })

    it('disables input when not connected', () => {
      mockChatState.isConnected = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const input = screen.getByTestId('message-input-field')
      expect(input).toBeDisabled()
    })

    it('disables send button when not connected', () => {
      mockChatState.isConnected = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const sendButton = screen.getByTestId('send-button')
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Send Message Functionality', () => {
    it('sends message when send button is clicked', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const sendButton = screen.getByTestId('send-button')
      fireEvent.click(sendButton)

      expect(mockSendMessage).toHaveBeenCalledWith('test message')
    })

    it('does not send message when disconnected', () => {
      mockChatState.isConnected = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const sendButton = screen.getByTestId('send-button')
      expect(sendButton).toBeDisabled()
    })

    it('triggers typing start when user types', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const input = screen.getByTestId('message-input-field')
      fireEvent.change(input, { target: { value: 'Hello' } })

      expect(mockStartTyping).toHaveBeenCalled()
    })

    it('triggers typing stop when input is cleared', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const input = screen.getByTestId('message-input-field')
      // First type something to set isTypingRef.current = true
      fireEvent.change(input, { target: { value: 'Hello' } })
      // Then clear the input
      fireEvent.change(input, { target: { value: '' } })

      expect(mockStopTyping).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('shows loading state in message list', () => {
      mockChatState.isLoading = true
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('loading-state')).toBeInTheDocument()
      expect(screen.getByText('Loading messages...')).toBeInTheDocument()
    })

    it('shows connecting status when loading', () => {
      mockChatState.isLoading = true
      mockChatState.isConnected = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Connecting')).toBeInTheDocument()
    })

    it('displays yellow status indicator when connecting', () => {
      mockChatState.isLoading = true
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const statusDot = screen.getByText('Connecting').previousElementSibling
      expect(statusDot).toHaveClass('bg-yellow-400')
    })

    it('hides loading state when messages are loaded', () => {
      mockChatState.isLoading = false
      mockChatState.messages = [{ id: '1', text: 'Hello' }]
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no messages and not loading', () => {
      mockChatState.messages = []
      mockChatState.isLoading = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('hides empty state when loading', () => {
      mockChatState.messages = []
      mockChatState.isLoading = true
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })

    it('hides empty state when messages exist', () => {
      mockChatState.messages = [{ id: '1', text: 'Hello' }]
      mockChatState.isLoading = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })

  describe('Conditional Rendering Branches', () => {
    it('renders minimized view when isMinimized is true', () => {
      render(<Chat />)

      expect(screen.getByRole('button')).toHaveClass('rounded-full')
      expect(screen.queryByTestId('message-list')).not.toBeInTheDocument()
    })

    it('renders expanded view when isMinimized is false', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-list')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /rounded-full/ })).not.toBeInTheDocument()
    })

    it('shows online status when connected and not loading', () => {
      mockChatState.isConnected = true
      mockChatState.isLoading = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('shows no connection status when disconnected', () => {
      mockChatState.isConnected = false
      mockChatState.isLoading = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('No Connection')).toBeInTheDocument()
    })

    it('displays green indicator when online', () => {
      mockChatState.isConnected = true
      mockChatState.isLoading = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const statusDot = screen.getByText('Online').previousElementSibling
      expect(statusDot).toHaveClass('bg-green-400')
    })

    it('displays red indicator when disconnected', () => {
      mockChatState.isConnected = false
      mockChatState.isLoading = false
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const statusDot = screen.getByText('No Connection').previousElementSibling
      expect(statusDot).toHaveClass('bg-red-400')
    })

    it('shows typing indicator when users are typing', () => {
      mockTypingState.typingUsers = ['User1', 'User2']
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('typing-users')).toHaveTextContent('User1, User2 typing...')
    })

    it('hides typing indicator when no users are typing', () => {
      mockTypingState.typingUsers = []
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.queryByTestId('typing-users')).not.toBeInTheDocument()
    })
  })

  describe('Chat Actions', () => {
    it('joins chat when expanded with conversationId', () => {
      mockChatState.isConnected = true
      render(<Chat conversationId="conv123" />)
      fireEvent.click(screen.getByRole('button'))

      expect(mockJoinChat).toHaveBeenCalledWith('conv123')
    })

    it('does not join chat when minimized', () => {
      render(<Chat conversationId="conv123" />)

      expect(mockJoinChat).not.toHaveBeenCalled()
    })

    it('does not join chat when not connected', () => {
      mockChatState.isConnected = false
      render(<Chat conversationId="conv123" />)
      fireEvent.click(screen.getByRole('button'))

      expect(mockJoinChat).not.toHaveBeenCalled()
    })

    it('minimizes chat when minimize button is clicked', () => {
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const minimizeButton = screen.getByTitle('Minimize')
      fireEvent.click(minimizeButton)

      expect(screen.queryByText('Default Seller')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('rounded-full')
    })

    it('closes and leaves chat when close button is clicked with active chat', () => {
      mockChatState.currentChatId = 'chat123'
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const closeButton = screen.getByTitle('Close')
      fireEvent.click(closeButton)

      expect(mockLeaveChat).toHaveBeenCalled()
      expect(screen.queryByText('Default Seller')).not.toBeInTheDocument()
    })

    it('closes without leaving when no active chat', () => {
      mockChatState.currentChatId = null
      render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      const closeButton = screen.getByTitle('Close')
      fireEvent.click(closeButton)

      expect(mockLeaveChat).not.toHaveBeenCalled()
    })

    it('leaves chat on unmount when chat is active', () => {
      mockChatState.currentChatId = 'chat123'
      const { unmount } = render(<Chat conversationId="conv123" />)
      fireEvent.click(screen.getByRole('button'))

      unmount()
      expect(mockLeaveChat).toHaveBeenCalled()
    })

    it('does not leave chat on unmount when no active chat', () => {
      mockChatState.currentChatId = null
      const { unmount } = render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      unmount()
      expect(mockLeaveChat).not.toHaveBeenCalled()
    })
  })

  describe('Toggle Behavior', () => {
    it('toggles between minimized and expanded states', () => {
      render(<Chat />)

      // Initially minimized
      expect(screen.getByRole('button')).toHaveClass('rounded-full')

      // Expand
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Default Seller')).toBeInTheDocument()

      // Minimize
      fireEvent.click(screen.getByTitle('Minimize'))
      expect(screen.queryByText('Default Seller')).not.toBeInTheDocument()
    })

    it('maintains state through multiple toggles', () => {
      render(<Chat sellerName="Test Shop" />)

      // Expand
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Test Shop')).toBeInTheDocument()

      // Minimize
      fireEvent.click(screen.getByTitle('Minimize'))

      // Expand again
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Test Shop')).toBeInTheDocument()
    })

    it('re-expands to same state after minimize', () => {
      mockChatState.messages = [{ id: '1', text: 'Hello' }]
      render(<Chat />)

      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByTestId('message-1')).toBeInTheDocument()

      fireEvent.click(screen.getByTitle('Minimize'))
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-1')).toBeInTheDocument()
    })
  })

  describe('Connection Status Display', () => {
    it('updates status when connection changes', () => {
      mockChatState.isConnected = true
      const { rerender } = render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Online')).toBeInTheDocument()

      mockChatState.isConnected = false
      rerender(<Chat />)

      expect(screen.getByText('No Connection')).toBeInTheDocument()
    })

    it('shows all three connection states correctly', () => {
      // Online
      mockChatState.isConnected = true
      mockChatState.isLoading = false
      const { rerender } = render(<Chat />)
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Online')).toBeInTheDocument()

      // Connecting
      mockChatState.isLoading = true
      rerender(<Chat />)
      expect(screen.getByText('Connecting')).toBeInTheDocument()

      // Disconnected
      mockChatState.isLoading = false
      mockChatState.isConnected = false
      rerender(<Chat />)
      expect(screen.getByText('No Connection')).toBeInTheDocument()
    })
  })

  describe('Message Updates', () => {
    it('updates message list when new messages arrive', () => {
      mockChatState.messages = [{ id: '1', text: 'Hello' }]
      const { rerender } = render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('message-1')).toBeInTheDocument()

      mockChatState.messages = [
        { id: '1', text: 'Hello' },
        { id: '2', text: 'World' },
      ]
      rerender(<Chat />)

      expect(screen.getByTestId('message-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-2')).toBeInTheDocument()
    })

    it('transitions from empty to populated state', () => {
      mockChatState.messages = []
      const { rerender } = render(<Chat />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()

      mockChatState.messages = [{ id: '1', text: 'First message' }]
      rerender(<Chat />)

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
      expect(screen.getByTestId('message-1')).toBeInTheDocument()
    })
  })
})
