import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { AppContext, AppProvider, getInitialAppContext } from '../app.context'

// Test consumer component
const TestConsumer = () => {
  const { isAuthenticated, profile, reset } = useContext(AppContext)
  return (
    <div>
      <span data-testid='auth'>{String(isAuthenticated)}</span>
      <span data-testid='profile'>{profile ? profile.email : 'null'}</span>
      <button data-testid='reset' onClick={reset}>
        Reset
      </button>
    </div>
  )
}

describe('AppContext', () => {
  it('getInitialAppContext returns correct initial state', () => {
    const ctx = getInitialAppContext()
    expect(ctx.isAuthenticated).toBe(false)
    expect(ctx.profile).toBe(null)
    expect(typeof ctx.setIsAuthenticated).toBe('function')
    expect(typeof ctx.setProfile).toBe('function')
    expect(typeof ctx.reset).toBe('function')
  })

  it('AppProvider renders children', () => {
    render(
      <AppProvider>
        <div data-testid='child'>Hello</div>
      </AppProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('provides initial state to consumers', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('profile').textContent).toBe('null')
  })

  it('reads access_token from localStorage for initial auth state', () => {
    localStorage.setItem('access_token', 'test-token')
    const ctx = getInitialAppContext()
    expect(ctx.isAuthenticated).toBe(true)
    localStorage.clear()
  })

  it('reads profile from localStorage for initial state', () => {
    const mockProfile = { _id: '1', email: 'test@test.com', roles: ['User'], createdAt: '', updatedAt: '' }
    localStorage.setItem('profile', JSON.stringify(mockProfile))
    const ctx = getInitialAppContext()
    expect(ctx.profile).toEqual(mockProfile)
    localStorage.clear()
  })
})
