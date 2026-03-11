import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShopeeProtection from '../ShopeeProtection';
import { renderWithProviders } from 'src/utils/testUtils';

// Mock framer-motion so AnimatePresence/motion.div render synchronously
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('ShopeeProtection (Task 7.7)', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders protection row with label', () => {
    renderWithProviders(<ShopeeProtection />);
    expect(screen.getByText('Shopee Đảm Bảo')).toBeInTheDocument();
  });

  it('has cursor-pointer class', () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    const innerDiv = row.firstElementChild!;
    expect(innerDiv.classList.contains('cursor-pointer')).toBe(true);
  });

  it('has hover effect styling', () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    const innerDiv = row.firstElementChild!;
    expect(innerDiv.classList.contains('hover:bg-gray-50')).toBe(true);
  });

  it('shows popup on hover with policy content', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    await user.hover(row);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
  });

  it('shows all policy sections in popup on hover', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    await user.hover(row);
    await waitFor(() => {
      expect(screen.getByText('Trả hàng miễn phí 15 ngày')).toBeInTheDocument();
      // "Chính hãng 100%" appears both in the row (inline) and in the popup
      const authenticityTexts = screen.getAllByText('Chính hãng 100%');
      expect(authenticityTexts.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveAttribute('role', 'button');
  });

  it('has chevron-right icon', () => {
    renderWithProviders(<ShopeeProtection />);
    // Check for SVG chevron
    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('opens popover on Enter key', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    row.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
  });

  it('closes popover on Escape', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    await user.hover(row);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('An Tâm Mua Sắm Cùng Shopee')).not.toBeInTheDocument();
    });
  });

  it('closes popover on mouse leave', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    await user.hover(row);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
    await user.unhover(row);
    await waitFor(() => {
      expect(screen.queryByText('An Tâm Mua Sắm Cùng Shopee')).not.toBeInTheDocument();
    });
  });

  it('sets aria-expanded to true when popover opens', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await user.hover(row);
    await waitFor(() => {
      expect(row).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
