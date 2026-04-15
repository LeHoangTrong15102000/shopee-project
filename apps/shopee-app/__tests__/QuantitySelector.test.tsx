import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import QuantitySelector from '../components/product-detail/QuantitySelector'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    foreground: '#fff',
    neutrals400: '#6e6e6e',
    neutrals800: '#2a2a2a',
    background: '#000',
  }),
}))

describe('QuantitySelector', () => {
  const onChange = jest.fn()

  beforeEach(() => onChange.mockClear())

  it('renders current value', () => {
    const { getByText } = render(<QuantitySelector value={3} onChange={onChange} max={10} />)
    expect(getByText('3')).toBeTruthy()
  })

  it('increments value on plus press', () => {
    const { getByLabelText } = render(<QuantitySelector value={3} onChange={onChange} max={10} />)
    fireEvent.press(getByLabelText(/increase/i))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('decrements value on minus press', () => {
    const { getByLabelText } = render(<QuantitySelector value={3} onChange={onChange} max={10} />)
    fireEvent.press(getByLabelText(/decrease/i))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('does not go below 1', () => {
    const { getByLabelText } = render(<QuantitySelector value={1} onChange={onChange} max={10} />)
    fireEvent.press(getByLabelText(/decrease/i))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not go above max', () => {
    const { getByLabelText } = render(<QuantitySelector value={10} onChange={onChange} max={10} />)
    fireEvent.press(getByLabelText(/increase/i))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('handles max=1 (both buttons disabled)', () => {
    const { getByLabelText } = render(<QuantitySelector value={1} onChange={onChange} max={1} />)
    fireEvent.press(getByLabelText(/decrease/i))
    fireEvent.press(getByLabelText(/increase/i))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not respond when disabled', () => {
    const { getByLabelText } = render(
      <QuantitySelector value={3} onChange={onChange} max={10} disabled />
    )
    fireEvent.press(getByLabelText(/increase/i))
    fireEvent.press(getByLabelText(/decrease/i))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows accessibility label with current quantity', () => {
    const { getByLabelText } = render(<QuantitySelector value={5} onChange={onChange} max={10} />)
    expect(getByLabelText('Quantity: 5')).toBeTruthy()
  })
})
