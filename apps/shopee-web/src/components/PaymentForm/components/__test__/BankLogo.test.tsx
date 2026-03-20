import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BankLogo from '../BankLogo';

const mockBank = {
  id: 'vcb' as const,
  name: 'Vietcombank',
  shortName: 'VCB',
  color: 'text-green-600',
  bgColor: 'bg-green-50',
  accountNumber: '1234567890',
  accountHolder: 'NGUYEN VAN A',
  branch: 'HCM',
};

describe('BankLogo', () => {
  it('renders bank short name', () => {
    render(<BankLogo bank={mockBank} />);
    expect(screen.getByText('VCB')).toBeInTheDocument();
  });

  it('renders with sm size', () => {
    const { container } = render(<BankLogo bank={mockBank} size="sm" />);
    expect(container.querySelector('.h-8')).toBeInTheDocument();
  });

  it('renders with md size (default)', () => {
    const { container } = render(<BankLogo bank={mockBank} />);
    expect(container.querySelector('.h-12')).toBeInTheDocument();
  });

  it('renders with lg size', () => {
    const { container } = render(<BankLogo bank={mockBank} size="lg" />);
    expect(container.querySelector('.h-16')).toBeInTheDocument();
  });

  it('renders with different bank ids', () => {
    const banks = [
      { id: 'tcb' as const, shortName: 'TCB' },
      { id: 'bidv' as const, shortName: 'BIDV' },
      { id: 'mb' as const, shortName: 'MB' },
      { id: 'acb' as const, shortName: 'ACB' },
      { id: 'stb' as const, shortName: 'STB' },
      { id: 'tpb' as const, shortName: 'TPB' },
      { id: 'vtb' as const, shortName: 'VTB' },
    ];
    banks.forEach(({ id, shortName }) => {
      const bank = { ...mockBank, id, shortName };
      const { unmount } = render(<BankLogo bank={bank} />);
      expect(screen.getByText(shortName)).toBeInTheDocument();
      unmount();
    });
  });
});
