import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/utils/testUtils'
import SearchHistory from './SearchHistory'

describe('SearchHistory', () => {
  const mockHistory = [
    { query: 'Samsung Galaxy', timestamp: Date.now() },
    { query: 'Bàn phím cơ', timestamp: Date.now() - 1000 }
  ]

  const defaultProps = {
    history: mockHistory,
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onClearAll: vi.fn()
  }

  it('renders search history items', () => {
    renderWithProviders(<SearchHistory {...defaultProps} />)
    expect(screen.getByText('Samsung Galaxy')).toBeInTheDocument()
    expect(screen.getByText('Bàn phím cơ')).toBeInTheDocument()
  })

  it('renders trending searches', () => {
    renderWithProviders(<SearchHistory {...defaultProps} trendingSearches={['Trending 1', 'Trending 2']} />)
    expect(screen.getByText('Trending 1')).toBeInTheDocument()
    expect(screen.getByText('Trending 2')).toBeInTheDocument()
  })

  it('calls onSelect when history item is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderWithProviders(<SearchHistory {...defaultProps} onSelect={onSelect} />)
    await user.click(screen.getByText('Samsung Galaxy'))
    expect(onSelect).toHaveBeenCalledWith('Samsung Galaxy')
  })

  it('calls onClearAll when clear button is clicked', async () => {
    const user = userEvent.setup()
    const onClearAll = vi.fn()
    renderWithProviders(<SearchHistory {...defaultProps} onClearAll={onClearAll} />)
    const clearButton = screen.getByRole('button', { name: /xóa tất cả|clear/i })
    await user.click(clearButton)
    expect(onClearAll).toHaveBeenCalled()
  })
})
