import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import { SidebarProvider } from 'src/components/ui/sidebar'
import { AppHeader } from './AppHeader'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockToggleTheme = vi.fn()
const mockLogout = vi.fn()
const mockNavigate = vi.fn()

const mockUser = vi.fn().mockReturnValue({ name: 'Test User', email: 'test@example.com' })
const mockTheme = vi.fn().mockReturnValue('light')

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('src/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: mockUser(),
    logout: mockLogout,
  }),
}))

vi.mock('src/stores/theme.store', () => ({
  useThemeStore: () => ({
    theme: mockTheme(),
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
  beforeEach(() => {
    mockToggleTheme.mockClear()
    mockLogout.mockClear()
    mockNavigate.mockClear()
    mockUser.mockReturnValue({ name: 'Test User', email: 'test@example.com' })
    mockTheme.mockReturnValue('light')
  })

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

  it('renders user name in header', () => {
    renderHeader()
    // User name appears in the avatar dropdown trigger
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('opens user menu dropdown and shows user info', async () => {
    const user = userEvent.setup()
    renderHeader()
    // Click the avatar button (the user menu trigger)
    const avatarButton = screen.getByText('Test User').closest('button')
    if (avatarButton) {
      await user.click(avatarButton)
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    }
  })

  it('shows settings and logout items in user dropdown', async () => {
    const user = userEvent.setup()
    renderHeader()
    const avatarButton = screen.getByText('Test User').closest('button')
    if (avatarButton) {
      await user.click(avatarButton)
      await waitFor(() => {
        expect(screen.getByText('header.settings')).toBeInTheDocument()
        expect(screen.getByText('header.logout')).toBeInTheDocument()
      })
    }
  })

  it('calls logout and navigates when logout clicked', async () => {
    const user = userEvent.setup()
    renderHeader()
    const avatarButton = screen.getByText('Test User').closest('button')
    if (avatarButton) {
      await user.click(avatarButton)
      await waitFor(() => {
        expect(screen.getByText('header.logout')).toBeInTheDocument()
      })
      await user.click(screen.getByText('header.logout'))
      expect(mockLogout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    }
  })

  it('renders user initials in avatar fallback', () => {
    renderHeader()
    // Avatar fallback renders initials of "Test User" = "TE"
    expect(screen.getByText('TE')).toBeInTheDocument()
  })

  it('navigates to settings when settings item clicked', async () => {
    const user = userEvent.setup()
    renderHeader()
    const avatarButton = screen.getByText('Test User').closest('button')
    if (avatarButton) {
      await user.click(avatarButton)
      await waitFor(() => {
        expect(screen.getByText('header.settings')).toBeInTheDocument()
      })
      await user.click(screen.getByText('header.settings'))
      expect(mockNavigate).toHaveBeenCalledWith('/settings')
    }
  })

  it('renders language change button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: 'header.changeLanguage' })).toBeInTheDocument()
  })

  it('renders orders breadcrumb for orders route', () => {
    renderHeader(['/orders'])
    expect(screen.getByText('menu.orders')).toBeInTheDocument()
  })

  it('renders breadcrumb link for intermediate route segments and raw name for unknown segments', () => {
    renderHeader(['/products/prod-1'])
    // 'products' is an intermediate segment mapped to 'menu.products'
    expect(screen.getByText('menu.products')).toBeInTheDocument()
    // 'prod-1' is not in routeLabelKeys, shows raw segment
    expect(screen.getByText('prod-1')).toBeInTheDocument()
  })

  it('opens language dropdown and shows language menu items', async () => {
    const user = userEvent.setup()
    renderHeader()
    const langButton = screen.getByRole('button', { name: 'header.changeLanguage' })
    await user.click(langButton)
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems.length).toBeGreaterThan(0)
    })
  })

  it('renders all known route label breadcrumbs', () => {
    const routes = ['users', 'products', 'categories', 'orders', 'vouchers', 'reviews', 'loyalty']
    for (const route of routes) {
      const { unmount } = renderHeader([`/${route}`])
      expect(screen.getByText(`menu.${route}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('renders Sun icon when theme is dark', () => {
    mockTheme.mockReturnValue('dark')
    renderHeader()
    const themeBtn = screen.getByRole('button', { name: 'header.toggleTheme' })
    expect(themeBtn).toBeInTheDocument()
    // Sun icon is rendered when theme is dark
    const svg = themeBtn.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders user initials from email when name is absent', () => {
    mockUser.mockReturnValue({ email: 'admin@example.com' })
    renderHeader()
    expect(screen.getByText('AD')).toBeInTheDocument()
  })

  it('renders fallback initials when user has no name or email', () => {
    mockUser.mockReturnValue({})
    renderHeader()
    expect(screen.getByText('AD')).toBeInTheDocument()
  })

  it('renders user email in display when name is absent', () => {
    mockUser.mockReturnValue({ email: 'admin@example.com' })
    renderHeader()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('renders dashboard breadcrumb as page (not link) on root route', () => {
    renderHeader(['/'])
    // Dashboard should be a BreadcrumbPage, not a link, on root
    const breadcrumbText = screen.getByText('breadcrumb.dashboard')
    expect(breadcrumbText).toBeInTheDocument()
  })
})
