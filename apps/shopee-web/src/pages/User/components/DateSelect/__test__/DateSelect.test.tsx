import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateSelect from '../DateSelect';

describe('DateSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default values', () => {
    render(<DateSelect />);
    expect(screen.getByText('Ngày sinh')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
  });

  it('should render with provided value', () => {
    const date = new Date(1995, 5, 15); // June 15, 1995
    render(<DateSelect value={date} />);

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('15'); // date
    expect(selects[1].value).toBe('5'); // month (0-indexed)
    expect(selects[2].value).toBe('1995'); // year
  });

  it('should call onChange when date is changed', () => {
    const onChange = vi.fn();
    render(<DateSelect onChange={onChange} />);

    const dateSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(dateSelect, { target: { value: '20', name: 'date' } });

    expect(onChange).toHaveBeenCalled();
    const calledDate = onChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(20);
  });

  it('should call onChange when month is changed', () => {
    const onChange = vi.fn();
    render(<DateSelect onChange={onChange} />);

    const monthSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(monthSelect, { target: { value: '6', name: 'month' } });

    expect(onChange).toHaveBeenCalled();
    const calledDate = onChange.mock.calls[0][0];
    expect(calledDate.getMonth()).toBe(6);
  });

  it('should call onChange when year is changed', () => {
    const onChange = vi.fn();
    render(<DateSelect onChange={onChange} />);

    const yearSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(yearSelect, { target: { value: '2000', name: 'year' } });

    expect(onChange).toHaveBeenCalled();
    const calledDate = onChange.mock.calls[0][0];
    expect(calledDate.getFullYear()).toBe(2000);
  });

  it('should display error message when provided', () => {
    render(<DateSelect errorMessage="Invalid date" />);
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('should update local state when value prop changes', () => {
    const { rerender } = render(<DateSelect value={new Date(1990, 0, 1)} />);

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('1');

    rerender(<DateSelect value={new Date(1995, 5, 15)} />);

    const updatedSelects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(updatedSelects[0].value).toBe('15');
    expect(updatedSelects[1].value).toBe('5');
    expect(updatedSelects[2].value).toBe('1995');
  });

  it('should render all date options (1-31)', () => {
    render(<DateSelect />);
    const dateSelect = screen.getAllByRole('combobox')[0];
    const options = dateSelect.querySelectorAll('option');
    // 1 disabled option + 31 date options
    expect(options.length).toBe(32);
  });

  it('should render all month options (0-11)', () => {
    render(<DateSelect />);
    const monthSelect = screen.getAllByRole('combobox')[1];
    const options = monthSelect.querySelectorAll('option');
    // 1 disabled option + 12 month options
    expect(options.length).toBe(13);
  });

  it('should render year options (1990-2023)', () => {
    render(<DateSelect />);
    const yearSelect = screen.getAllByRole('combobox')[2];
    const options = yearSelect.querySelectorAll('option');
    // 1 disabled option + 34 year options (1990-2023)
    expect(options.length).toBe(35);
  });

  it('should not call onChange when onChange prop is not provided', () => {
    render(<DateSelect />);
    const dateSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(dateSelect, { target: { value: '20', name: 'date' } });
    // Should not throw error
  });

  it('should preserve other date parts when changing one part', () => {
    const onChange = vi.fn();
    const initialDate = new Date(1995, 5, 15);
    render(<DateSelect value={initialDate} onChange={onChange} />);

    const dateSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(dateSelect, { target: { value: '20', name: 'date' } });

    const calledDate = onChange.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(20);
    expect(calledDate.getMonth()).toBe(5);
    expect(calledDate.getFullYear()).toBe(1995);
  });
});
