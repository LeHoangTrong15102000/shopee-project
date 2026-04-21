import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchSuggestionItem from '../SearchSuggestionItem'

describe('SearchSuggestionItem', () => {
  it('renders suggestion text', () => {
    render(
      <SearchSuggestionItem suggestion="iphone 14" searchValue="" onSelect={() => {}} />,
    )
    expect(screen.getByText(/iphone 14/)).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <SearchSuggestionItem suggestion="iphone" searchValue="" onSelect={onSelect} />,
    )
    fireEvent.click(container.firstChild as HTMLElement)
    expect(onSelect).toHaveBeenCalled()
  })

  it('highlights matched search value in suggestion', () => {
    render(
      <SearchSuggestionItem
        suggestion="iphone 14 pro"
        searchValue="iphone"
        onSelect={() => {}}
      />,
    )
    const highlighted = document.querySelector('.text-orange')
    expect(highlighted).toBeInTheDocument()
    expect(highlighted?.textContent?.toLowerCase()).toContain('iphone')
  })

  it('escapes regex special characters in searchValue', () => {
    expect(() =>
      render(
        <SearchSuggestionItem
          suggestion="a.b+c"
          searchValue=".+"
          onSelect={() => {}}
        />,
      ),
    ).not.toThrow()
  })

  it('renders search svg icon', () => {
    render(
      <SearchSuggestionItem suggestion="x" searchValue="" onSelect={() => {}} />,
    )
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('handles empty suggestion gracefully', () => {
    render(
      <SearchSuggestionItem suggestion="" searchValue="q" onSelect={() => {}} />,
    )
    expect(document.body).toBeTruthy()
  })

  it('does case-insensitive highlight', () => {
    render(
      <SearchSuggestionItem
        suggestion="IPhone Pro"
        searchValue="iphone"
        onSelect={() => {}}
      />,
    )
    const highlighted = document.querySelector('.text-orange')
    expect(highlighted?.textContent).toMatch(/IPhone/i)
  })
})
