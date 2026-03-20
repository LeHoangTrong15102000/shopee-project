import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationPopover from '../components/NotificationPopover';

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../../NotificationList', () => ({
  default: () => <div data-testid="notification-list">Notification List</div>,
}));

describe('NotificationPopover', () => {
  it('renders NotificationList when authenticated', () => {
    render(<NotificationPopover isAuthenticated={true} />);
    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
  });

  it('renders NotificationList when authenticated with full variant', () => {
    render(<NotificationPopover isAuthenticated={true} variant="full" />);
    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
  });

  it('renders NotificationList when authenticated with compact variant', () => {
    render(<NotificationPopover isAuthenticated={true} variant="compact" />);
    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
  });

  it('renders unauthenticated compact view when not authenticated with compact variant', () => {
    render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    expect(screen.getByText('Đăng nhập để xem Thông báo')).toBeInTheDocument();
    expect(screen.getByText('Đăng ký')).toBeInTheDocument();
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
  });

  it('renders unauthenticated full view when not authenticated with full variant', () => {
    render(<NotificationPopover isAuthenticated={false} variant="full" />);
    expect(screen.getByText('Đăng nhập để xem Thông báo')).toBeInTheDocument();
    expect(screen.getByText('Đăng ký')).toBeInTheDocument();
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
  });

  it('renders unauthenticated full view by default when not authenticated', () => {
    render(<NotificationPopover isAuthenticated={false} />);
    expect(screen.getByText('Đăng nhập để xem Thông báo')).toBeInTheDocument();
  });

  it('renders notification image in unauthenticated compact view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const image = screen.getByAltText('notification');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      'src',
      'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/99e561e3944805a023e87a81d4869600.png',
    );
  });

  it('renders notification image in unauthenticated full view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="full" />);
    const image = screen.getByAltText('anh');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      'src',
      'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/99e561e3944805a023e87a81d4869600.png',
    );
  });

  it('renders register link with correct href in compact view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const registerLinks = screen.getAllByText('Đăng ký');
    const registerLink = registerLinks[0].closest('a');
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders login link with correct href in compact view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const loginLinks = screen.getAllByText('Đăng nhập');
    const loginLink = loginLinks[0].closest('a');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('renders register link with correct href in full view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="full" />);
    const registerLinks = screen.getAllByText('Đăng ký');
    const registerLink = registerLinks[0].closest('a');
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('renders login link with correct href in full view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="full" />);
    const loginLinks = screen.getAllByText('Đăng nhập');
    const loginLink = loginLinks[0].closest('a');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('applies correct width class for compact variant', () => {
    const { container } = render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const popover = container.querySelector('.w-\\[280px\\]');
    expect(popover).toBeInTheDocument();
  });

  it('applies correct width classes for full variant', () => {
    const { container } = render(<NotificationPopover isAuthenticated={false} variant="full" />);
    const popover = container.querySelector('.w-\\[300px\\]');
    expect(popover).toBeInTheDocument();
  });

  it('has correct height class for unauthenticated views', () => {
    const { container } = render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const popover = container.querySelector('.h-87\\.5');
    expect(popover).toBeInTheDocument();
  });

  it('renders with proper styling classes for compact view', () => {
    const { container } = render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const popover = container.firstChild as HTMLElement;
    expect(popover.className).toContain('rounded-lg');
    expect(popover.className).toContain('border');
    expect(popover.className).toContain('bg-white');
    expect(popover.className).toContain('shadow-md');
  });

  it('renders with proper styling classes for full view', () => {
    const { container } = render(<NotificationPopover isAuthenticated={false} variant="full" />);
    const popover = container.firstChild as HTMLElement;
    expect(popover.className).toContain('rounded-lg');
    expect(popover.className).toContain('border');
    expect(popover.className).toContain('bg-white');
    expect(popover.className).toContain('shadow-md');
  });

  it('renders two action buttons in unauthenticated compact view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="compact" />);
    const registerButton = screen.getByText('Đăng ký');
    const loginButton = screen.getByText('Đăng nhập');
    expect(registerButton).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });

  it('renders two action buttons in unauthenticated full view', () => {
    render(<NotificationPopover isAuthenticated={false} variant="full" />);
    const registerButton = screen.getByText('Đăng ký');
    const loginButton = screen.getByText('Đăng nhập');
    expect(registerButton).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });
});
