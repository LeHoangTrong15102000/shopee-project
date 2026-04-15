import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import { SidebarProvider } from 'src/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('src/hooks/useNotifications', () => ({
  useNotificationUnreadCount: () => ({ data: 5 }),
}))

const renderSidebar = (initialEntries = ['/']) => {
  return renderWithProviders(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
    { initialEntries },
  )
}

describe('AppSidebar', () => {
  it('renders navigation items', () => {
    renderSidebar()
    expect(screen.getByText('menu.overview')).toBeInTheDocument()
    expect(screen.getByText('menu.users')).toBeInTheDocument()
    expect(screen.getByText('menu.products')).toBeInTheDocument()
  })

  it('renders brand name', () => {
    renderSidebar()
    expect(screen.getByText('brand')).toBeInTheDocument()
  })

  it('shows unread notification badge', () => {
    renderSidebar()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders all main navigation sections', () => {
    renderSidebar()
    expect(screen.getByText('menu.orders')).toBeInTheDocument()
    expect(screen.getByText('menu.categories')).toBeInTheDocument()
  })

  it('renders with different route', () => {
    renderSidebar(['/products'])
    expect(screen.getByText('menu.products')).toBeInTheDocument()
  })
})
