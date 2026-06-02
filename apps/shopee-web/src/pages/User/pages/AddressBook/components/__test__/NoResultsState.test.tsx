import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NoResultsState from '../NoResultsState'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

describe('NoResultsState', () => {
  it('renders with empty searchQuery and filterType=all', () => {
    render(<NoResultsState searchQuery="" filterType="all" onClear={() => {}} />)
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders with searchQuery', () => {
    render(<NoResultsState searchQuery="Hanoi" filterType="all" onClear={() => {}} />)
    expect(document.body.textContent).toContain('Hanoi')
  })

  it('renders filter type = home', () => {
    render(<NoResultsState searchQuery="" filterType="home" onClear={() => {}} />)
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders filter type = office', () => {
    render(<NoResultsState searchQuery="" filterType="office" onClear={() => {}} />)
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders filter type = other', () => {
    render(<NoResultsState searchQuery="" filterType="other" onClear={() => {}} />)
    expect(document.body.textContent).toBeTruthy()
  })

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn()
    render(<NoResultsState searchQuery="q" filterType="all" onClear={onClear} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(onClear).toHaveBeenCalled()
  })

  it('renders search icon svg', () => {
    render(<NoResultsState searchQuery="" filterType="all" onClear={() => {}} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })
})
