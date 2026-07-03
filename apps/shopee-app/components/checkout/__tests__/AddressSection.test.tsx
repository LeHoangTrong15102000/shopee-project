import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import AddressSection from '../AddressSection'
import type { Address } from '@/apis/address.api'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    neutrals900: '#e0e0e0',
    error: '#F44336',
    success: '#4CAF50',
  }),
}))

const mockAddress: Address = {
  _id: 'addr-1',
  name: 'John Doe',
  phone: '0901234567',
  street: '123 Main St',
  ward: 'Ward 1',
  district: 'District 1',
  city: 'Ho Chi Minh City',
  is_default: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('AddressSection', () => {
  it('renders address name and phone when address is provided', () => {
    const { getByText } = render(
      <AddressSection selectedAddress={mockAddress} onChangeAddress={jest.fn()} />
    )
    expect(getByText(/John Doe/)).toBeTruthy()
    expect(getByText(/0901234567/)).toBeTruthy()
  })

  it('renders full address text', () => {
    const { getByText } = render(
      <AddressSection selectedAddress={mockAddress} onChangeAddress={jest.fn()} />
    )
    expect(getByText('123 Main St, Ward 1, District 1, Ho Chi Minh City')).toBeTruthy()
  })

  it('calls onChangeAddress when change button is pressed', () => {
    const onChangeAddress = jest.fn()
    const { getByText } = render(
      <AddressSection selectedAddress={mockAddress} onChangeAddress={onChangeAddress} />
    )
    fireEvent.press(getByText('Change'))
    expect(onChangeAddress).toHaveBeenCalledTimes(1)
  })

  it('shows add address button when no address is provided', () => {
    const onChangeAddress = jest.fn()
    const { getByText } = render(
      <AddressSection selectedAddress={null} onChangeAddress={onChangeAddress} />
    )
    fireEvent.press(getByText('Add Shipping Address'))
    expect(onChangeAddress).toHaveBeenCalledTimes(1)
  })
})
