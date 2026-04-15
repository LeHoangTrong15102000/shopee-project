import { createMockUser } from 'src/test-utils/factories'
import type { User } from 'src/types'

export const mockUsers: User[] = [
  createMockUser({ _id: 'user-1', email: 'admin@shopee.com', name: 'Admin', roles: ['Admin'] }),
  createMockUser({
    _id: 'user-2',
    email: 'nguyen@example.com',
    name: 'Nguyễn Văn A',
    roles: ['User'],
  }),
  createMockUser({ _id: 'user-3', email: 'tran@example.com', name: 'Trần Thị B', roles: ['User'] }),
  createMockUser({ _id: 'user-4', email: 'le@example.com', name: 'Lê Văn C', roles: ['User'] }),
  createMockUser({
    _id: 'user-5',
    email: 'pham@example.com',
    name: 'Phạm Thị D',
    roles: ['User', 'Seller'],
  }),
]
