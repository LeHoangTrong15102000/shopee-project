import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import InlineError from '../components/ui/InlineError'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    error: '#e4626f',
  }),
}))

describe('InlineError', () => {
  it('renders error message', () => {
    const { getByText } = render(<InlineError message="Something went wrong" />)
    expect(getByText('Something went wrong')).toBeTruthy()
  })

  it('renders retry button and calls onRetry', () => {
    const onRetry = jest.fn()
    const { getByText } = render(<InlineError message="Error" onRetry={onRetry} />)
    fireEvent.press(getByText('RETRY'))
    expect(onRetry).toHaveBeenCalled()
  })

  it('does not render retry button when onRetry not provided', () => {
    const { queryByText } = render(<InlineError message="Error" />)
    expect(queryByText('RETRY')).toBeNull()
  })
})
