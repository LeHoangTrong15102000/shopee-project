import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import { SidebarProvider } from 'src/components/ui/sidebar'
import { AppHeader } from './AppHeader'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockToggleTheme = vi.fn()
vi.mock('src/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    logout: vi.fn(),
  }),
}))

vi.mock('src/stores/theme.store', () => ({
  useThemeStore: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}))

const renderHeader = (initialEntries = ['/']) => {
  return renderWithProviders(
    <SidebarProvider>
      <AppHeader />
    </SidebarProvider>,
    { initialEntries },
  )
}

describe('AppHeader', () => {
  beforeEach(() => mockToggleTheme.mockClear())

  it('renders breadcrumb with dashboard', () => {
    renderHeader()
    expect(screen.getByText('breadcrumb.dashboard')).toBeInTheDocument()
  })

  it('renders breadcrumb with route segment', () => {
    renderHeader(['/users'])
    expect(screen.getByText('breadcrumb.dashboard')).toBeInTheDocument()
    expect(screen.getByText('menu.users')).toBeInTheDocument()
  })

  it('renders theme toggle button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: 'header.toggleTheme' })).toBeInTheDocument()
  })

  it('calls toggleTheme when theme button is clicked', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'header.toggleTheme' }))
    expect(mockToggleTheme).toHaveBeenCalled()
  })

  it('renders breadcrumb with nested route', () => {
    renderHeader(['/products/prod-1'])
    expect(screen.getByText('breadcrumb.dashboard')).toBeInTheDocument()
    expect(screen.getByText('menu.products')).toBeInTheDocument()
  })
})
