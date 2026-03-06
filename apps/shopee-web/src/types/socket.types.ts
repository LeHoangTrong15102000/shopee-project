// Socket event names - mirror backend SocketEvent enum
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECTED = 'connected',
  SERVER_SHUTDOWN = 'server_shutdown',
  TOKEN_EXPIRED = 'token_expired',
  AUTH_ERROR = 'auth_error',

  // Chat events
  JOIN_CHAT = 'join_chat',
  LEAVE_CHAT = 'leave_chat',
  SEND_MESSAGE = 'send_message',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_DELIVERED = 'message_delivered',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  USER_TYPING = 'user_typing',
  USER_STOPPED_TYPING = 'user_stopped_typing',

  // Notification events
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',

  // Room events
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',

  // Product room events
  SUBSCRIBE_PRODUCT = 'subscribe_product',
  UNSUBSCRIBE_PRODUCT = 'unsubscribe_product',
  PRICE_UPDATED = 'price_updated',
  PRICE_ALERT_TRIGGERED = 'price_alert_triggered',
  INVENTORY_ALERT = 'inventory_alert',

  // Presence events
  PRESENCE_UPDATE = 'presence_update',
  GET_PRESENCE = 'get_presence',
  PRESENCE_STATUS = 'presence_status',

  // Order tracking events
  SUBSCRIBE_ORDER = 'subscribe_order',
  UNSUBSCRIBE_ORDER = 'unsubscribe_order',
  ORDER_STATUS_UPDATED = 'order_status_updated',

  // Flash sale events
  SUBSCRIBE_FLASH_SALE = 'subscribe_flash_sale',
  UNSUBSCRIBE_FLASH_SALE = 'unsubscribe_flash_sale',
  FLASH_SALE_TICK = 'flash_sale_tick',
  FLASH_SALE_STOCK_UPDATE = 'flash_sale_stock_update',

  // Viewer count events
  VIEWER_COUNT_UPDATE = 'viewer_count_update',

  // Cart sync events
  CART_UPDATED = 'cart_updated',
  CART_SYNC = 'cart_sync',

  // Live Reviews events (Phase 3)
  NEW_REVIEW = 'new_review',
  NEW_REVIEW_COMMENT = 'new_review_comment',
  REVIEW_LIKED = 'review_liked',

  // Live Q&A events (Phase 3)
  NEW_QUESTION = 'new_question',
  NEW_ANSWER = 'new_answer',
  QUESTION_LIKED = 'question_liked',

  // Activity feed events (Phase 3)
  ACTIVITY_EVENT = 'activity_event',
  ACTIVITY_BUFFER = 'activity_buffer',

  // Seller dashboard events (Phase 3)
  SUBSCRIBE_SELLER_DASHBOARD = 'subscribe_seller_dashboard',
  UNSUBSCRIBE_SELLER_DASHBOARD = 'unsubscribe_seller_dashboard',
  SELLER_ORDER_NOTIFICATION = 'seller_order_notification',
  SELLER_METRICS_UPDATE = 'seller_metrics_update',
  SELLER_QA_NOTIFICATION = 'seller_qa_notification',

  // Error events
  ERROR = 'error',
  RATE_LIMITED = 'rate_limited'
}

// Payloads - mirror backend types
export interface SendMessagePayload {
  chat_id: string
  message: string
  message_type?: 'text'
}

export interface MessageReceivedPayload {
  _id: string
  chat_id: string
  sender: {
    _id: string
    name: string
    avatar?: string
  }
  content: string
  message_type: 'text'
  status: 'sent' | 'delivered' | 'read'
  created_at: string
}

export interface JoinChatPayload {
  chat_id: string
}

export interface TypingPayload {
  chat_id: string
}

export interface UserTypingPayload {
  chat_id: string
  user_id: string
  user_name: string
}

export interface NotificationPayload {
  _id: string
  title: string
  content: string
  type: 'order' | 'promotion' | 'system' | 'other'
  link?: string
  created_at: string
}

export interface MessageDeliveredPayload {
  message_id: string
  chat_id: string
  status: 'delivered'
}

export interface SocketErrorPayload {
  code: string
  message: string
}

export interface ConnectedPayload {
  user_id: string
  socket_id: string
}

// Product subscription payload (client -> server)
export interface SubscribeProductPayload {
  product_id: string
}

// Price updated payload (server -> client)
export interface PriceUpdatedPayload {
  product_id: string
  old_price: number
  new_price: number
  old_price_before_discount: number
  new_price_before_discount: number
}

// Price alert triggered payload (server -> client)
export interface PriceAlertTriggeredPayload {
  alert_id: string
  product_id: string
  product_name: string
  target_price: number
  new_price: number
}

// Inventory alert payload (server -> client)
export interface InventoryAlertPayload {
  product_id: string
  product_name: string
  current_quantity: number
  threshold: number
  severity: 'warning' | 'critical'
}

// Presence types
export type PresenceStatus = 'online' | 'offline'

// Presence update payload (server -> client)
export interface PresenceUpdatePayload {
  user_id: string
  status: PresenceStatus
  last_seen?: string | null
}

// Get presence payload (client -> server)
export interface GetPresencePayload {
  user_id: string
}

// Presence status response payload (server -> client)
export interface PresenceStatusPayload {
  user_id: string
  status: PresenceStatus
  last_seen?: string | null
}

// --- Phase 2: Order Tracking Payloads ---

// Order subscription payload (client -> server)
export interface SubscribeOrderPayload {
  order_id: string
}

// Order status updated payload (server -> client)
export interface OrderStatusUpdatedPayload {
  order_id: string
  old_status: string
  new_status: string
  updated_at: string
  message?: string
}

// --- Phase 2: Flash Sale Payloads ---

// Flash sale subscription payload (client -> server)
export interface SubscribeFlashSalePayload {
  sale_id: string
}

// Flash sale tick payload (server -> client, every 1s)
export interface FlashSaleTickProduct {
  product_id: string
  current_stock: number
  sold: number
}

export interface FlashSaleTickPayload {
  sale_id: string
  remaining_seconds: number
  products: FlashSaleTickProduct[]
}

// Flash sale stock update payload (server -> client, on purchase)
export interface FlashSaleStockUpdatePayload {
  sale_id: string
  product_id: string
  current_stock: number
  sold: number
  buyer_name?: string
}

// --- Phase 2: Viewer Count Payloads ---

// Viewer count update payload (server -> client)
export interface ViewerCountUpdatePayload {
  product_id: string
  viewer_count: number
}

// --- Phase 2: Cart Sync Payloads ---

// Cart updated payload (server -> client, invalidation signal)
export interface CartUpdatedPayload {
  user_id: string
  action: 'add' | 'update' | 'delete' | 'buy'
  product_id?: string
  timestamp: string
}

// Cart sync payload (client -> server, notify server of cart change)
export interface CartSyncPayload {
  action: 'add' | 'update' | 'delete' | 'buy'
  product_id?: string
  buy_count?: number
}

// --- Phase 3: Live Reviews Payloads ---

// New review payload (server -> client)
export interface NewReviewPayload {
  product_id: string
  review: {
    _id: string
    user: { name: string; avatar?: string }
    rating: number
    comment: string
    images: string[]
    createdAt: string
  }
}

// New review comment payload (server -> client)
export interface NewReviewCommentPayload {
  product_id: string
  review_id: string
  comment: {
    _id: string
    user: { name: string; avatar?: string }
    content: string
    parent_comment?: string
    level: number
    createdAt: string
  }
}

// Review liked payload (server -> client)
export interface ReviewLikedPayload {
  product_id: string
  review_id: string
  helpful_count: number
}

// --- Phase 3: Live Q&A Payloads ---

// New question payload (server -> client)
export interface NewQuestionPayload {
  product_id: string
  question: {
    _id: string
    user_name: string
    user_avatar?: string
    question: string
    createdAt: string
  }
}

// New answer payload (server -> client)
export interface NewAnswerPayload {
  product_id: string
  question_id: string
  answer: {
    user_name: string
    user_avatar?: string
    answer: string
    is_seller: boolean
    createdAt: string
  }
}

// Question liked payload (server -> client)
export interface QuestionLikedPayload {
  product_id: string
  question_id: string
  likes_count: number
}

// --- Phase 3: Activity Feed Payloads ---

// Activity event payload (server -> client)
export interface ActivityEventPayload {
  product_id: string
  type: 'purchase' | 'review'
  message: string
  timestamp: string
}

// Activity buffer payload (server -> client, on room join)
export interface ActivityBufferPayload {
  product_id: string
  activities: ActivityEventPayload[]
}

// --- Phase 3: Seller Dashboard Payloads ---

// Seller order notification payload (server -> client)
export interface SellerOrderNotificationPayload {
  order_id: string
  status: string
  product_names: string[]
  total: number
  timestamp: string
}

// Seller metrics update payload (server -> client)
export interface SellerMetricsUpdatePayload {
  today_orders: number
  today_revenue: number
  pending_orders: number
  pending_qa: number
}

// Seller Q&A notification payload (server -> client)
export interface SellerQANotificationPayload {
  product_id: string
  product_name: string
  question_id: string
  question_preview: string
  user_name: string
}

// Connection status type for UI
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'
