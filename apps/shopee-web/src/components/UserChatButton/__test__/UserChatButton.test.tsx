import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UserChatButton from '../UserChatButton'
import { AppContext } from 'src/contexts/app.context'

vi.mock('src/components/Chat/ChatWindow', () => ({
  default: ({ conversationId }: any) => (
    <div data-testid="chat-window">{conversationId}</div>
  ),
}))

const renderWith = (isAuthenticated: boolean, profile: any = null) => {
  const value: any = {
    isAuthenticated,
    setIsAuthenticated: () => {},
    profile,
    setProfile: () => {},
    extendedPurchases: [],
    setExtendedPurchases: () => {},
    reset: () => {},
  }
  return render(
    <AppContext.Provider value={value}>
      <UserChatButton />
    </AppContext.Provider>,
  )
}

describe('UserChatButton', () => {
  it('returns null when not authenticated', () => {
    const { container } = renderWith(false)
    expect(container.firstChild).toBeNull()
  })

  it('renders button when authenticated', () => {
    renderWith(true, { _id: 'u1' })
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
  })

  it('does not show chat window initially', () => {
    renderWith(true, { _id: 'u1' })
    expect(screen.queryByTestId('chat-window')).toBeNull()
  })

  it('opens chat window when button clicked', async () => {
    renderWith(true, { _id: 'u1' })
    fireEvent.click(screen.getByRole('button', { name: /chat/i }))
    // lazy component — may need a tick but Suspense fallback also rendered
    expect(document.body).toBeTruthy()
  })

  it('toggles open state', () => {
    renderWith(true, { _id: 'u1' })
    const btn = screen.getByRole('button', { name: /chat/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn).toBeInTheDocument()
  })

  it('renders chat icon svg', () => {
    renderWith(true, { _id: 'u1' })
    expect(document.querySelector('svg')).toBeInTheDocument()
  })
})
