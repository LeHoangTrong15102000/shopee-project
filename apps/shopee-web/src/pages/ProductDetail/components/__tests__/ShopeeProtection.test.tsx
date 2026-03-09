import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShopeeProtection from '../ShopeeProtection';
import { renderWithProviders } from 'src/utils/testUtils';

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
    expect(row.classList.contains('cursor-pointer')).toBe(true);
  });

  it('has hover effect styling', () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    expect(row.classList.contains('hover:bg-gray-50')).toBe(true);
  });

  it('opens modal on click', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    await user.click(row);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
  });

  it('opens modal on Enter key', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    row.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
  });

  it('opens modal on Space key', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    row.focus();
    await user.keyboard(' ');
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
  });

  it('shows all policy sections in modal', async () => {
    renderWithProviders(<ShopeeProtection />);
    const row = screen.getByRole('button', { name: 'Shopee Đảm Bảo' });
    await user.click(row);
    await waitFor(() => {
      expect(screen.getByText('Trả hàng miễn phí 15 ngày')).toBeInTheDocument();
      expect(screen.getByText('Chính hãng 100%')).toBeInTheDocument();
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
});
