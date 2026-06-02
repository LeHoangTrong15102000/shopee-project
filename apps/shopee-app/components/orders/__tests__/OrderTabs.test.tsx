import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import OrderTabs from '../OrderTabs'
import type { OrderStatusTab } from '../OrderTabs'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    neutrals300: '#bdbdbd',
    neutrals900: '#e0e0e0',
  }),
}))

describe('OrderTabs', () => {
  it('renders all tab labels', () => {
    const { getByText } = render(<OrderTabs activeTab="all" onTabChange={jest.fn()} />)
    expect(getByText('All')).toBeTruthy()
    expect(getByText('Pending')).toBeTruthy()
    expect(getByText('Shipping')).toBeTruthy()
    expect(getByText('Delivered')).toBeTruthy()
    expect(getByText('Cancelled')).toBeTruthy()
  })

  it('calls onTabChange with the correct tab value when a tab is pressed', () => {
    const onTabChange = jest.fn()
    const { getByText } = render(<OrderTabs activeTab="all" onTabChange={onTabChange} />)
    fireEvent.press(getByText('Pending'))
    expect(onTabChange).toHaveBeenCalledWith('pending')
  })

  it('calls onTabChange with shipping when shipping tab is pressed', () => {
    const onTabChange = jest.fn()
    const { getByText } = render(<OrderTabs activeTab="all" onTabChange={onTabChange} />)
    fireEvent.press(getByText('Shipping'))
    expect(onTabChange).toHaveBeenCalledWith('shipping')
  })

  it('visually distinguishes the active tab from inactive tabs', () => {
    const { getByText } = render(<OrderTabs activeTab="pending" onTabChange={jest.fn()} />)
    const activeTabText = getByText('Pending')
    const inactiveTabText = getByText('All')
    // Active tab uses primary color; inactive tabs use neutrals300
    const activeStyle = activeTabText.props.style
    const inactiveStyle = inactiveTabText.props.style
    const getColor = (style: unknown): string | undefined => {
      if (Array.isArray(style)) {
        for (const s of style) {
          const c = getColor(s)
          if (c) return c
        }
        return undefined
      }
      if (style && typeof style === 'object' && 'color' in style) {
        return (style as { color: string }).color
      }
      return undefined
    }
    expect(getColor(activeStyle)).toBe('#EE4D2D')
    expect(getColor(inactiveStyle)).toBe('#bdbdbd')
  })
})
