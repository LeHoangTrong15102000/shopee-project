import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import UserSideNav from '../UserSideNav'

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/contexts/app.context', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  return {
    AppContext: React.createContext({
      profile: { name: 'Test User', avatar: 'test.jpg' },
      isAuthenticated: true,
    }),
  }
})

vi.mock('src/utils/utils', () => ({
  getAvatarUrl: (avatar?: string) => avatar || 'default-avatar.jpg',
}))

vi.mock('src/components/MobileAccountNav', () => ({
  default: () => <div data-testid="mobile-nav">MobileNav</div>,
}))

const renderWithRouter = (initialEntry = '/user/profile') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <UserSideNav />
    </MemoryRouter>,
  )

describe('UserSideNav', () => {
  it('renders mobile nav component', () => {
    renderWithRouter()
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()
  })

  it('shows user name from context', () => {
    renderWithRouter()
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('shows edit profile link', () => {
    renderWithRouter()
    expect(screen.getByText('Sửa hồ sơ')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderWithRouter()
    expect(screen.getByText('Tài khoản của tôi')).toBeInTheDocument()
    expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument()
    expect(screen.getByText('Đơn mua')).toBeInTheDocument()
    expect(screen.getByText('Đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Điểm danh')).toBeInTheDocument()
    expect(screen.getByText('Địa chỉ')).toBeInTheDocument()
    expect(screen.getByText('Thông báo')).toBeInTheDocument()
  })

  it('renders conversations link', () => {
    renderWithRouter()
    expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument()
  })

  it('renders avatar image', () => {
    renderWithRouter()
    const avatar = screen.getByAltText('avatar_profile')
    expect(avatar).toBeInTheDocument()
  })

  it('renders with different active route', () => {
    renderWithRouter('/user/password')
    expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument()
  })
})
