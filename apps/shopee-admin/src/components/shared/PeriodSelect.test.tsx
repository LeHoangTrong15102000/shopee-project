import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeriodSelect } from './PeriodSelect'

describe('PeriodSelect', () => {
  it('renders with default value', () => {
    render(<PeriodSelect onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders with custom value', () => {
    render(<PeriodSelect value="7d" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onChange when period is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodSelect value="30d" onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    const option = screen.getByText('period.last7days')
    await user.click(option)
    expect(onChange).toHaveBeenCalledWith('7d')
  })

  it('shows date inputs when custom period selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodSelect value="30d" onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    const customOption = screen.getByText('period.customRange')
    await user.click(customOption)
    expect(onChange).toHaveBeenCalledWith('custom')
  })

  it('renders custom range date inputs when value is custom', () => {
    const { container } = render(
      <PeriodSelect value="custom" onChange={vi.fn()} onCustomRange={vi.fn()} />,
    )
    const dateInputs = container.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
  })

  it('calls onCustomRange when both dates are filled', async () => {
    const user = userEvent.setup()
    const onCustomRange = vi.fn()
    const { container } = render(
      <PeriodSelect value="custom" onChange={vi.fn()} onCustomRange={onCustomRange} />,
    )
    const dateInputs = container.querySelectorAll('input[type="date"]')
    await user.type(dateInputs[0], '2024-01-01')
    await user.type(dateInputs[1], '2024-01-31')
    expect(onCustomRange).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
  })

  it('does not call onCustomRange when only start date is filled', async () => {
    const user = userEvent.setup()
    const onCustomRange = vi.fn()
    const { container } = render(
      <PeriodSelect value="custom" onChange={vi.fn()} onCustomRange={onCustomRange} />,
    )
    const dateInputs = container.querySelectorAll('input[type="date"]')
    await user.type(dateInputs[0], '2024-01-01')
    expect(onCustomRange).not.toHaveBeenCalled()
  })

  it('clears dates when switching from custom to non-custom', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PeriodSelect value="custom" onChange={onChange} onCustomRange={vi.fn()} />)
    await user.click(screen.getByRole('combobox'))
    const option = screen.getByText('period.last7days')
    await user.click(option)
    expect(onChange).toHaveBeenCalledWith('7d')
  })
})
