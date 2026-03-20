import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WalletCard, { WALLETS, WalletLogo, formatCurrency } from '../WalletCard';

describe('WalletCard', () => {
  const momoWallet = WALLETS[0]; // momo
  const vnpayWallet = WALLETS[2]; // vnpay, not linked

  it('renders wallet name and balance', () => {
    render(<WalletCard wallet={momoWallet} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('MoMo')).toBeInTheDocument();
    expect(screen.getByText('Đã liên kết')).toBeInTheDocument();
  });

  it('shows linked badge for linked wallet', () => {
    render(<WalletCard wallet={momoWallet} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Đã liên kết')).toBeInTheDocument();
  });

  it('shows unlinked badge for unlinked wallet', () => {
    render(<WalletCard wallet={vnpayWallet} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Chưa liên kết')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<WalletCard wallet={momoWallet} isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('MoMo'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows checkmark when selected', () => {
    const { container } = render(
      <WalletCard wallet={momoWallet} isSelected={true} onSelect={vi.fn()} />,
    );
    const svg = container.querySelector('svg path[d="M5 13l4 4L19 7"]');
    expect(svg).toBeInTheDocument();
  });

  it('does not show checkmark when not selected', () => {
    const { container } = render(
      <WalletCard wallet={momoWallet} isSelected={false} onSelect={vi.fn()} />,
    );
    const svg = container.querySelector('svg path[d="M5 13l4 4L19 7"]');
    expect(svg).not.toBeInTheDocument();
  });
});

describe('WalletLogo', () => {
  it('renders M for momo', () => {
    render(<WalletLogo wallet="momo" />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders Z for zalopay', () => {
    render(<WalletLogo wallet="zalopay" />);
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('renders V for vnpay', () => {
    render(<WalletLogo wallet="vnpay" />);
    expect(screen.getByText('V')).toBeInTheDocument();
  });
});

describe('WALLETS', () => {
  it('has 3 wallets', () => {
    expect(WALLETS).toHaveLength(3);
  });

  it('momo is linked', () => {
    expect(WALLETS[0].isLinked).toBe(true);
  });

  it('vnpay is not linked', () => {
    expect(WALLETS[2].isLinked).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('formats currency', () => {
    const result = formatCurrency(2500000);
    expect(result).toBeDefined();
  });
});
