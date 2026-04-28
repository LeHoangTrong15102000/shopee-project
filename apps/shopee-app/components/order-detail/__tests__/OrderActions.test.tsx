import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import OrderActions from '../OrderActions'
import { ORDER_STATUS } from '@/constants/order'

describe('OrderActions', () => {
  const mockCancel = jest.fn()
  const mockConfirm = jest.fn()
  const mockReturn = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  function renderActions(status: string) {
    return render(
      <OrderActions
        status={status}
        onCancel={mockCancel}
        onConfirmReceived={mockConfirm}
        onReturn={mockReturn}
      />
    )
  }

  it('shows cancel button for PENDING status', () => {
    const { getByText } = renderActions(ORDER_STATUS.PENDING)
    expect(getByText('Cancel Order')).toBeTruthy()
  })

  it('shows cancel button for CONFIRMED status', () => {
    const { getByText } = renderActions(ORDER_STATUS.CONFIRMED)
    expect(getByText('Cancel Order')).toBeTruthy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = renderActions(ORDER_STATUS.PENDING)
    fireEvent.press(getByText('Cancel Order'))
    expect(mockCancel).toHaveBeenCalledTimes(1)
  })

  it('shows confirm-received button for SHIPPING status', () => {
    const { getByText } = renderActions(ORDER_STATUS.SHIPPING)
    expect(getByText('Confirm Receipt')).toBeTruthy()
  })

  it('calls onConfirmReceived when confirm button is pressed', () => {
    const { getByText } = renderActions(ORDER_STATUS.SHIPPING)
    fireEvent.press(getByText('Confirm Receipt'))
    expect(mockConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows return button for DELIVERED status', () => {
    const { getByText } = renderActions(ORDER_STATUS.DELIVERED)
    expect(getByText('Return')).toBeTruthy()
  })

  it('calls onReturn when return button is pressed', () => {
    const { getByText } = renderActions(ORDER_STATUS.DELIVERED)
    fireEvent.press(getByText('Return'))
    expect(mockReturn).toHaveBeenCalledTimes(1)
  })

  it('renders nothing for PROCESSING status', () => {
    const { toJSON } = renderActions(ORDER_STATUS.PROCESSING)
    expect(toJSON()).toBeNull()
  })

  it('renders nothing for CANCELLED status', () => {
    const { toJSON } = renderActions(ORDER_STATUS.CANCELLED)
    expect(toJSON()).toBeNull()
  })

  it('renders nothing for RETURNED status', () => {
    const { toJSON } = renderActions(ORDER_STATUS.RETURNED)
    expect(toJSON()).toBeNull()
  })
})
