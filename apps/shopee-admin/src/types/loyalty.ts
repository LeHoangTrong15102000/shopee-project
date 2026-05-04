import type { User } from '@shopee/shared-types'

export interface LoyaltyReward {
  _id: string
  name: string
  description: string
  points_required: number
  is_active: boolean
  createdAt: string
  updatedAt: string
}

export interface LoyaltyTransaction {
  _id: string
  user: User | string
  type: 'earn' | 'redeem' | 'adjust'
  points: number
  description: string
  createdAt: string
}
