import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodSelect } from './PeriodSelect';

describe('PeriodSelect', () => {
  it('renders with default value', () => {
    render(<PeriodSelect onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with custom value', () => {
    render(<PeriodSelect value="7d" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onChange when period is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PeriodSelect value="30d" onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    const option = screen.getByText('period.last7days');
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith('7d');
  });
});
