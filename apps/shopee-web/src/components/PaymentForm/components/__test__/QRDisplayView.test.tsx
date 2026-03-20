import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QRDisplayView from '../QRDisplayView';
import { WALLETS } from '../WalletCard';

const momoWallet = WALLETS[0];

describe('QRDisplayView', () => {
  it('renders QR scan title', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={false}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Quét mã QR để thanh toán')).toBeInTheDocument();
  });

  it('renders wallet name in description', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={false}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/MoMo/).length).toBeGreaterThan(0);
  });

  it('renders cancel button', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={false}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('Hủy thanh toán')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={false}
        onOpenApp={vi.fn()}
        onCancel={onCancel}
      />,
    );
    screen.getByText('Hủy thanh toán').click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows open app button on mobile', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={true}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Mở ứng dụng MoMo/).length).toBeGreaterThan(0);
  });

  it('does not show open app button on desktop', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={false}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Mở ứng dụng MoMo/)).not.toBeInTheDocument();
  });

  it('shows desktop instruction on desktop', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={false}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Quét mã QR bằng ứng dụng MoMo trên điện thoại/)).toBeInTheDocument();
  });

  it('shows mobile instruction on mobile', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={300}
        isMobile={true}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Nhấn nút "Mở ứng dụng MoMo"/)).toBeInTheDocument();
  });

  it('disables open app button when expired', () => {
    render(
      <QRDisplayView
        wallet={momoWallet}
        amount={500000}
        timeRemaining={0}
        isMobile={true}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const btns = screen.getAllByText(/Mở ứng dụng MoMo/);
    const btn = btns[0].closest('button');
    expect(btn).toBeDisabled();
  });

  it('renders with zalopay wallet', () => {
    const zalopay = WALLETS[1];
    render(
      <QRDisplayView
        wallet={zalopay}
        amount={100000}
        timeRemaining={200}
        isMobile={true}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/ZaloPay/).length).toBeGreaterThan(0);
  });

  it('renders with vnpay wallet', () => {
    const vnpay = WALLETS[2];
    render(
      <QRDisplayView
        wallet={vnpay}
        amount={100000}
        timeRemaining={200}
        isMobile={true}
        onOpenApp={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/VNPay/).length).toBeGreaterThan(0);
  });
});
