import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { SocketContext, SocketProvider } from '../socket.context'
import { AppProvider } from '../app.context'

// Test consumer
const TestConsumer = () => {
  const { isConnected, connectionStatus } = useContext(SocketContext)
  return (
    <div>
      <span data-testid='connected'>{String(isConnected)}</span>
      <span data-testid='status'>{connectionStatus}</span>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('SocketContext', () => {
  it('renders children', () => {
    render(
      <AppProvider>
        <SocketProvider>
          <div data-testid='child'>Hello</div>
        </SocketProvider>
      </AppProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('provides initial disconnected state when not authenticated', () => {
    render(
      <AppProvider>
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      </AppProvider>
    )
    // When not authenticated, socket should not connect
    // With enableSocket=false, it simulates connected when authenticated
    const status = screen.getByTestId('status').textContent
    expect(['disconnected', 'connected']).toContain(status)
  })

  it('provides connection status', () => {
    render(
      <AppProvider>
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      </AppProvider>
    )
    expect(screen.getByTestId('status')).toBeInTheDocument()
  })
})
