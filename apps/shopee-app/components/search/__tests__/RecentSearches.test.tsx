import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import RecentSearches from '../RecentSearches'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({ neutrals400: '#9e9e9e' }),
}))

describe('RecentSearches', () => {
  it('renders both search terms when given two searches', () => {
    const { getByText } = render(
      <RecentSearches searches={['shoes', 'shirt']} onSelect={jest.fn()} onClear={jest.fn()} />
    )
    expect(getByText('shoes')).toBeTruthy()
    expect(getByText('shirt')).toBeTruthy()
  })

  it('calls onSelect with the correct term when a search is pressed', () => {
    const onSelect = jest.fn()
    const { getByText } = render(
      <RecentSearches searches={['shoes', 'shirt']} onSelect={onSelect} onClear={jest.fn()} />
    )
    fireEvent.press(getByText('shoes'))
    expect(onSelect).toHaveBeenCalledWith('shoes')
  })

  it('calls onClear when clear all is pressed', () => {
    const onClear = jest.fn()
    const { getByText } = render(
      <RecentSearches searches={['shoes']} onSelect={jest.fn()} onClear={onClear} />
    )
    fireEvent.press(getByText('Clear All'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when searches list is empty', () => {
    const { toJSON } = render(
      <RecentSearches searches={[]} onSelect={jest.fn()} onClear={jest.fn()} />
    )
    expect(toJSON()).toBeNull()
  })
})
