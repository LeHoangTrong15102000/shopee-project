import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import userEvent from '@testing-library/user-event'
import { format } from 'date-fns'
import MessageList from 'src/components/Chat/MessageList'
import MessageItem from 'src/components/Chat/MessageItem'
import MessageInput from 'src/components/Chat/MessageInput'
import TypingIndicator from 'src/components/Chat/TypingIndicator'
import ConnectionStatus from 'src/components/ConnectionStatus/ConnectionStatus'
import OrderStatusTracker from 'src/components/OrderStatusTracker'
import ViewerCountBadge from 'src/components/ViewerCountBadge'
import CartSyncIndicator from 'src/components/CartSyncIndicator'
import OnlineIndicator from 'src/components/OnlineIndicator/OnlineIndicator'
import LivePriceTag from 'src/components/LivePriceTag/LivePriceTag'
import InventoryAlertBadge from 'src/components/InventoryAlertBadge/InventoryAlertBadge'
import LiveReviewFeed from 'src/components/LiveReviewFeed/LiveReviewFeed'
import LiveQASection from 'src/components/LiveQASection/LiveQASection'
import ActivityFeedWidget from 'src/components/ActivityFeedWidget/ActivityFeedWidget'
import SellerDashboardPanel from 'src/components/SellerDashboardPanel/SellerDashboardPanel'
import { AppContext } from 'src/contexts/app.context'
import { MessageReceivedPayload, UserTypingPayload, InventoryAlertPayload } from 'src/types/socket.types'

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn()

const mockConnect = vi.fn()
let mockConnectionStatus = 'connected'

vi.mock('src/hooks/useChat', () => ({
  default: () => ({ messages: [], currentChatId: null, isLoading: false, isConnected: true, joinChat: vi.fn(), leaveChat: vi.fn(), sendMessage: vi.fn() })
}))
vi.mock('src/hooks/useSocket', () => ({
  default: () => ({ connectionStatus: mockConnectionStatus, connect: mockConnect, isConnected: mockConnectionStatus === 'connected', disconnect: vi.fn(), emit: vi.fn(), on: vi.fn(), off: vi.fn(), socket: null })
}))
vi.mock('src/hooks/useTypingIndicator', () => ({
  default: () => ({ typingUsers: [], startTyping: vi.fn(), stopTyping: vi.fn() })
}))

let mockSellerDashboard = { metrics: { today_orders: 0, today_revenue: 0, pending_orders: 0, pending_qa: 0 }, orderNotifications: [] as any[], qaNotifications: [] as any[], isActive: false }
vi.mock('src/hooks/useSellerDashboard', () => ({
  default: () => mockSellerDashboard
}))

const createMessage = (overrides: Partial<MessageReceivedPayload> = {}): MessageReceivedPayload => ({
  _id: '1', chat_id: 'chat1', sender: { _id: 'user1', name: 'Seller', avatar: '' },
  content: 'Hello', message_type: 'text', status: 'sent', created_at: '2026-02-07T10:00:00Z', ...overrides
})

describe('WebSocket UI Components', () => {
  beforeEach(() => { vi.clearAllMocks(); mockConnectionStatus = 'connected' })

  describe('MessageList', () => {
    test('shows loading spinner when isLoading', () => {
      render(<MessageList messages={[]} isLoading={true} />)
      expect(screen.getByText('Đang tải tin nhắn...')).toBeInTheDocument()
    })

    test('shows empty message when no messages', () => {
      render(<MessageList messages={[]} isLoading={false} />)
      expect(screen.getByText('Chưa có tin nhắn')).toBeInTheDocument()
    })

    test('renders messages correctly', () => {
      const messages = [createMessage({ content: 'Test message' })]
      render(<MessageList messages={messages} isLoading={false} currentUserId='user2' />)
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  describe('MessageItem', () => {
    test('shows message content and formatted time', () => {
      const msg = createMessage({ content: 'Hello World' })
      render(<MessageItem message={msg} isSent={false} />)
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      const expectedTime = format(new Date(msg.created_at), 'HH:mm')
      expect(screen.getByText(expectedTime)).toBeInTheDocument()
    })

    test('shows sender name for received messages', () => {
      render(<MessageItem message={createMessage({ sender: { _id: 'other', name: 'John', avatar: '' } })} isSent={false} />)
      expect(screen.getByText('John')).toBeInTheDocument()
    })

    test('shows single check for sent status', () => {
      render(<MessageItem message={createMessage({ status: 'sent' })} isSent={true} />)
      expect(screen.getByText('✓')).toBeInTheDocument()
    })

    test('shows double check for delivered status', () => {
      render(<MessageItem message={createMessage({ status: 'delivered' })} isSent={true} />)
      expect(screen.getByText('✓✓')).toBeInTheDocument()
    })
  })

  describe('MessageInput', () => {
    test('has input field and disabled send button when empty', () => {
      render(<MessageInput onSendMessage={vi.fn()} onTypingStart={vi.fn()} onTypingStop={vi.fn()} />)
      expect(screen.getByPlaceholderText('Nhập tin nhắn...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    test('enables send button when input has text', async () => {
      const user = userEvent.setup()
      render(<MessageInput onSendMessage={vi.fn()} onTypingStart={vi.fn()} onTypingStop={vi.fn()} />)
      await user.type(screen.getByPlaceholderText('Nhập tin nhắn...'), 'Hello')
      expect(screen.getByRole('button')).not.toBeDisabled()
    })

    test('calls onSendMessage on Enter key', async () => {
      const onSendMessage = vi.fn()
      const user = userEvent.setup()
      render(<MessageInput onSendMessage={onSendMessage} onTypingStart={vi.fn()} onTypingStop={vi.fn()} />)
      const input = screen.getByPlaceholderText('Nhập tin nhắn...')
      await user.type(input, 'Hello{Enter}')
      expect(onSendMessage).toHaveBeenCalledWith('Hello')
    })

    test('calls onTypingStart when typing begins', async () => {
      const onTypingStart = vi.fn()
      const user = userEvent.setup()
      render(<MessageInput onSendMessage={vi.fn()} onTypingStart={onTypingStart} onTypingStop={vi.fn()} />)
      await user.type(screen.getByPlaceholderText('Nhập tin nhắn...'), 'H')
      expect(onTypingStart).toHaveBeenCalled()
    })

    test('disables input when disabled prop is true', () => {
      render(<MessageInput onSendMessage={vi.fn()} onTypingStart={vi.fn()} onTypingStop={vi.fn()} disabled={true} />)
      expect(screen.getByPlaceholderText('Nhập tin nhắn...')).toBeDisabled()
    })
  })

  describe('TypingIndicator', () => {
    test('shows nothing when empty array', () => {
      const { container } = render(<TypingIndicator typingUsers={[]} />)
      expect(container.firstChild).toBeNull()
    })

    test('shows single user typing', () => {
      const typingUsers: UserTypingPayload[] = [{ chat_id: 'chat1', user_id: 'u1', user_name: 'Alice' }]
      render(<TypingIndicator typingUsers={typingUsers} />)
      expect(screen.getByText('Alice đang nhập')).toBeInTheDocument()
    })

    test('shows multiple users typing', () => {
      const typingUsers: UserTypingPayload[] = [
        { chat_id: 'chat1', user_id: 'u1', user_name: 'Alice' },
        { chat_id: 'chat1', user_id: 'u2', user_name: 'Bob' }
      ]
      render(<TypingIndicator typingUsers={typingUsers} />)
      expect(screen.getByText('Alice, Bob đang nhập')).toBeInTheDocument()
    })
  })

  describe('ConnectionStatus', () => {
    const renderConnectionStatus = (isAuthenticated: boolean) => {
      const appContextValue = {
        isAuthenticated,
        setIsAuthenticated: vi.fn(),
        profile: null,
        setProfile: vi.fn(),
        extendedPurchases: [],
        setExtendedPurchases: vi.fn(),
        reset: vi.fn()
      }
      return render(
        <AppContext.Provider value={appContextValue}>
          <ConnectionStatus />
        </AppContext.Provider>
      )
    }

    test('shows nothing when connected and authenticated', () => {
      mockConnectionStatus = 'connected'
      const { container } = renderConnectionStatus(true)
      expect(container.firstChild).toBeNull()
    })

    test('shows nothing when not authenticated', () => {
      mockConnectionStatus = 'disconnected'
      const { container } = renderConnectionStatus(false)
      expect(container.firstChild).toBeNull()
    })

    test('shows connecting message when connecting', () => {
      mockConnectionStatus = 'connecting'
      renderConnectionStatus(true)
      expect(screen.getByText('Đang kết nối...')).toBeInTheDocument()
    })

    test('shows disconnected message with reconnect button', () => {
      mockConnectionStatus = 'disconnected'
      renderConnectionStatus(true)
      expect(screen.getByText('Mất kết nối')).toBeInTheDocument()
      expect(screen.getByText('Kết nối lại')).toBeInTheDocument()
    })

    test('shows error message with retry button', () => {
      mockConnectionStatus = 'error'
      renderConnectionStatus(true)
      expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument()
      expect(screen.getByText('Thử lại')).toBeInTheDocument()
    })

    test('calls connect when reconnect button clicked', async () => {
      mockConnectionStatus = 'disconnected'
      const user = userEvent.setup()
      renderConnectionStatus(true)
      await user.click(screen.getByText('Kết nối lại'))
      expect(mockConnect).toHaveBeenCalled()
    })
  })

  describe('OrderStatusTracker', () => {
    test('renders all 5 order steps', () => {
      render(<OrderStatusTracker currentStatus='pending' isSubscribed={false} />)
      expect(screen.getByText('Đơn Hàng Đã Đặt')).toBeInTheDocument()
      expect(screen.getByText('Đã Xác Nhận Thông Tin Thanh Toán')).toBeInTheDocument()
      expect(screen.getByText('Vận Chuyển')).toBeInTheDocument()
      expect(screen.getByText('Chờ Giao Hàng')).toBeInTheDocument()
      expect(screen.getByText('Đánh Giá')).toBeInTheDocument()
    })

    test('shows live tracking indicator when subscribed', () => {
      render(<OrderStatusTracker currentStatus='pending' isSubscribed={true} />)
      expect(screen.getByText('Đang theo dõi trực tiếp')).toBeInTheDocument()
    })

    test('does not show live tracking when not subscribed', () => {
      render(<OrderStatusTracker currentStatus='pending' isSubscribed={false} />)
      expect(screen.queryByText('Đang theo dõi trực tiếp')).not.toBeInTheDocument()
    })

    test('shows cancelled status message', () => {
      render(<OrderStatusTracker currentStatus='cancelled' isSubscribed={false} />)
      expect(screen.getByText(/Đơn hàng đã bị hủy/)).toBeInTheDocument()
    })

    test('shows returned status message', () => {
      render(<OrderStatusTracker currentStatus='returned' isSubscribed={false} />)
      expect(screen.getByText(/Đơn hàng đã được trả lại/)).toBeInTheDocument()
    })

    test('hides step progress for cancelled status', () => {
      render(<OrderStatusTracker currentStatus='cancelled' isSubscribed={false} />)
      // Steps should not be visible for special statuses
      expect(screen.queryByText('Đơn Hàng Đã Đặt')).not.toBeInTheDocument()
    })

    test('shows step timestamp for completed steps', () => {
      const now = new Date()
      const timestamps = { pending: now.toISOString() }
      render(<OrderStatusTracker currentStatus='confirmed' isSubscribed={false} stepTimestamps={timestamps} />)
      // formatLastUpdate returns "HH:mm DD-MM-YYYY"
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      expect(screen.getByText(`${hours}:${minutes} ${day}-${month}-${year}`)).toBeInTheDocument()
    })

    test('renders with null currentStatus', () => {
      const { container } = render(<OrderStatusTracker currentStatus={null} isSubscribed={false} />)
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('ViewerCountBadge', () => {
    test('renders nothing when viewerCount is 0', () => {
      const { container } = render(<ViewerCountBadge viewerCount={0} isPopular={false} />)
      expect(container.firstChild).toBeNull()
    })

    test('renders nothing when viewerCount is 1', () => {
      const { container } = render(<ViewerCountBadge viewerCount={1} isPopular={false} />)
      expect(container.firstChild).toBeNull()
    })

    test('shows viewer count when > 1', () => {
      render(<ViewerCountBadge viewerCount={5} isPopular={false} />)
      expect(screen.getByText('5 người đang xem')).toBeInTheDocument()
    })

    test('shows popular message when isPopular', () => {
      render(<ViewerCountBadge viewerCount={15} isPopular={true} />)
      expect(screen.getByText(/Nhiều người đang xem/)).toBeInTheDocument()
    })

    test('shows eye icon', () => {
      render(<ViewerCountBadge viewerCount={5} isPopular={false} />)
      expect(screen.getByText('👁')).toBeInTheDocument()
    })

    test('applies custom className', () => {
      const { container } = render(<ViewerCountBadge viewerCount={5} isPopular={false} className='mt-2' />)
      expect(container.firstChild).toHaveClass('mt-2')
    })
  })

  describe('CartSyncIndicator', () => {
    test('renders nothing when not syncing and no timestamp', () => {
      const { container } = render(<CartSyncIndicator isSyncing={false} lastSyncTimestamp={null} />)
      expect(container.firstChild).toBeNull()
    })

    test('shows syncing message when isSyncing', () => {
      render(<CartSyncIndicator isSyncing={true} lastSyncTimestamp={null} />)
      expect(screen.getByText('Đang đồng bộ...')).toBeInTheDocument()
    })

    test('shows synced message after sync completes', () => {
      const { rerender } = render(<CartSyncIndicator isSyncing={true} lastSyncTimestamp={null} />)
      // Sync completes
      rerender(<CartSyncIndicator isSyncing={false} lastSyncTimestamp='2026-02-07T10:00:00Z' />)
      expect(screen.getByText('Đã đồng bộ')).toBeInTheDocument()
    })

    test('shows sync icon when syncing', () => {
      render(<CartSyncIndicator isSyncing={true} lastSyncTimestamp={null} />)
      expect(screen.getByText('🔄')).toBeInTheDocument()
    })

    test('shows check icon after sync', () => {
      const { rerender } = render(<CartSyncIndicator isSyncing={true} lastSyncTimestamp={null} />)
      rerender(<CartSyncIndicator isSyncing={false} lastSyncTimestamp='2026-02-07T10:00:00Z' />)
      expect(screen.getByText('✓')).toBeInTheDocument()
    })
  })
})

describe('Phase1 11.4a - OnlineIndicator Component', () => {
  test('shows green dot and Online text when online', () => {
    render(<OnlineIndicator isOnline={true} />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  test('shows Offline text when offline with no lastSeen', () => {
    render(<OnlineIndicator isOnline={false} />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  test('shows formatted last seen time when offline', () => {
    // Set lastSeen to 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    render(<OnlineIndicator isOnline={false} lastSeen={twoHoursAgo} />)
    expect(screen.getByText(/Online 2 giờ trước/)).toBeInTheDocument()
  })

  test('hides text when showText is false', () => {
    render(<OnlineIndicator isOnline={true} showText={false} />)
    expect(screen.queryByText('Online')).not.toBeInTheDocument()
  })

  test('renders with different sizes', () => {
    const { container: smContainer } = render(<OnlineIndicator isOnline={true} size='sm' />)
    expect(smContainer.querySelector('.h-2')).toBeInTheDocument()
  })
})

describe('Phase1 11.4b - LivePriceTag Component', () => {
  test('displays current price when no live price', () => {
    render(<LivePriceTag currentPrice={100000} livePrice={null} previousPrice={null} hasChanged={false} />)
    expect(screen.getByText(/100\.000/)).toBeInTheDocument()
  })

  test('displays live price when available', () => {
    render(<LivePriceTag currentPrice={100000} livePrice={80000} previousPrice={null} hasChanged={false} />)
    expect(screen.getByText(/80\.000/)).toBeInTheDocument()
  })

  test('shows previous price with strikethrough when price changed', () => {
    render(<LivePriceTag currentPrice={100000} livePrice={80000} previousPrice={100000} hasChanged={true} />)
    // Previous price should be shown with line-through
    const strikethroughElements = document.querySelectorAll('.line-through')
    expect(strikethroughElements.length).toBeGreaterThan(0)
  })

  test('shows price decrease badge', () => {
    render(<LivePriceTag currentPrice={100000} livePrice={80000} previousPrice={100000} hasChanged={true} />)
    expect(screen.getByText('↓ Giảm giá')).toBeInTheDocument()
  })

  test('shows price increase badge', () => {
    render(<LivePriceTag currentPrice={100000} livePrice={120000} previousPrice={100000} hasChanged={true} />)
    expect(screen.getByText('↑ Tăng giá')).toBeInTheDocument()
  })

  test('shows price before discount when applicable', () => {
    render(<LivePriceTag currentPrice={80000} livePrice={null} previousPrice={null} hasChanged={false} priceBeforeDiscount={120000} />)
    const strikethroughElements = document.querySelectorAll('.line-through')
    expect(strikethroughElements.length).toBeGreaterThan(0)
  })
})

describe('Phase1 11.4c - InventoryAlertBadge Component', () => {
  const mockAlerts: InventoryAlertPayload[] = [
    { product_id: 'p1', product_name: 'Product A', current_quantity: 3, threshold: 10, severity: 'warning' },
    { product_id: 'p2', product_name: 'Product B', current_quantity: 0, threshold: 10, severity: 'critical' },
  ]

  test('returns null when unreadCount is 0', () => {
    const { container } = render(<InventoryAlertBadge alerts={[]} unreadCount={0} />)
    expect(container.firstChild).toBeNull()
  })

  test('shows badge count', () => {
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={2} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('shows 99+ when count exceeds 99', () => {
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={150} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  test('shows alert product names', () => {
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={2} />)
    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.getByText('Product B')).toBeInTheDocument()
  })

  test('shows out of stock message for critical alerts', () => {
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={2} />)
    expect(screen.getByText('Đã hết hàng!')).toBeInTheDocument()
  })

  test('shows low stock message for warning alerts', () => {
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={2} />)
    expect(screen.getByText('Chỉ còn 3 sản phẩm')).toBeInTheDocument()
  })

  test('shows clear button when onClear is provided', () => {
    const onClear = vi.fn()
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={2} onClear={onClear} />)
    const clearButton = screen.getByText('Xóa tất cả')
    expect(clearButton).toBeInTheDocument()
    fireEvent.click(clearButton)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  test('shows severity emojis', () => {
    render(<InventoryAlertBadge alerts={mockAlerts} unreadCount={2} />)
    expect(screen.getByText('⚠️')).toBeInTheDocument()
    expect(screen.getByText('🚨')).toBeInTheDocument()
  })
})



describe('Phase3 - LiveReviewFeed Component', () => {
  test('renders nothing when newReviewCount is 0', () => {
    const { container } = render(<LiveReviewFeed newReviewCount={0} />)
    expect(container.firstChild).toBeNull()
  })

  test('shows review count when > 0', () => {
    render(<LiveReviewFeed newReviewCount={3} />)
    expect(screen.getByText('3 đánh giá mới')).toBeInTheDocument()
  })

  test('calls onViewReviews when clicked', () => {
    const onViewReviews = vi.fn()
    render(<LiveReviewFeed newReviewCount={2} onViewReviews={onViewReviews} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onViewReviews).toHaveBeenCalledTimes(1)
  })

  test('calls onViewReviews on Enter key', () => {
    const onViewReviews = vi.fn()
    render(<LiveReviewFeed newReviewCount={2} onViewReviews={onViewReviews} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onViewReviews).toHaveBeenCalledTimes(1)
  })

  test('applies custom className', () => {
    const { container } = render(<LiveReviewFeed newReviewCount={1} className='mt-4' />)
    expect(container.firstChild).toHaveClass('mt-4')
  })

  test('shows star emoji', () => {
    render(<LiveReviewFeed newReviewCount={1} />)
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })

  test('shows latest reviewer name and rating when latestReview provided', () => {
    render(<LiveReviewFeed newReviewCount={2} latestReview={{ name: 'Nguyen Van B', rating: 4 }} />)
    expect(screen.getByText(/Nguyen Van B/)).toBeInTheDocument()
    expect(screen.getByText(/vừa đánh giá 4 sao/)).toBeInTheDocument()
    expect(screen.getByText(/★★★★☆/)).toBeInTheDocument()
  })

  test('renders without latestReview (backward compatible)', () => {
    render(<LiveReviewFeed newReviewCount={1} />)
    expect(screen.getByText('1 đánh giá mới')).toBeInTheDocument()
    expect(screen.queryByText(/vừa đánh giá/)).not.toBeInTheDocument()
  })
})

describe('Phase3 - LiveQASection Component', () => {
  test('renders nothing when no questions and no answers', () => {
    const { container } = render(<LiveQASection newQuestionCount={0} newAnswers={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('shows question count when > 0', () => {
    render(<LiveQASection newQuestionCount={5} newAnswers={[]} />)
    expect(screen.getByText('5 câu hỏi mới')).toBeInTheDocument()
  })

  test('calls onViewQuestions when question section clicked', () => {
    const onViewQuestions = vi.fn()
    render(<LiveQASection newQuestionCount={2} newAnswers={[]} onViewQuestions={onViewQuestions} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onViewQuestions).toHaveBeenCalledTimes(1)
  })

  test('shows answers with seller highlight', () => {
    const answers = [
      { question_id: 'q1', answer: { user_name: 'Shop ABC', answer: 'Yes we have it', is_seller: true } }
    ]
    render(<LiveQASection newQuestionCount={0} newAnswers={answers} />)
    expect(screen.getByText(/Shop ABC/)).toBeInTheDocument()
    expect(screen.getByText(/Người bán/)).toBeInTheDocument()
    expect(screen.getByText('🏪')).toBeInTheDocument()
  })

  test('shows non-seller answers without highlight', () => {
    const answers = [
      { question_id: 'q1', answer: { user_name: 'Regular User', answer: 'I think so', is_seller: false } }
    ]
    render(<LiveQASection newQuestionCount={0} newAnswers={answers} />)
    expect(screen.getByText(/Regular User/)).toBeInTheDocument()
    expect(screen.getByText('💬')).toBeInTheDocument()
  })

  test('shows max 3 most recent answers', () => {
    const answers = [
      { question_id: 'q1', answer: { user_name: 'User1', answer: 'Answer 1', is_seller: false } },
      { question_id: 'q2', answer: { user_name: 'User2', answer: 'Answer 2', is_seller: false } },
      { question_id: 'q3', answer: { user_name: 'User3', answer: 'Answer 3', is_seller: false } },
      { question_id: 'q4', answer: { user_name: 'User4', answer: 'Answer 4', is_seller: false } },
    ]
    render(<LiveQASection newQuestionCount={0} newAnswers={answers} />)
    expect(screen.queryByText(/User1/)).not.toBeInTheDocument()
    expect(screen.getByText(/User2/)).toBeInTheDocument()
    expect(screen.getByText(/User3/)).toBeInTheDocument()
    expect(screen.getByText(/User4/)).toBeInTheDocument()
  })
})

describe('Phase3 - ActivityFeedWidget Component', () => {
  test('renders nothing when no activity', () => {
    const { container } = render(<ActivityFeedWidget latestActivity={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('shows purchase activity with cart emoji', () => {
    const activity = { type: 'purchase' as const, message: 'Ai đó vừa mua sản phẩm', timestamp: new Date().toISOString() }
    render(<ActivityFeedWidget latestActivity={activity} />)
    expect(screen.getByText('🛒')).toBeInTheDocument()
    expect(screen.getByText('Ai đó vừa mua sản phẩm')).toBeInTheDocument()
  })

  test('shows review activity with star emoji', () => {
    const activity = { type: 'review' as const, message: 'Ai đó vừa đánh giá', timestamp: new Date().toISOString() }
    render(<ActivityFeedWidget latestActivity={activity} />)
    expect(screen.getByText('⭐')).toBeInTheDocument()
    expect(screen.getByText('Ai đó vừa đánh giá')).toBeInTheDocument()
  })

  test('shows "vừa xong" for recent timestamps', () => {
    const activity = { type: 'purchase' as const, message: 'Test', timestamp: new Date().toISOString() }
    render(<ActivityFeedWidget latestActivity={activity} />)
    expect(screen.getByText('vừa xong')).toBeInTheDocument()
  })

  test('queues multiple activities and shows first one', () => {
    const activity1 = { type: 'purchase' as const, message: 'Activity 1', timestamp: new Date().toISOString() }
    const activity2 = { type: 'review' as const, message: 'Activity 2', timestamp: new Date().toISOString() }
    const { rerender } = render(<ActivityFeedWidget latestActivity={activity1} />)
    expect(screen.getByText('Activity 1')).toBeInTheDocument()
    // Add second activity while first is showing
    rerender(<ActivityFeedWidget latestActivity={activity2} />)
    // First activity should still be showing (queue mechanism)
    expect(screen.getByText('Activity 1')).toBeInTheDocument()
  })
})

describe('Phase3 - SellerDashboardPanel Component', () => {
  const defaultMetrics = { today_orders: 10, today_revenue: 5000000, pending_orders: 3, pending_qa: 2 }

  beforeEach(() => {
    mockSellerDashboard = { metrics: defaultMetrics, orderNotifications: [], qaNotifications: [], isActive: false }
  })

  test('renders nothing when not active', () => {
    mockSellerDashboard.isActive = false
    const { container } = render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })

  test('shows dashboard title when active', () => {
    mockSellerDashboard.isActive = true
    render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>
    )
    expect(screen.getByText(/Bảng điều khiển người bán/)).toBeInTheDocument()
  })

  test('shows metrics cards', () => {
    mockSellerDashboard.isActive = true
    render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Đơn hàng hôm nay')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Đơn chờ xử lý')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi chờ trả lời')).toBeInTheDocument()
  })

  test('shows order notifications', () => {
    mockSellerDashboard.isActive = true
    mockSellerDashboard.orderNotifications = [
      { order_id: 'o1', status: 'pending', product_names: ['iPhone 15'], total: 25000000, timestamp: '2026-02-08T10:00:00Z' }
    ]
    render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>
    )
    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  test('shows QA notifications with product links', () => {
    mockSellerDashboard.isActive = true
    mockSellerDashboard.qaNotifications = [
      { product_id: 'prod-123', product_name: 'Samsung Galaxy', question_preview: 'Có bảo hành không?', user_name: 'Nguyen Van A' }
    ]
    render(
      <MemoryRouter>
        <SellerDashboardPanel />
      </MemoryRouter>
    )
    expect(screen.getByText(/Nguyen Van A/)).toBeInTheDocument()
    expect(screen.getByText(/Có bảo hành không/)).toBeInTheDocument()
    expect(screen.getByText(/Samsung Galaxy/)).toBeInTheDocument()
    // Verify the product name is a link
    const link = screen.getByRole('link', { name: /Samsung Galaxy/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/Samsung-Galaxy-i-prod-123')
  })

  test('applies custom className', () => {
    mockSellerDashboard.isActive = true
    const { container } = render(
      <MemoryRouter>
        <SellerDashboardPanel className='w-80' />
      </MemoryRouter>
    )
    expect(container.firstChild).toHaveClass('w-80')
  })
})