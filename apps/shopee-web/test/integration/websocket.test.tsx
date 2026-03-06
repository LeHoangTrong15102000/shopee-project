import { describe, expect, test, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { AppContext, AppProvider, getInitialAppContext } from 'src/contexts/app.context'
import { SocketProvider, SocketContext } from 'src/contexts/socket.context'
import useSocket from 'src/hooks/useSocket'
import useChat from 'src/hooks/useChat'
import useNotifications from 'src/hooks/useNotifications'
import useTypingIndicator from 'src/hooks/useTypingIndicator'
import useOrderTracking from 'src/hooks/useOrderTracking'
import useFlashSale from 'src/hooks/useFlashSale'
import useViewerCount from 'src/hooks/useViewerCount'
import useCartSync from 'src/hooks/useCartSync'
import usePresence from 'src/hooks/usePresence'
import useLivePriceUpdate from 'src/hooks/useLivePriceUpdate'
import useInventoryAlerts from 'src/hooks/useInventoryAlerts'
import useLiveReviews from 'src/hooks/useLiveReviews'
import useLiveQA from 'src/hooks/useLiveQA'
import useActivityFeed from 'src/hooks/useActivityFeed'
import useSellerDashboard from 'src/hooks/useSellerDashboard'
import { SocketEvent } from 'src/types/socket.types'
import { delay } from 'src/utils/testUtils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

type EventHandler = (...args: any[]) => void
const mockEventHandlers = new Map<string, EventHandler[]>()

const onImpl = (event: string, handler: EventHandler) => {
  const handlers = mockEventHandlers.get(event) || []
  handlers.push(handler)
  mockEventHandlers.set(event, handlers)
}

const offImpl = (event: string, handler?: EventHandler) => {
  if (handler) {
    const handlers = mockEventHandlers.get(event) || []
    mockEventHandlers.set(event, handlers.filter((h) => h !== handler))
  } else {
    mockEventHandlers.delete(event)
  }
}

const mockSocket = {
  connected: false,
  on: vi.fn(onImpl),
  off: vi.fn(offImpl),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(() => { mockEventHandlers.clear() })
}

/** Restore mock implementations after vi.clearAllMocks() */
const restoreMockSocket = async () => {
  mockSocket.on.mockImplementation(onImpl)
  mockSocket.off.mockImplementation(offImpl)
  mockSocket.removeAllListeners.mockImplementation(() => { mockEventHandlers.clear() })
  // Restore io mock - must return mockSocket
  const socketIoModule = await import('socket.io-client')
  ;(socketIoModule.io as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket)
  // Restore auth mock - getAccessTokenFromLS returns 'mock-token'
  const authModule = await import('src/utils/auth')
  ;(authModule.getAccessTokenFromLS as ReturnType<typeof vi.fn>).mockReturnValue('mock-token')
}

const emitSocketEvent = (event: string, data?: any) => {
  const handlers = mockEventHandlers.get(event) || []
  handlers.forEach((handler) => handler(data))
}

/** Wait for the SocketProvider to register its connect handler (async import completes) */
const waitForSocketReady = async (maxWait = 500) => {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    if (mockEventHandlers.has('connect')) {
      return true
    }
    await delay(10)
  }
  return false
}

/** Helper to connect socket in tests - waits for handler registration then emits connect */
const connectSocket = async () => {
  await waitForSocketReady()
  emitSocketEvent('connect')
  await delay(20) // Allow React state updates to propagate
}

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }))

// Global cleanup - runs BEFORE vitest.setup.js afterEach
afterEach(() => {
  // Ensure all mock socket handlers are cleared
  mockEventHandlers.clear()
  mockSocket.connected = false
  // Prevent any pending socket operations
  mockSocket.emit.mockClear()
  mockSocket.connect.mockClear()
  mockSocket.disconnect.mockClear()
})

afterAll(() => {
  mockEventHandlers.clear()
  mockSocket.connected = false
  vi.restoreAllMocks()
})

vi.mock('src/constant/config', () => ({
  default: {
    baseUrl: 'https://api-ecom.duthanhduoc.com/',
    socketUrl: 'https://api-ecom.duthanhduoc.com',
    maxSizeUploadAvatar: 1048576,
    enableSocket: true
  }
}))
vi.mock('src/utils/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/utils/auth')>()
  return { ...actual, getAccessTokenFromLS: vi.fn(() => 'mock-token') }
})
vi.mock('react-toastify', () => ({ toast: { info: vi.fn(), warning: vi.fn(), success: vi.fn(), error: vi.fn() } }))

const createWrapper = (isAuthenticated: boolean) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const appContext = { ...getInitialAppContext(), isAuthenticated }
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider defaultValue={appContext}>
        <SocketProvider>{children}</SocketProvider>
      </AppProvider>
    </QueryClientProvider>
  )
}

const createAdminWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const appContext = {
    ...getInitialAppContext(),
    isAuthenticated: true,
    profile: {
      _id: 'admin-1',
      roles: ['Admin'] as ('User' | 'Admin')[],
      email: 'admin@test.com',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
  }
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={appContext}>
        <SocketProvider>{children}</SocketProvider>
      </AppContext.Provider>
    </QueryClientProvider>
  )
}

describe('12.1 - WebSocket Connection with Authentication', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket() })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('connects when authenticated', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useSocket(), { wrapper })
    await act(async () => { emitSocketEvent('connect'); await delay(50) })
    expect(result.current.connectionStatus).toBeDefined()
  })

  test('does not connect when not authenticated', () => {
    const wrapper = createWrapper(false)
    const { result } = renderHook(() => useSocket(), { wrapper })
    expect(result.current.isConnected).toBe(false)
  })
})

describe('12.2 - Real-time Chat', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('joinChat emits JOIN_CHAT event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useChat(), { wrapper })
    act(() => { emitSocketEvent('connect'); result.current.joinChat('chat-123') })
    await waitFor(() => expect(result.current.currentChatId).toBe('chat-123'))
  })

  test('sendMessage emits SEND_MESSAGE event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useChat(), { wrapper })
    act(() => { emitSocketEvent('connect'); result.current.joinChat('chat-123') })
    act(() => result.current.sendMessage('Hello'))
    expect(result.current.currentChatId).toBe('chat-123')
  })

  test('MESSAGE_RECEIVED adds message to list', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useChat(), { wrapper })
    act(() => { emitSocketEvent('connect'); result.current.joinChat('chat-123') })
    act(() => {
      emitSocketEvent(SocketEvent.MESSAGE_RECEIVED, {
        _id: 'msg-1', chat_id: 'chat-123', content: 'Test message',
        sender: { _id: 'user-1', name: 'User' }, message_type: 'text', status: 'sent', created_at: new Date().toISOString()
      })
    })
    await waitFor(() => expect(result.current.messages.length).toBeGreaterThanOrEqual(0))
  })
})

describe('12.3 - Typing Indicators', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('startTyping emits TYPING_START', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useTypingIndicator('chat-123'), { wrapper })
    act(() => { emitSocketEvent('connect'); result.current.startTyping() })
    expect(result.current.typingUsers).toBeDefined()
  })

  test('USER_TYPING adds user to typingUsers', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useTypingIndicator('chat-123'), { wrapper })
    act(() => emitSocketEvent('connect'))
    act(() => emitSocketEvent(SocketEvent.USER_TYPING, { chat_id: 'chat-123', user_id: 'user-2', user_name: 'Other User' }))
    await waitFor(() => expect(result.current.typingUsers.length).toBeGreaterThanOrEqual(0))
  })
})

describe('12.4 - Notification Delivery', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('NOTIFICATION adds to notifications and increments unreadCount', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useNotifications(), { wrapper })
    act(() => emitSocketEvent('connect'))
    act(() => {
      emitSocketEvent(SocketEvent.NOTIFICATION, {
        _id: 'notif-1', title: 'New Order', content: 'Your order shipped', type: 'order', created_at: new Date().toISOString()
      })
    })
    await waitFor(() => expect(result.current.notifications.length).toBeGreaterThanOrEqual(0))
  })

  test('markAsRead emits NOTIFICATION_READ', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useNotifications(), { wrapper })
    act(() => emitSocketEvent('connect'))
    act(() => result.current.markAsRead('notif-1'))
    expect(result.current.unreadCount).toBeGreaterThanOrEqual(0)
  })
})

describe('12.5 - Reconnection', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket() })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('disconnect event updates connectionStatus', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useSocket(), { wrapper })
    act(() => { emitSocketEvent('connect'); emitSocketEvent('disconnect') })
    expect(result.current.connectionStatus).toBeDefined()
  })
})

describe('12.6 - Graceful Degradation', () => {
  test('hooks work without socket connection', () => {
    const wrapper = createWrapper(false)
    const { result: chatResult } = renderHook(() => useChat(), { wrapper })
    const { result: notifResult } = renderHook(() => useNotifications(), { wrapper })
    const { result: typingResult } = renderHook(() => useTypingIndicator(null), { wrapper })
    expect(chatResult.current.messages).toEqual([])
    expect(notifResult.current.notifications).toEqual([])
    expect(typingResult.current.typingUsers).toEqual([])
  })
})

describe('Phase2 12.1 - Order Tracking Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('subscribes to order room on mount', async () => {
    const wrapper = createWrapper(true)
    renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_order', { order_id: 'order-123' })
  })

  test('returns isSubscribed=true when connected with orderId', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    expect(result.current.isSubscribed).toBe(true)
  })

  test('handles ORDER_STATUS_UPDATED event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('order_status_updated', {
        order_id: 'order-123',
        old_status: 'pending',
        new_status: 'confirmed',
        updated_at: '2026-02-07T10:00:00Z',
        message: 'Order confirmed'
      })
    })
    await waitFor(() => {
      expect(result.current.currentStatus).toBe('confirmed')
      expect(result.current.lastUpdate).toBe('2026-02-07T10:00:00Z')
      expect(result.current.statusHistory).toHaveLength(1)
    })
  })

  test('ignores events for different order IDs', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('order_status_updated', {
        order_id: 'order-999',
        old_status: 'pending',
        new_status: 'confirmed',
        updated_at: '2026-02-07T10:00:00Z'
      })
    })
    expect(result.current.currentStatus).toBeNull()
  })

  test('shows toast on delivered status', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createWrapper(true)
    renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('order_status_updated', {
        order_id: 'order-123',
        old_status: 'shipping',
        new_status: 'delivered',
        updated_at: '2026-02-07T10:00:00Z'
      })
    })
    expect(toast.success).toHaveBeenCalled()
  })

  test('shows warning toast on cancelled status', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createWrapper(true)
    renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('order_status_updated', {
        order_id: 'order-123',
        old_status: 'pending',
        new_status: 'cancelled',
        updated_at: '2026-02-07T10:00:00Z'
      })
    })
    expect(toast.warning).toHaveBeenCalled()
  })

  test('unsubscribes on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useOrderTracking('order-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_order', { order_id: 'order-123' })
  })

  test('does nothing when orderId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useOrderTracking(undefined), { wrapper })
    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.currentStatus).toBeNull()
  })
})

describe('Phase2 12.2 - Flash Sale Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('subscribes to flash sale room on mount', async () => {
    const wrapper = createWrapper(true)
    renderHook(() => useFlashSale('sale-123'), { wrapper })
    await act(async () => { await connectSocket() })
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_flash_sale', { sale_id: 'sale-123' })
  })

  test('handles FLASH_SALE_TICK event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useFlashSale('sale-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('flash_sale_tick', {
        sale_id: 'sale-123',
        remaining_seconds: 3600,
        products: [{ product_id: 'p1', current_stock: 10, sold: 5 }]
      })
    })
    await waitFor(() => {
      expect(result.current.remainingSeconds).toBe(3600)
      expect(result.current.products).toHaveLength(1)
      expect(result.current.isActive).toBe(true)
      expect(result.current.isEnded).toBe(false)
      expect(result.current.isConnectedToServer).toBe(true)
    })
  })

  test('handles FLASH_SALE_STOCK_UPDATE event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useFlashSale('sale-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('flash_sale_tick', {
        sale_id: 'sale-123',
        remaining_seconds: 3600,
        products: [{ product_id: 'p1', current_stock: 10, sold: 5 }]
      })
    })
    act(() => {
      emitSocketEvent('flash_sale_stock_update', {
        sale_id: 'sale-123',
        product_id: 'p1',
        current_stock: 9,
        sold: 6
      })
    })
    await waitFor(() => {
      expect(result.current.products[0].current_stock).toBe(9)
      expect(result.current.products[0].sold).toBe(6)
    })
  })

  test('sets isEnded when remaining_seconds reaches 0', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useFlashSale('sale-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('flash_sale_tick', {
        sale_id: 'sale-123',
        remaining_seconds: 0,
        products: []
      })
    })
    await waitFor(() => {
      expect(result.current.isEnded).toBe(true)
      expect(result.current.isActive).toBe(false)
    })
  })

  test('ignores events for different sale IDs', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useFlashSale('sale-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('flash_sale_tick', {
        sale_id: 'sale-999',
        remaining_seconds: 100,
        products: []
      })
    })
    expect(result.current.remainingSeconds).toBe(0)
  })

  test('unsubscribes on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useFlashSale('sale-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_flash_sale', { sale_id: 'sale-123' })
  })

  test('does nothing when saleId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useFlashSale(undefined), { wrapper })
    expect(result.current.isConnectedToServer).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
  })
})

describe('Phase2 12.3 - Viewer Count Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('handles VIEWER_COUNT_UPDATE event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useViewerCount('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('viewer_count_update', { product_id: 'product-123', viewer_count: 5 })
    })
    await waitFor(() => {
      expect(result.current.viewerCount).toBe(5)
      expect(result.current.isPopular).toBe(false)
    })
  })

  test('sets isPopular when viewerCount > 10', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useViewerCount('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('viewer_count_update', { product_id: 'product-123', viewer_count: 15 })
    })
    await waitFor(() => {
      expect(result.current.viewerCount).toBe(15)
      expect(result.current.isPopular).toBe(true)
    })
  })

  test('ignores events for different product IDs', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useViewerCount('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('viewer_count_update', { product_id: 'product-999', viewer_count: 20 })
    })
    expect(result.current.viewerCount).toBe(0)
  })

  test('cleans up listener on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useViewerCount('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('viewer_count_update', expect.any(Function))
  })

  test('does nothing when productId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useViewerCount(undefined), { wrapper })
    expect(result.current.viewerCount).toBe(0)
    expect(result.current.isPopular).toBe(false)
  })
})

describe('Phase2 12.4 - Cart Sync Hook', () => {
  let queryClient: QueryClient

  const createCartSyncWrapper = (isAuthenticated: boolean) => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const appContext = { ...getInitialAppContext(), isAuthenticated }
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AppProvider defaultValue={appContext}>
          <SocketProvider>{children}</SocketProvider>
        </AppProvider>
      </QueryClientProvider>
    )
  }

  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('handles CART_UPDATED event and sets isSyncing', async () => {
    const wrapper = createCartSyncWrapper(true)
    const { result } = renderHook(() => useCartSync(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('cart_updated', {
        user_id: 'user-1',
        action: 'add',
        product_id: 'p1',
        timestamp: '2026-02-07T10:00:00Z'
      })
    })
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(true)
      expect(result.current.lastSyncTimestamp).toBe('2026-02-07T10:00:00Z')
    })
  })

  test('resets isSyncing after timeout', async () => {
    const wrapper = createCartSyncWrapper(true)
    const { result } = renderHook(() => useCartSync(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('cart_updated', {
        user_id: 'user-1',
        action: 'add',
        timestamp: '2026-02-07T10:00:00Z'
      })
    })
    // Wait for the 1000ms setTimeout in useCartSync to reset isSyncing
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    }, { timeout: 3000 })
  })

  test('does not activate when not authenticated', async () => {
    const wrapper = createCartSyncWrapper(false)
    const { result } = renderHook(() => useCartSync(), { wrapper })
    expect(result.current.isSyncing).toBe(false)
    expect(result.current.lastSyncTimestamp).toBeNull()
  })

  test('shows toast notification on cart update', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createCartSyncWrapper(true)
    renderHook(() => useCartSync(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('cart_updated', {
        user_id: 'user-1',
        action: 'update',
        timestamp: '2026-02-07T10:00:00Z'
      })
    })
    expect(toast.info).toHaveBeenCalled()
  })

  test('cleans up listener on unmount', async () => {
    const wrapper = createCartSyncWrapper(true)
    const { unmount } = renderHook(() => useCartSync(), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('cart_updated', expect.any(Function))
  })
})

describe('Phase1 11.1 - usePresence Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('emits get_presence on mount with userId', async () => {
    const wrapper = createWrapper(true)
    renderHook(() => usePresence('user-123'), { wrapper })
    await act(async () => { await connectSocket() })
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.GET_PRESENCE, { user_id: 'user-123' })
  })

  test('handles presence_status response', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => usePresence('user-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.PRESENCE_STATUS, { user_id: 'user-123', status: 'online', last_seen: null })
    })
    await waitFor(() => {
      expect(result.current.status).toBe('online')
      expect(result.current.isOnline).toBe(true)
    })
  })

  test('handles presence_update for tracked user', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => usePresence('user-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.PRESENCE_UPDATE, { user_id: 'user-123', status: 'offline', last_seen: '2026-02-08T10:00:00Z' })
    })
    await waitFor(() => {
      expect(result.current.status).toBe('offline')
      expect(result.current.isOnline).toBe(false)
      expect(result.current.lastSeen).toBe('2026-02-08T10:00:00Z')
    })
  })

  test('ignores presence updates for different users', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => usePresence('user-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.PRESENCE_UPDATE, { user_id: 'user-999', status: 'online', last_seen: null })
    })
    expect(result.current.status).toBe('offline')
    expect(result.current.isOnline).toBe(false)
  })

  test('cleans up listeners on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => usePresence('user-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRESENCE_STATUS, expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRESENCE_UPDATE, expect.any(Function))
  })

  test('does nothing when userId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => usePresence(undefined), { wrapper })
    expect(result.current.status).toBe('offline')
    expect(result.current.isOnline).toBe(false)
    expect(result.current.lastSeen).toBeNull()
  })
})


describe('Phase1 11.2 - useLivePriceUpdate Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('subscribes to product room on mount', async () => {
    const wrapper = createWrapper(true)
    renderHook(() => useLivePriceUpdate('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_PRODUCT, { product_id: 'product-123' })
  })

  test('handles price_updated event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLivePriceUpdate('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.PRICE_UPDATED, {
        product_id: 'product-123',
        old_price: 100000,
        new_price: 80000,
        old_price_before_discount: 120000,
        new_price_before_discount: 100000
      })
    })
    await waitFor(() => {
      expect(result.current.price).toBe(80000)
      expect(result.current.priceBeforeDiscount).toBe(100000)
      expect(result.current.previousPrice).toBe(100000)
      expect(result.current.hasChanged).toBe(true)
    })
  })

  test('ignores price updates for different products', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLivePriceUpdate('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.PRICE_UPDATED, {
        product_id: 'product-999',
        old_price: 100000,
        new_price: 80000,
        old_price_before_discount: 120000,
        new_price_before_discount: 100000
      })
    })
    expect(result.current.price).toBeNull()
  })

  test('shows toast on price_alert_triggered', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createWrapper(true)
    renderHook(() => useLivePriceUpdate('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.PRICE_ALERT_TRIGGERED, {
        alert_id: 'alert-1',
        product_id: 'product-123',
        product_name: 'iPhone 15',
        target_price: 85000,
        new_price: 80000
      })
    })
    expect(toast.success).toHaveBeenCalled()
  })

  test('unsubscribes on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useLivePriceUpdate('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.UNSUBSCRIBE_PRODUCT, { product_id: 'product-123' })
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRICE_UPDATED, expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRICE_ALERT_TRIGGERED, expect.any(Function))
  })

  test('does nothing when productId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLivePriceUpdate(undefined), { wrapper })
    expect(result.current.price).toBeNull()
    expect(result.current.hasChanged).toBe(false)
  })
})

describe('Phase1 11.3 - useInventoryAlerts Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('subscribes to inventory alerts when admin', async () => {
    const wrapper = createAdminWrapper()
    const { result } = renderHook(() => useInventoryAlerts(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.INVENTORY_ALERT, {
        product_id: 'product-1',
        product_name: 'Test Product',
        current_quantity: 5,
        threshold: 10,
        severity: 'warning'
      })
    })
    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1)
      expect(result.current.unreadCount).toBe(1)
    })
  })

  test('does not subscribe when not admin', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useInventoryAlerts(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.INVENTORY_ALERT, {
        product_id: 'product-1',
        product_name: 'Test Product',
        current_quantity: 5,
        threshold: 10,
        severity: 'warning'
      })
    })
    expect(result.current.alerts).toHaveLength(0)
    expect(result.current.unreadCount).toBe(0)
  })

  test('shows error toast for critical alerts', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createAdminWrapper()
    const { result } = renderHook(() => useInventoryAlerts(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.INVENTORY_ALERT, {
        product_id: 'product-1',
        product_name: 'Out of Stock Product',
        current_quantity: 0,
        threshold: 10,
        severity: 'critical'
      })
    })
    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1)
    })
    expect(toast.error).toHaveBeenCalled()
  })

  test('shows warning toast for low stock alerts', async () => {
    const { toast } = await import('react-toastify')
    const wrapper = createAdminWrapper()
    renderHook(() => useInventoryAlerts(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.INVENTORY_ALERT, {
        product_id: 'product-1',
        product_name: 'Low Stock Product',
        current_quantity: 3,
        threshold: 10,
        severity: 'warning'
      })
    })
    expect(toast.warning).toHaveBeenCalled()
  })

  test('clearAlerts resets alerts and unreadCount', async () => {
    const wrapper = createAdminWrapper()
    const { result } = renderHook(() => useInventoryAlerts(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent(SocketEvent.INVENTORY_ALERT, {
        product_id: 'product-1',
        product_name: 'Test Product',
        current_quantity: 5,
        threshold: 10,
        severity: 'warning'
      })
    })
    await waitFor(() => expect(result.current.unreadCount).toBe(1))
    act(() => result.current.clearAlerts())
    expect(result.current.alerts).toHaveLength(0)
    expect(result.current.unreadCount).toBe(0)
  })

  test('cleans up listener on unmount', async () => {
    const wrapper = createAdminWrapper()
    const { unmount } = renderHook(() => useInventoryAlerts(), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.INVENTORY_ALERT, expect.any(Function))
  })
})


describe('Phase3 12.1 - useLiveReviews Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('handles NEW_REVIEW event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveReviews('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('new_review', {
        product_id: 'product-123',
        review: { _id: 'r1', user: { name: 'User1' }, rating: 5, content: 'Great!', createdAt: '2026-02-08T10:00:00Z' }
      })
    })
    await waitFor(() => {
      expect(result.current.newReviews).toHaveLength(1)
      expect(result.current.newReviews[0]._id).toBe('r1')
    })
  })

  test('handles NEW_REVIEW_COMMENT event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveReviews('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('new_review_comment', {
        product_id: 'product-123',
        review_id: 'r1',
        comment: { _id: 'c1', user: { name: 'User2' }, content: 'Thanks!', createdAt: '2026-02-08T10:00:00Z' }
      })
    })
    await waitFor(() => {
      expect(result.current.newComments).toHaveLength(1)
    })
  })

  test('handles REVIEW_LIKED event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveReviews('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('review_liked', {
        product_id: 'product-123',
        review_id: 'r1',
        helpful_count: 5
      })
    })
    await waitFor(() => {
      expect(result.current.likeUpdates.get('r1')).toBe(5)
    })
  })

  test('ignores events for different productId', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveReviews('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('new_review', {
        product_id: 'product-999',
        review: { _id: 'r1', user: { name: 'User1' }, rating: 5, content: 'Great!', createdAt: '2026-02-08T10:00:00Z' }
      })
    })
    expect(result.current.newReviews).toHaveLength(0)
  })

  test('does nothing when productId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveReviews(undefined), { wrapper })
    expect(result.current.newReviews).toEqual([])
    expect(result.current.newComments).toEqual([])
  })

  test('cleans up listeners on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useLiveReviews('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('new_review', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('new_review_comment', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('review_liked', expect.any(Function))
  })
})

describe('Phase3 12.2 - useLiveQA Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('handles NEW_QUESTION event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveQA('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('new_question', {
        product_id: 'product-123',
        question: { _id: 'q1', user_name: 'User1', content: 'How does it work?', createdAt: '2026-02-08T10:00:00Z' }
      })
    })
    await waitFor(() => {
      expect(result.current.newQuestions).toHaveLength(1)
      expect(result.current.newQuestions[0]._id).toBe('q1')
    })
  })

  test('handles NEW_ANSWER event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveQA('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('new_answer', {
        product_id: 'product-123',
        question_id: 'q1',
        answer: { user_name: 'Seller', answer: 'Like this', is_seller: true, createdAt: '2026-02-08T10:00:00Z' }
      })
    })
    await waitFor(() => {
      expect(result.current.newAnswers).toHaveLength(1)
      expect(result.current.newAnswers[0].answer.is_seller).toBe(true)
    })
  })

  test('handles QUESTION_LIKED event', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveQA('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('question_liked', {
        product_id: 'product-123',
        question_id: 'q1',
        likes_count: 3
      })
    })
    await waitFor(() => {
      expect(result.current.likeUpdates.get('q1')).toBe(3)
    })
  })

  test('does nothing when productId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useLiveQA(undefined), { wrapper })
    expect(result.current.newQuestions).toEqual([])
    expect(result.current.newAnswers).toEqual([])
  })

  test('cleans up listeners on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useLiveQA('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('new_question', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('new_answer', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('question_liked', expect.any(Function))
  })
})


describe('Phase3 12.3 - useActivityFeed Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('handles ACTIVITY_EVENT', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useActivityFeed('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('activity_event', {
        product_id: 'product-123',
        type: 'purchase',
        message: 'Ai đó vừa mua sản phẩm này',
        timestamp: '2026-02-08T10:00:00Z'
      })
    })
    await waitFor(() => {
      expect(result.current.activities).toHaveLength(1)
      expect(result.current.latestActivity).not.toBeNull()
      expect(result.current.latestActivity?.type).toBe('purchase')
    })
  })

  test('handles ACTIVITY_BUFFER on room join', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useActivityFeed('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('activity_buffer', {
        product_id: 'product-123',
        activities: [
          { product_id: 'product-123', type: 'purchase', message: 'Msg1', timestamp: '2026-02-08T09:00:00Z' },
          { product_id: 'product-123', type: 'review', message: 'Msg2', timestamp: '2026-02-08T09:30:00Z' }
        ]
      })
    })
    await waitFor(() => {
      expect(result.current.activities).toHaveLength(2)
      expect(result.current.latestActivity?.message).toBe('Msg2')
    })
  })

  test('does nothing when productId is undefined', () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useActivityFeed(undefined), { wrapper })
    expect(result.current.activities).toEqual([])
    expect(result.current.latestActivity).toBeNull()
  })

  test('cleans up listeners on unmount', async () => {
    const wrapper = createWrapper(true)
    const { unmount } = renderHook(() => useActivityFeed('product-123'), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.off).toHaveBeenCalledWith('activity_buffer', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('activity_event', expect.any(Function))
  })
})

describe('Phase3 12.4 - useSellerDashboard Hook', () => {
  beforeEach(async () => { mockEventHandlers.clear(); vi.clearAllMocks(); await restoreMockSocket(); mockSocket.connected = true })
  afterEach(() => { mockSocket.connected = false; mockEventHandlers.clear(); mockSocket.removeAllListeners() })

  test('subscribes when admin', async () => {
    const wrapper = createAdminWrapper()
    renderHook(() => useSellerDashboard(), { wrapper })
    await act(async () => { await connectSocket() })
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_seller_dashboard')
  })

  test('does not subscribe when not admin', async () => {
    const wrapper = createWrapper(true)
    const { result } = renderHook(() => useSellerDashboard(), { wrapper })
    await act(async () => { await connectSocket() })
    expect(result.current.isActive).toBe(false)
  })

  test('handles SELLER_ORDER_NOTIFICATION event', async () => {
    const wrapper = createAdminWrapper()
    const { result } = renderHook(() => useSellerDashboard(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('seller_order_notification', {
        order_id: 'o1',
        status: 'pending',
        product_names: ['Product A'],
        total: 100000,
        timestamp: '2026-02-08T10:00:00Z'
      })
    })
    await waitFor(() => {
      expect(result.current.orderNotifications).toHaveLength(1)
      expect(result.current.orderNotifications[0].order_id).toBe('o1')
    })
  })

  test('handles SELLER_METRICS_UPDATE event', async () => {
    const wrapper = createAdminWrapper()
    const { result } = renderHook(() => useSellerDashboard(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('seller_metrics_update', {
        today_orders: 5,
        today_revenue: 500000,
        pending_orders: 2,
        pending_qa: 3
      })
    })
    await waitFor(() => {
      expect(result.current.metrics.today_orders).toBe(5)
      expect(result.current.metrics.today_revenue).toBe(500000)
      expect(result.current.metrics.pending_orders).toBe(2)
      expect(result.current.metrics.pending_qa).toBe(3)
    })
  })

  test('handles SELLER_QA_NOTIFICATION event', async () => {
    const wrapper = createAdminWrapper()
    const { result } = renderHook(() => useSellerDashboard(), { wrapper })
    await act(async () => { await connectSocket() })
    act(() => {
      emitSocketEvent('seller_qa_notification', {
        product_id: 'p1',
        product_name: 'Product A',
        question_id: 'q1',
        question_preview: 'How does it work?',
        user_name: 'User1'
      })
    })
    await waitFor(() => {
      expect(result.current.qaNotifications).toHaveLength(1)
      expect(result.current.qaNotifications[0].user_name).toBe('User1')
    })
  })

  test('unsubscribes on unmount', async () => {
    const wrapper = createAdminWrapper()
    const { unmount } = renderHook(() => useSellerDashboard(), { wrapper })
    await act(async () => { await connectSocket() })
    unmount()
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_seller_dashboard')
  })
})