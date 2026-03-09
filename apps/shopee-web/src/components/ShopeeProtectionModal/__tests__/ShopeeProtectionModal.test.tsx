import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShopeeProtectionModal from '../ShopeeProtectionModal';
import { renderWithProviders } from 'src/utils/testUtils';

describe('ShopeeProtectionModal (Task 6.11)', () => {
  const onClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title when open', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByText('An Tâm Mua Sắm Cùng Shopee')).not.toBeInTheDocument();
  });

  it('displays return policy section', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Trả hàng miễn phí 15 ngày')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Miễn phí trả hàng trong 15 ngày kể từ khi nhận hàng. Bạn có thể đổi ý và trả hàng miễn phí.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('displays authenticity section', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Chính hãng 100%')).toBeInTheDocument();
      expect(
        screen.getByText('Cam kết sản phẩm chính hãng 100%. Shopee xác minh nguồn gốc sản phẩm.'),
      ).toBeInTheDocument();
    });
  });

  it('displays free shipping section', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument();
      expect(
        screen.getByText('Miễn phí vận chuyển cho đơn hàng từ 0đ. Áp dụng cho tất cả khu vực.'),
      ).toBeInTheDocument();
    });
  });

  it('has section separators', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
    const separators = document.querySelectorAll('.border-t');
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onClose when close button clicked', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
    const closeBtn = screen.getByLabelText('Đóng');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('has accessible dialog structure', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'protection-modal-title');
  });

  it('has scrollable content region', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('An Tâm Mua Sắm Cùng Shopee')).toBeInTheDocument();
    });
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region.classList.contains('overflow-y-auto')).toBe(true);
  });

  it('has responsive width', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog');
    expect(dialog.classList.contains('w-full')).toBe(true);
    expect(dialog.classList.contains('max-w-2xl')).toBe(true);
  });

  it('loads content from i18n (all policy conditions)', async () => {
    renderWithProviders(<ShopeeProtectionModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(
        screen.getByText(/Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Shopee sẽ hỗ trợ hoàn tiền 100%/)).toBeInTheDocument();
      expect(screen.getByText(/Quy trình kiểm định chất lượng nghiêm ngặt/)).toBeInTheDocument();
      expect(screen.getByText(/Hoàn tiền 200% nếu phát hiện hàng giả/)).toBeInTheDocument();
      expect(screen.getByText(/Giao hàng tiêu chuẩn 3-5 ngày/)).toBeInTheDocument();
      expect(screen.getByText(/Giao hàng nhanh có phụ thu/)).toBeInTheDocument();
    });
  });
});
