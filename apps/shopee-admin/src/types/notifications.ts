import type { User } from '@shopee/shared-types'

export interface Notification {
  _id: string
  user?: User | string
  title: string
  message: string
  type: 'targeted' | 'broadcast'
  is_read: boolean
  createdAt: string
}
