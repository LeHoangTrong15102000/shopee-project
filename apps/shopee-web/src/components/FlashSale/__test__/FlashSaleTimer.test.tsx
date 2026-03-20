import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FlashSaleTimer from '../FlashSaleTimer';

describe('FlashSaleTimer', () => {
  it('renders ended state', () => {
    render(<FlashSaleTimer isEnded={true} />);
    expect(screen.getByText('Đã kết thúc')).toBeInTheDocument();
  });

  it('renders timer label when not ended', () => {
    render(<FlashSaleTimer />);
    expect(screen.getByText('Kết thúc trong')).toBeInTheDocument();
  });

  it('renders default time when no endTime provided', () => {
    render(<FlashSaleTimer />);
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('renders with server synced time', () => {
    render(<FlashSaleTimer isServerSynced={true} serverRemainingSeconds={7200} />);
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('shows Live badge when server synced', () => {
    render(<FlashSaleTimer isServerSynced={true} serverRemainingSeconds={3600} />);
    expect(screen.getByText(/Live/)).toBeInTheDocument();
  });

  it('does not show Live badge when not server synced', () => {
    render(<FlashSaleTimer />);
    expect(screen.queryByText(/Live/)).not.toBeInTheDocument();
  });

  it('shows sold and stock info when server synced with products', () => {
    const products = [
      { product_id: '1', current_stock: 10, sold: 5 },
      { product_id: '2', current_stock: 20, sold: 15 },
    ];
    render(
      <FlashSaleTimer isServerSynced={true} serverRemainingSeconds={3600} products={products} />,
    );
    expect(screen.getByText(/Đã bán: 20/)).toBeInTheDocument();
    expect(screen.getByText(/Còn: 30/)).toBeInTheDocument();
  });

  it('renders with endTime in the future', () => {
    const future = new Date(Date.now() + 3600000);
    render(<FlashSaleTimer endTime={future} />);
    expect(screen.getByText('Kết thúc trong')).toBeInTheDocument();
  });

  it('renders zero time when server remaining is 0', () => {
    render(<FlashSaleTimer isServerSynced={true} serverRemainingSeconds={0} />);
    expect(screen.getAllByText('00').length).toBeGreaterThanOrEqual(3);
  });

  it('applies custom className', () => {
    const { container } = render(<FlashSaleTimer className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
