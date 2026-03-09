import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherCard from '../VoucherCard';
import { renderWithProviders } from 'src/utils/testUtils';

const createMockVoucher = (overrides = {}) => ({
  _id: 'voucher-1',
  code: 'GIAM50K',
  name: 'Giảm 50K',
  description: 'Giảm 50.000đ cho đơn từ 200K',
  discount_type: 'fixed_amount' as const,
  discount_value: 50000,
  min_order_value: 200000,
  max_discount: undefined,
  end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
  is_active: true,
  ...overrides,
});

describe('VoucherCard', () => {
  const onSave = vi.fn();
  const onApply = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders voucher name and discount', () => {
    renderWithProviders(<VoucherCard voucher={createMockVoucher()} />);
    expect(screen.getByText('Giảm 50K')).toBeInTheDocument();
    expect(screen.getByText('₫50.000')).toBeInTheDocument();
  });

  it('renders percentage discount correctly', () => {
    renderWithProviders(
      <VoucherCard
        voucher={createMockVoucher({
          discount_type: 'percentage',
          discount_value: 10,
          max_discount: 100000,
        })}
      />,
    );
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('shows "Lưu" button for unsaved active voucher', () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher()} isSaved={false} onSave={onSave} />,
    );
    expect(screen.getByText('Lưu')).toBeInTheDocument();
    expect(screen.getByText('Lưu').closest('button')).not.toBeDisabled();
  });

  it('shows "Đã lưu" disabled button when isSaved=true and no onApply', () => {
    renderWithProviders(<VoucherCard voucher={createMockVoucher()} isSaved={true} />);
    expect(screen.getByText('Đã lưu')).toBeInTheDocument();
    expect(screen.getByText('Đã lưu').closest('button')).toBeDisabled();
  });

  it('shows "Sử dụng" button when isSaved=true and onApply provided', () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher()} isSaved={true} onApply={onApply} />,
    );
    expect(screen.getByText('Sử dụng')).toBeInTheDocument();
    expect(screen.getByText('Sử dụng').closest('button')).not.toBeDisabled();
  });

  it('shows expired overlay for expired voucher', () => {
    renderWithProviders(
      <VoucherCard
        voucher={createMockVoucher({
          end_date: new Date(Date.now() - 86400000).toISOString(),
        })}
      />,
    );
    expect(screen.getByText('Hết hạn')).toBeInTheDocument();
  });

  it('shows expired overlay for inactive voucher', () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher({ is_active: false })} />,
    );
    expect(screen.getByText('Hết hạn')).toBeInTheDocument();
  });

  it('calls onSave with voucher ID when save clicked', async () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher()} isSaved={false} onSave={onSave} />,
    );
    await user.click(screen.getByText('Lưu'));
    expect(onSave).toHaveBeenCalledWith('voucher-1');
  });

  it('calls onApply with voucher code when apply clicked', async () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher()} isSaved={true} onApply={onApply} />,
    );
    await user.click(screen.getByText('Sử dụng'));
    expect(onApply).toHaveBeenCalledWith('GIAM50K');
  });

  it('displays formatted currency for fixed_amount discount type', () => {
    renderWithProviders(<VoucherCard voucher={createMockVoucher()} />);
    expect(screen.getByText('₫50.000')).toBeInTheDocument();
  });

  it('shows loading state with processing text', () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher()} isLoading={true} onSave={onSave} />,
    );
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    renderWithProviders(
      <VoucherCard voucher={createMockVoucher()} isLoading={true} onSave={onSave} />,
    );
    expect(screen.getByText('Đang xử lý...').closest('button')).toBeDisabled();
  });

  it('disables button when expired', () => {
    renderWithProviders(
      <VoucherCard
        voucher={createMockVoucher({
          end_date: new Date(Date.now() - 86400000).toISOString(),
        })}
        onSave={onSave}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const actionButton = buttons[buttons.length - 1];
    expect(actionButton).toBeDisabled();
  });

  it('shows min order value', () => {
    renderWithProviders(<VoucherCard voucher={createMockVoucher()} />);
    expect(screen.getByText(/200\.000/)).toBeInTheDocument();
  });

  it('has accessible article role', () => {
    renderWithProviders(<VoucherCard voucher={createMockVoucher()} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});

