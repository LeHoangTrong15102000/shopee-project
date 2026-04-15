import { createMockDashboardOverview } from 'src/test-utils/factories'
import type {
  DashboardOverview,
  RevenueData,
  OrderTrendData,
  UserGrowthData,
  TopProduct,
  TopBuyer,
} from 'src/types'

export const mockDashboardOverview: DashboardOverview = createMockDashboardOverview()

export const mockRevenueData: RevenueData[] = [
  { date: '2024-01-01', revenue: 50000000 },
  { date: '2024-01-02', revenue: 65000000 },
  { date: '2024-01-03', revenue: 45000000 },
  { date: '2024-01-04', revenue: 80000000 },
  { date: '2024-01-05', revenue: 72000000 },
]

export const mockOrderTrends: OrderTrendData[] = [
  { date: '2024-01-01', orders: 120 },
  { date: '2024-01-02', orders: 150 },
  { date: '2024-01-03', orders: 100 },
  { date: '2024-01-04', orders: 180 },
  { date: '2024-01-05', orders: 160 },
]

export const mockUserGrowth: UserGrowthData[] = [
  { date: '2024-01-01', users: 50 },
  { date: '2024-01-02', users: 65 },
  { date: '2024-01-03', users: 40 },
  { date: '2024-01-04', users: 80 },
  { date: '2024-01-05', users: 70 },
]

export const mockTopProducts: TopProduct[] = [
  {
    _id: 'prod-1',
    name: 'iPhone 15 Pro Max',
    image: 'https://example.com/iphone.jpg',
    revenue: 150000000,
    sold: 50,
  },
  {
    _id: 'prod-2',
    name: 'Samsung Galaxy S24',
    image: 'https://example.com/samsung.jpg',
    revenue: 120000000,
    sold: 40,
  },
  {
    _id: 'prod-3',
    name: 'MacBook Pro M3',
    image: 'https://example.com/macbook.jpg',
    revenue: 100000000,
    sold: 20,
  },
]

export const mockTopBuyers: TopBuyer[] = [
  {
    _id: 'user-2',
    name: 'Nguyễn Văn A',
    email: 'nguyen@example.com',
    total_spent: 50000000,
    total_orders: 15,
  },
  {
    _id: 'user-3',
    name: 'Trần Thị B',
    email: 'tran@example.com',
    total_spent: 35000000,
    total_orders: 10,
  },
  {
    _id: 'user-4',
    name: 'Lê Văn C',
    email: 'le@example.com',
    total_spent: 20000000,
    total_orders: 8,
  },
]
