import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import NavHeaderFull from '../components/NavHeaderFull';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('src/components/InventoryAlertBadge', () => ({
  default: ({ alerts, unreadCount, onClear, className }: any) => (
    <div data-testid="inventory-alert-badge" className={className} onClick={onClear}>
      {unreadCount > 0 && <span>{unreadCount}</span>}
    </div>
  ),
}));

vi.mock('src/components/ThemeToggle', () => ({
  default: ({ className }: any) => (
    <div data-testid="theme-toggle" className={className}>
      Theme
    </div>
  ),
}));

vi.mock('../../Popover', () => ({
  default: ({ children, renderPopover, className, as, ...props }: any) => {
    const Tag = as || 'div';
    return (
      <Tag className={className} {...props}>
        {children}
        <div data-testid="popover-content">{renderPopover}</div>
      </Tag>
    );
  },
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../components/NotificationPopover', () => ({
  default: ({ isAuthenticated, variant }: any) => (
    <div data-testid="notification-popover">
      {isAuthenticated ? 'Authenticated' : 'Not Authenticated'} - {variant}
    </div>
  ),
}));

vi.mock('../components/AppDownloadPopover', () => ({
  default: () => <div data-testid="app-download-popover">Download App</div>,
}));

vi.mock('src/utils/utils', () => ({
  getAvatarUrl: (avatar: string) => avatar || 'default-avatar.png',
}));

describe('NavHeaderFull', () => {
  const mockHandleLogout = vi.fn();
  const mockHandleTranslateLanguage = vi.fn();
  const mockClearInventoryAlerts = vi.fn();

  const defaultProps = {
    isAuthenticated: false,
    isAdmin: false,
    inventoryAlerts: [],
    inventoryUnreadCount: 0,
    clearInventoryAlerts: mockClearInventoryAlerts,
    unreadCount: 0,
    handleTranslateLanguage: mockHandleTranslateLanguage,
    currentLanguage: 'vi',
    profile: null,
    handleLogout: mockHandleLogout,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<NavHeaderFull {...defaultProps} />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders ThemeToggle component', () => {
    render(<NavHeaderFull {...defaultProps} />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders notification bell with unread count badge when authenticated', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} unreadCount={5} />);
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('displays 9+ when unread count exceeds 9', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} unreadCount={15} />);
    const badge = screen.getByText('9+');
    expect(badge).toBeInTheDocument();
  });

  it('does not show unread badge when count is 0', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} unreadCount={0} />);
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('renders InventoryAlertBadge when user is admin and authenticated', () => {
    render(
      <NavHeaderFull
        {...defaultProps}
        isAuthenticated={true}
        isAdmin={true}
        inventoryUnreadCount={3}
      />,
    );
    const inventoryBadge = screen.getByTestId('inventory-alert-badge');
    expect(inventoryBadge).toBeInTheDocument();
  });

  it('does not render InventoryAlertBadge when user is not admin', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} isAdmin={false} />);
    const inventoryBadge = screen.queryByTestId('inventory-alert-badge');
    expect(inventoryBadge).not.toBeInTheDocument();
  });

  it('renders auth links when not authenticated', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={false} />);
    const registerLink = screen.getByText('header.register');
    const loginLink = screen.getByText('header.login');
    expect(registerLink).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
  });

  it('renders user menu when authenticated', () => {
    const profile = { email: 'test@example.com', avatar: 'avatar.png' };
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} profile={profile} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls handleLogout when logout button is clicked', () => {
    const profile = { email: 'test@example.com', avatar: 'avatar.png' };
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} profile={profile} />);
    const logoutButton = screen.getByText('header.logout');
    fireEvent.click(logoutButton);
    expect(mockHandleLogout).toHaveBeenCalledTimes(1);
  });

  it('renders language popover with current language', () => {
    render(<NavHeaderFull {...defaultProps} currentLanguage="en" />);
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('calls handleTranslateLanguage when language is changed to Vietnamese', () => {
    render(<NavHeaderFull {...defaultProps} />);
    const viButton = screen.getByText('Tiếng Việt');
    fireEvent.click(viButton);
    expect(mockHandleTranslateLanguage).toHaveBeenCalledWith('vi');
  });

  it('calls handleTranslateLanguage when language is changed to English', () => {
    render(<NavHeaderFull {...defaultProps} />);
    const enButton = screen.getByText('English');
    fireEvent.click(enButton);
    expect(mockHandleTranslateLanguage).toHaveBeenCalledWith('en');
  });

  it('renders authenticated left section when user is authenticated', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} />);
    expect(screen.getByText('header.sellerChannel')).toBeInTheDocument();
    expect(screen.getByText('header.downloadApp')).toBeInTheDocument();
    expect(screen.getByText('header.connect')).toBeInTheDocument();
  });

  it('renders unauthenticated left section when user is not authenticated', () => {
    render(<NavHeaderFull {...defaultProps} isAuthenticated={false} />);
    expect(screen.getByText('header.sellerChannel')).toBeInTheDocument();
    expect(screen.getByText('header.becomeSeller')).toBeInTheDocument();
    expect(screen.getByText('header.downloadApp')).toBeInTheDocument();
  });

  it('renders support link', () => {
    render(<NavHeaderFull {...defaultProps} />);
    expect(screen.getByText('header.support')).toBeInTheDocument();
  });

  it('renders social links', () => {
    render(<NavHeaderFull {...defaultProps} />);
    const links = screen.getAllByRole('link');
    const facebookLink = links.find(
      (link) => link.getAttribute('href') === 'https://www.facebook.com/ShopeeVN',
    );
    const instagramLink = links.find(
      (link) => link.getAttribute('href') === 'https://instagram.com/Shopee_VN',
    );
    expect(facebookLink).toBeInTheDocument();
    expect(instagramLink).toBeInTheDocument();
  });

  it('renders user avatar with correct src', () => {
    const profile = { email: 'test@example.com', avatar: 'custom-avatar.png' };
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} profile={profile} />);
    const avatar = screen.getByAltText('avatar');
    expect(avatar).toHaveAttribute('src', 'custom-avatar.png');
  });

  it('renders default avatar when profile avatar is null', () => {
    const profile = { email: 'test@example.com', avatar: null };
    render(<NavHeaderFull {...defaultProps} isAuthenticated={true} profile={profile} />);
    const avatar = screen.getByAltText('avatar');
    expect(avatar).toHaveAttribute('src', 'default-avatar.png');
  });

  it('calls clearInventoryAlerts when inventory badge is clicked', () => {
    render(
      <NavHeaderFull
        {...defaultProps}
        isAuthenticated={true}
        isAdmin={true}
        inventoryUnreadCount={3}
      />,
    );
    const inventoryBadge = screen.getByTestId('inventory-alert-badge');
    fireEvent.click(inventoryBadge);
    expect(mockClearInventoryAlerts).toHaveBeenCalledTimes(1);
  });
});
