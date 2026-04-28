import http from '@/utils/http'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

export interface XuTransaction {
  id: string
  amount: number
  type: 'earned' | 'spent' | 'expired'
  description: string
  date: string
}

export interface XuHistoryResponse {
  transactions: XuTransaction[]
  total: number
  page: number
  limit: number
  balance: number
}

// ─── Internal backend shape ───────────────────────────────────────────────────

interface BackendTransaction {
  _id: string
  type: 'earn' | 'redeem' | 'expire' | 'bonus'
  points: number
  description: string
  created_at: string
}

interface BackendTransactionsData {
  transactions: BackendTransaction[]
  balance?: number
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

function mapTransactionType(type: BackendTransaction['type']): XuTransaction['type'] {
  if (type === 'redeem') return 'spent'
  if (type === 'expire') return 'expired'
  return 'earned'
}

// ─── Xu API ───────────────────────────────────────────────────────────────────

export interface XuPointsResponse {
  available_points: number
  total_points: number
  tier: string
}

export async function getXuPoints(): Promise<XuPointsResponse> {
  const res = await http.get<ApiResponse<XuPointsResponse>>('loyalty/points')
  return res.data.data
}

export async function getXuHistory(page: number, limit: number): Promise<XuHistoryResponse> {
  const res = await http.get<ApiResponse<BackendTransactionsData>>('loyalty/transactions', {
    params: { page, limit },
  })
  const { transactions, pagination, balance } = res.data.data
  return {
    transactions: transactions.map((t) => ({
      id: t._id,
      amount: t.points,
      type: mapTransactionType(t.type),
      description: t.description,
      date: t.created_at,
    })),
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    balance: balance ?? 0,
  }
}
