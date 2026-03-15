import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from 'src/test-utils'
import { useAuthStore } from 'src/stores/auth.store'
import { createMockUser } from 'src/test-utils/factories'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function TestApp({ initialEntries }: { initialEntries: string[] }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <div>Products Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Protected Route Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: '',
      refreshToken: '',
      user: null,
      isAuthenticated: false,
    })
    localStorage.clear()
  })

  it('redirects unauthenticated user to /login', () => {
    render(<TestApp initialEntries={['/']} />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('allows authenticated user to access protected pages', () => {
    const user = createMockUser({ roles: ['Admin'] })
    useAuthStore.setState({
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      user,
      isAuthenticated: true,
    })
    render(<TestApp initialEntries={['/']} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects to login after logout', () => {
    const user = createMockUser({ roles: ['Admin'] })
    useAuthStore.setState({
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      user,
      isAuthenticated: true,
    })
    const { rerender } = render(<TestApp initialEntries={['/']} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    // Simulate logout
    useAuthStore.getState().logout()
    rerender(<TestApp initialEntries={['/']} />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})

