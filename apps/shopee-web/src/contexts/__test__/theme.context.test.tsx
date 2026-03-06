import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../theme.context'

const TestConsumer = () => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid='theme'>{theme}</span>
      <span data-testid='resolved'>{resolvedTheme}</span>
      <button data-testid='toggle' onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid='set-dark' onClick={() => setTheme('dark')}>
        Dark
      </button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark', 'light')
})

describe('ThemeContext', () => {
  it('provides default theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme')).toBeInTheDocument()
    expect(screen.getByTestId('resolved')).toBeInTheDocument()
  })

  it('toggleTheme switches between light and dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    const initialResolved = screen.getByTestId('resolved').textContent
    await user.click(screen.getByTestId('toggle'))
    const newResolved = screen.getByTestId('resolved').textContent
    expect(newResolved).not.toBe(initialResolved)
  })

  it('persists theme to localStorage', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    await user.click(screen.getByTestId('set-dark'))
    expect(localStorage.getItem('shopee_theme')).toBe('dark')
  })

  it('updates document class on theme change', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    await user.click(screen.getByTestId('set-dark'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('throws error when useTheme is used outside ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within a ThemeProvider')
    consoleError.mockRestore()
  })
})
