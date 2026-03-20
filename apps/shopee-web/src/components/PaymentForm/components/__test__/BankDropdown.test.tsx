import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BankDropdown, { BANKS } from '../BankDropdown';

describe('BANKS', () => {
  it('has 8 banks', () => {
    expect(BANKS).toHaveLength(8);
  });

  it('each bank has required fields', () => {
    BANKS.forEach((bank) => {
      expect(bank.id).toBeDefined();
      expect(bank.name).toBeDefined();
      expect(bank.shortName).toBeDefined();
      expect(bank.accountNumber).toBeDefined();
      expect(bank.accountHolder).toBeDefined();
    });
  });
});

describe('BankDropdown', () => {
  it('shows placeholder when no bank selected', () => {
    render(
      <BankDropdown selectedBank={null} onSelectBank={vi.fn()} isOpen={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('Chọn ngân hàng...')).toBeInTheDocument();
  });

  it('shows selected bank name', () => {
    render(
      <BankDropdown
        selectedBank={BANKS[0]}
        onSelectBank={vi.fn()}
        isOpen={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Vietcombank')).toBeInTheDocument();
  });

  it('calls onToggle when button clicked', () => {
    const onToggle = vi.fn();
    render(
      <BankDropdown
        selectedBank={null}
        onSelectBank={vi.fn()}
        isOpen={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText('Chọn ngân hàng...'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows dropdown list when open', () => {
    render(
      <BankDropdown selectedBank={null} onSelectBank={vi.fn()} isOpen={true} onToggle={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText('Tìm ngân hàng...')).toBeInTheDocument();
    BANKS.forEach((bank) => {
      expect(screen.getAllByText(bank.name).length).toBeGreaterThan(0);
    });
  });

  it('does not show dropdown when closed', () => {
    render(
      <BankDropdown selectedBank={null} onSelectBank={vi.fn()} isOpen={false} onToggle={vi.fn()} />,
    );
    expect(screen.queryByPlaceholderText('Tìm ngân hàng...')).not.toBeInTheDocument();
  });

  it('filters banks by search query', () => {
    render(
      <BankDropdown selectedBank={null} onSelectBank={vi.fn()} isOpen={true} onToggle={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText('Tìm ngân hàng...');
    fireEvent.change(input, { target: { value: 'Vietcom' } });
    expect(screen.getByText('Vietcombank')).toBeInTheDocument();
    expect(screen.queryByText('Techcombank')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', () => {
    render(
      <BankDropdown selectedBank={null} onSelectBank={vi.fn()} isOpen={true} onToggle={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText('Tìm ngân hàng...');
    fireEvent.change(input, { target: { value: 'XYZNOTFOUND' } });
    expect(screen.getByText('Không tìm thấy ngân hàng')).toBeInTheDocument();
  });

  it('calls onSelectBank when bank clicked', () => {
    const onSelectBank = vi.fn();
    render(
      <BankDropdown
        selectedBank={null}
        onSelectBank={onSelectBank}
        isOpen={true}
        onToggle={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Techcombank'));
    expect(onSelectBank).toHaveBeenCalledWith(BANKS[1]);
  });

  it('filters by short name', () => {
    render(
      <BankDropdown selectedBank={null} onSelectBank={vi.fn()} isOpen={true} onToggle={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText('Tìm ngân hàng...');
    fireEvent.change(input, { target: { value: 'VCB' } });
    expect(screen.getByText('Vietcombank')).toBeInTheDocument();
  });
});
