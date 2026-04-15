import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import AdminLayout from './AdminLayout'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  }
})

vi.mock('src/hooks/useNotifications', () => ({
  useNotificationUnreadCount: () => ({ data: 0 }),
}))

describe('AdminLayout', () => {
  it('renders without crashing', () => {
    renderWithProviders(<AdminLayout />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('renders sidebar navigation', () => {
    renderWithProviders(<AdminLayout />)
    expect(screen.getByText('menu.overview')).toBeInTheDocument()
  })

  it('renders outlet content area', () => {
    renderWithProviders(<AdminLayout />)
    expect(screen.getByText('Outlet Content')).toBeInTheDocument()
  })
})
