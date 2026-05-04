export interface DashboardOverview {
  total_revenue: number
  total_orders: number
  total_users: number
  total_products: number
  revenue_change?: number
  orders_change?: number
  users_change?: number
  products_change?: number
}

export interface RevenueData {
  date: string
  revenue: number
}

export interface OrderTrendData {
  date: string
  orders: number
}

export interface UserGrowthData {
  date: string
  users: number
}

export interface TopProduct {
  _id: string
  name: string
  image: string
  revenue: number
  sold: number
}

export interface TopBuyer {
  _id: string
  name: string
  email: string
  avatar?: string
  total_spent: number
  total_orders: number
}

export interface RevenueByCategoryData {
  category: string
  revenue: number
  percent: number
}

export interface ProductAnalytics {
  _id: string
  name: string
  image: string
  sold?: number
  view?: number
  rating?: number
  revenue?: number
}

export interface ChatbotAnalytics {
  total_conversations: number
  total_messages: number
  avg_messages_per_conversation: number
  satisfaction_rate: number
}

export interface ChatbotPerformanceData {
  date: string
  conversations: number
  messages: number
}
