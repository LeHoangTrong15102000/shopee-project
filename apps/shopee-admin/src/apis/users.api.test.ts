import { describe, it, expect, vi, beforeEach } from 'vitest'
import usersApi from './users.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('users.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getUsers calls GET /admin/users with params', () => {
    usersApi.getUsers({ page: 1, limit: 10, search: 'test' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/users', {
      params: { page: 1, limit: 10, search: 'test' },
    })
  })

  it('getUser calls GET /admin/users/:id', () => {
    usersApi.getUser('user-1')
    expect(mockHttp.get).toHaveBeenCalledWith('admin/users/user-1')
  })

  it('createUser calls POST /admin/users', () => {
    const body = { email: 'test@test.com', password: '123456' }
    usersApi.createUser(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/users', body)
  })

  it('updateUser calls PUT /admin/users/:id', () => {
    usersApi.updateUser('user-1', { name: 'Updated' })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/users/user-1', { name: 'Updated' })
  })

  it('deleteUser calls DELETE /admin/users/delete/:id', () => {
    usersApi.deleteUser('user-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/users/delete/user-1')
  })
})
