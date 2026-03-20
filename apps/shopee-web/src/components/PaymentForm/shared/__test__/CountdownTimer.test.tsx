import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EWalletCountdownTimer, BankTransferCountdownTimer } from '../CountdownTimer';

describe('EWalletCountdownTimer', () => {
  it('renders remaining time when not expired', () => {
    render(<EWalletCountdownTimer seconds={150} isExpired={false} />);
    expect(screen.getByText('Còn lại: 02:30')).toBeInTheDocument();
  });

  it('renders expired text when expired', () => {
    render(<EWalletCountdownTimer seconds={0} isExpired={true} />);
    expect(screen.getByText('Đã hết hạn')).toBeInTheDocument();
  });

  it('shows warning color when seconds <= 60', () => {
    const { container } = render(<EWalletCountdownTimer seconds={30} isExpired={false} />);
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('shows green color when seconds > 60', () => {
    const { container } = render(<EWalletCountdownTimer seconds={120} isExpired={false} />);
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('formats single digit seconds with padding', () => {
    render(<EWalletCountdownTimer seconds={65} isExpired={false} />);
    expect(screen.getByText('Còn lại: 01:05')).toBeInTheDocument();
  });

  it('formats zero seconds', () => {
    render(<EWalletCountdownTimer seconds={0} isExpired={false} />);
    expect(screen.getByText('Còn lại: 00:00')).toBeInTheDocument();
  });
});

describe('BankTransferCountdownTimer', () => {
  it('renders payment deadline label when not expired', () => {
    render(<BankTransferCountdownTimer seconds={3600} onExpired={vi.fn()} />);
    expect(screen.getByText('Thời hạn thanh toán')).toBeInTheDocument();
  });

  it('renders expired text when seconds <= 0', () => {
    render(<BankTransferCountdownTimer seconds={0} onExpired={vi.fn()} />);
    expect(screen.getByText('Đã hết hạn thanh toán')).toBeInTheDocument();
  });

  it('calls onExpired when seconds reach 0', () => {
    const onExpired = vi.fn();
    render(<BankTransferCountdownTimer seconds={0} onExpired={onExpired} />);
    expect(onExpired).toHaveBeenCalled();
  });

  it('does not call onExpired when seconds > 0', () => {
    const onExpired = vi.fn();
    render(<BankTransferCountdownTimer seconds={100} onExpired={onExpired} />);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('shows time parts for hours, minutes, seconds', () => {
    render(<BankTransferCountdownTimer seconds={3661} onExpired={vi.fn()} />);
    expect(screen.getAllByText('01').length).toBeGreaterThanOrEqual(2);
  });

  it('shows warning style when seconds <= 3600', () => {
    const { container } = render(<BankTransferCountdownTimer seconds={1800} onExpired={vi.fn()} />);
    expect(container.querySelector('.bg-orange-50')).toBeInTheDocument();
  });

  it('shows normal style when seconds > 3600', () => {
    const { container } = render(<BankTransferCountdownTimer seconds={7200} onExpired={vi.fn()} />);
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('shows warning message when in warning range', () => {
    render(<BankTransferCountdownTimer seconds={1800} onExpired={vi.fn()} />);
    expect(screen.getByText(/Sắp hết hạn/)).toBeInTheDocument();
  });

  it('does not show warning message when not in warning range', () => {
    render(<BankTransferCountdownTimer seconds={7200} onExpired={vi.fn()} />);
    expect(screen.queryByText(/Sắp hết hạn/)).not.toBeInTheDocument();
  });

  it('shows expired message when expired', () => {
    render(<BankTransferCountdownTimer seconds={0} onExpired={vi.fn()} />);
    expect(screen.getByText(/Đơn hàng đã bị hủy/)).toBeInTheDocument();
  });

  it('does not show progress bar when expired', () => {
    const { container } = render(<BankTransferCountdownTimer seconds={0} onExpired={vi.fn()} />);
    expect(container.querySelector('.bg-blue-500')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-orange-500')).not.toBeInTheDocument();
  });

  it('shows red background when expired', () => {
    const { container } = render(<BankTransferCountdownTimer seconds={0} onExpired={vi.fn()} />);
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });
});
