import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VoucherCard from '../VoucherCard';

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, disabled, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props;
    return (
      <button
        onClick={onClick}
        className={className}
        disabled={disabled}
        aria-label={ariaLabel}
        {...rest}
      >
        {children}
      </button>
    );
  },
}));

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const soonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

const makeVoucher = (overrides = {}) => ({
  _id: 'v1',
  code: 'SAVE50K',
  name: 'Giảm 50K',
  description: 'Giảm 50.000đ cho đơn từ 200K',
  discount_type: 'fixed_amount' as const,
  discount_value: 50000,
  min_order_value: 200000,
  max_discount: 50000,
  usage_limit: 100,
  used_count: 0,
  start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  end_date: futureDate,
  is_active: true,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

describe('VoucherCard', () => {
  it('renders voucher name', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText('Giảm 50K')).toBeInTheDocument();
  });

  it('renders voucher description', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText('Giảm 50.000đ cho đơn từ 200K')).toBeInTheDocument();
  });

  it('renders voucher code', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText(/SAVE50K/)).toBeInTheDocument();
  });

  it('renders min order value', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText(/200.000/)).toBeInTheDocument();
  });

  it('renders save button for active unsaved voucher', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText('Lưu')).toBeInTheDocument();
  });

  it('renders apply button for saved voucher with onApply', () => {
    render(<VoucherCard voucher={makeVoucher()} isSaved={true} onApply={vi.fn()} />);
    expect(screen.getByText('Sử dụng')).toBeInTheDocument();
  });

  it('renders saved text for saved voucher without onApply', () => {
    render(<VoucherCard voucher={makeVoucher()} isSaved={true} />);
    expect(screen.getByText('Đã lưu')).toBeInTheDocument();
  });

  it('renders processing text when loading', () => {
    render(<VoucherCard voucher={makeVoucher()} isLoading={true} />);
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
  });

  it('calls onSave when save clicked', () => {
    const onSave = vi.fn();
    render(<VoucherCard voucher={makeVoucher()} onSave={onSave} />);
    fireEvent.click(screen.getByText('Lưu'));
    expect(onSave).toHaveBeenCalledWith('v1');
  });

  it('calls onApply when apply clicked', () => {
    const onApply = vi.fn();
    render(<VoucherCard voucher={makeVoucher()} isSaved={true} onApply={onApply} />);
    fireEvent.click(screen.getByText('Sử dụng'));
    expect(onApply).toHaveBeenCalledWith('SAVE50K');
  });

  it('does not call onSave when loading', () => {
    const onSave = vi.fn();
    render(<VoucherCard voucher={makeVoucher()} onSave={onSave} isLoading={true} />);
    fireEvent.click(screen.getByText('Đang xử lý...'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders expired overlay for expired voucher', () => {
    render(<VoucherCard voucher={makeVoucher({ end_date: pastDate })} />);
    expect(screen.getByText('Hết hạn')).toBeInTheDocument();
  });

  it('renders expired text for inactive voucher', () => {
    render(<VoucherCard voucher={makeVoucher({ is_active: false })} />);
    expect(screen.getByText('Đã hết hạn')).toBeInTheDocument();
  });

  it('renders max discount for percentage voucher', () => {
    render(
      <VoucherCard
        voucher={makeVoucher({
          discount_type: 'percentage',
          discount_value: 20,
          max_discount: 100000,
        })}
      />,
    );
    expect(screen.getByText(/100.000/)).toBeInTheDocument();
  });

  it('does not render max discount for fixed voucher', () => {
    const { container } = render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.queryByText(/Tối đa/)).not.toBeInTheDocument();
  });

  it('renders expiry date for active voucher', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText(/HSD:/)).toBeInTheDocument();
  });

  it('has opacity-60 class when expired', () => {
    const { container } = render(<VoucherCard voucher={makeVoucher({ end_date: pastDate })} />);
    expect(container.querySelector('.opacity-60')).toBeInTheDocument();
  });

  it('has article role', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('does not call onSave when expired', () => {
    const onSave = vi.fn();
    render(<VoucherCard voucher={makeVoucher({ end_date: pastDate })} onSave={onSave} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => fireEvent.click(btn));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders discount label', () => {
    render(<VoucherCard voucher={makeVoucher()} />);
    expect(screen.getByText('Giảm')).toBeInTheDocument();
  });
});
