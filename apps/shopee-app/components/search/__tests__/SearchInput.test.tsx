import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import SearchInput from '../SearchInput'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({ primary: '#EE4D2D' }),
}))

describe('SearchInput', () => {
  it('renders with the provided query value', () => {
    const { getByDisplayValue } = render(
      <SearchInput query="shoes" onQueryChange={jest.fn()} onClear={jest.fn()} />
    )
    expect(getByDisplayValue('shoes')).toBeTruthy()
  })

  it('shows clear button when query is non-empty', () => {
    const onClear = jest.fn()
    const { getByLabelText } = render(
      <SearchInput query="shoes" onQueryChange={jest.fn()} onClear={onClear} />
    )
    fireEvent.press(getByLabelText('Clear search'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('does not show clear button when query is empty', () => {
    const { queryByLabelText } = render(
      <SearchInput query="" onQueryChange={jest.fn()} onClear={jest.fn()} />
    )
    expect(queryByLabelText('Clear search')).toBeNull()
  })

  it('calls onBack when back button is pressed', () => {
    const onBack = jest.fn()
    const { getByLabelText } = render(
      <SearchInput query="" onQueryChange={jest.fn()} onClear={jest.fn()} onBack={onBack} />
    )
    fireEvent.press(getByLabelText('Go back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
