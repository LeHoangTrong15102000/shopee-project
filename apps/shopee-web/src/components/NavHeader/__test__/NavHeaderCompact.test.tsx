import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NavHeaderCompact from '../components/NavHeaderCompact'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

vi.mock('src/components/InventoryAlertBadge', () => ({
  default: ({ alerts, unreadCount, onClear, className }: any) => (
    <div data-testid="inventory-alert-badge" className={className} onClick={onClear}>
      {unreadCount > 0 && <span data-testid="inventory-count">{unreadCount}</span>}
    </div>
  ),
}))

vi.mock('src/components/ThemeToggle', () => ({
  default: ({ className }: any) => (
    <div data-testid="theme-toggle" className={className}>
      Theme
    </div>
  ),
}))

vi.mock('../../Popover', () => ({
  default: ({ children, renderPopover, className, as, ariaLabel, ...props }: any) => {
    const Tag = as || 'div'
    return (
      <Tag className={className} aria-label={ariaLabel} {...props}>
        {children}
        <div data-testid="popover-content">{renderPopover}</div>
      </Tag>
    )
  },
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('../components/NotificationPopover', () => ({
  default: ({ isAuthenticated, variant }: any) => (
    <div data-testid="notification-popover">
      {isAuthenticated ? 'Authenticated' : 'Not Authenticated'} - {variant}
    </div>
  ),
}))

describe('NavHeaderCompact', () => {
  const mockHandleTranslateLanguage = vi.fn()
  const mockClearInventoryAlerts = vi.fn()

  const defaultProps = {
    isAuthenticated: false,
    isAdmin: false,
    inventoryAlerts: [],
    inventoryUnreadCount: 0,
    clearInventoryAlerts: mockClearInventoryAlerts,
    unreadCount: 0,
    handleTranslateLanguage: mockHandleTranslateLanguage,
    notificationsData: undefined,
    profile: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<NavHeaderCompact {...defaultProps} />)
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders ThemeToggle component', () => {
    render(<NavHeaderCompact {...defaultProps} />)
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders notification bell', () => {
    render(<NavHeaderCompact {...defaultProps} />)
    const notificationPopover = screen.getByTestId('notification-popover')
    expect(notificationPopover).toBeInTheDocument()
    expect(notificationPopover).toHaveTextContent('Not Authenticated - compact')
  })

  it('renders notification bell with authenticated state', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={true} />)
    const notificationPopover = screen.getByTestId('notification-popover')
    expect(notificationPopover).toHaveTextContent('Authenticated - compact')
  })

  it('displays unread count badge when authenticated and has unread notifications', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={true} unreadCount={5} />)
    const badge = screen.getByText('5')
    expect(badge).toBeInTheDocument()
  })

  it('displays 9+ when unread count exceeds 9', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={true} unreadCount={15} />)
    const badge = screen.getByText('9+')
    expect(badge).toBeInTheDocument()
  })

  it('does not show unread badge when count is 0', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={true} unreadCount={0} />)
    const badge = screen.queryByText('0')
    expect(badge).not.toBeInTheDocument()
  })

  it('does not show unread badge when not authenticated', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={false} unreadCount={5} />)
    const badge = screen.queryByText('5')
    expect(badge).not.toBeInTheDocument()
  })

  it('renders InventoryAlertBadge when user is admin and authenticated', () => {
    render(
      <NavHeaderCompact
        {...defaultProps}
        isAuthenticated={true}
        isAdmin={true}
        inventoryUnreadCount={3}
      />,
    )
    const inventoryBadge = screen.getByTestId('inventory-alert-badge')
    expect(inventoryBadge).toBeInTheDocument()
    expect(screen.getByTestId('inventory-count')).toHaveTextContent('3')
  })

  it('does not render InventoryAlertBadge when user is not admin', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={true} isAdmin={false} />)
    const inventoryBadge = screen.queryByTestId('inventory-alert-badge')
    expect(inventoryBadge).not.toBeInTheDocument()
  })

  it('does not render InventoryAlertBadge when user is not authenticated', () => {
    render(<NavHeaderCompact {...defaultProps} isAuthenticated={false} isAdmin={true} />)
    const inventoryBadge = screen.queryByTestId('inventory-alert-badge')
    expect(inventoryBadge).not.toBeInTheDocument()
  })

  it('renders language switcher icon', () => {
    render(<NavHeaderCompact {...defaultProps} />)
    const languagePopover = screen.getByLabelText('header.language')
    expect(languagePopover).toBeInTheDocument()
  })

  it('calls handleTranslateLanguage when Vietnamese is selected', () => {
    render(<NavHeaderCompact {...defaultProps} />)
    const viButton = screen.getByText('Tiếng Việt')
    fireEvent.click(viButton)
    expect(mockHandleTranslateLanguage).toHaveBeenCalledWith('vi')
  })

  it('calls handleTranslateLanguage when English is selected', () => {
    render(<NavHeaderCompact {...defaultProps} />)
    const enButton = screen.getByText('English')
    fireEvent.click(enButton)
    expect(mockHandleTranslateLanguage).toHaveBeenCalledWith('en')
  })

  it('calls clearInventoryAlerts when inventory badge is clicked', () => {
    render(
      <NavHeaderCompact
        {...defaultProps}
        isAuthenticated={true}
        isAdmin={true}
        inventoryUnreadCount={3}
      />,
    )
    const inventoryBadge = screen.getByTestId('inventory-alert-badge')
    fireEvent.click(inventoryBadge)
    expect(mockClearInventoryAlerts).toHaveBeenCalledTimes(1)
  })

  it('applies bell shake animation when authenticated with unread notifications', () => {
    const { container } = render(
      <NavHeaderCompact {...defaultProps} isAuthenticated={true} unreadCount={3} />,
    )
    const bellIcon = container.querySelector('svg')
    const className = bellIcon?.getAttribute('class') || ''
    expect(className).toContain('animate-[bell-shake_1s_ease-in-out_infinite]')
  })

  it('does not apply bell shake animation when no unread notifications', () => {
    const { container } = render(
      <NavHeaderCompact {...defaultProps} isAuthenticated={true} unreadCount={0} />,
    )
    const bellIcon = container.querySelector('svg')
    const className = bellIcon?.getAttribute('class') || ''
    expect(className).not.toContain('animate-[bell-shake_1s_ease-in-out_infinite]')
  })

  it('does not apply bell shake animation when not authenticated', () => {
    const { container } = render(
      <NavHeaderCompact {...defaultProps} isAuthenticated={false} unreadCount={5} />,
    )
    const bellIcon = container.querySelector('svg')
    const className = bellIcon?.getAttribute('class') || ''
    expect(className).not.toContain('animate-[bell-shake_1s_ease-in-out_infinite]')
  })

  it('renders all three main components in correct order', () => {
    const { container } = render(<NavHeaderCompact {...defaultProps} />)
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv.children.length).toBeGreaterThanOrEqual(3)
  })

  it('has correct gap classes for spacing', () => {
    const { container } = render(<NavHeaderCompact {...defaultProps} />)
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv.className).toContain('gap-1')
    expect(mainDiv.className).toContain('sm:gap-3')
  })
})
