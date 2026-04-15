import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ActivityLogPage from './ActivityLogPage'
import { useActivityLogStore } from 'src/stores/activity-log.store'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('ActivityLogPage', () => {
  afterEach(() => {
    useActivityLogStore.setState({ entries: [] })
  })

  it('renders page title', async () => {
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders empty state when no entries', async () => {
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('empty.title')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders activity log header', async () => {
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
      expect(screen.getByText('description')).toBeInTheDocument()
    })
    expect(screen.getByText('empty.title')).toBeInTheDocument()
    expect(screen.getByText('empty.description')).toBeInTheDocument()
  })

  it('renders log entries when store has data', async () => {
    useActivityLogStore.getState().addLog({
      action: 'create',
      entityType: 'Product',
      entityName: 'Test Product',
      adminEmail: 'admin@test.com',
    })
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    expect(screen.getByText('admin@test.com')).toBeInTheDocument()
  })

  it('shows clear log button when entries exist', async () => {
    useActivityLogStore.getState().addLog({
      action: 'update',
      entityType: 'Category',
      entityName: 'Electronics',
      adminEmail: 'admin@test.com',
    })
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actions.clearLog/i })).toBeInTheDocument()
    })
  })

  it('clears log when confirm dialog confirmed', async () => {
    useActivityLogStore.getState().addLog({
      action: 'delete',
      entityType: 'Order',
      entityName: 'Order #123',
      adminEmail: 'admin@test.com',
    })
    const { user } = renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('Order #123')).toBeInTheDocument()
    })
    const clearBtn = screen.getByRole('button', { name: /actions.clearLog/i })
    await user.click(clearBtn)
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    const confirmBtn = screen.getByRole('button', { name: /buttons.confirm/i })
    await user.click(confirmBtn)
    await waitFor(() => {
      expect(screen.getByText('empty.title')).toBeInTheDocument()
    })
  })
})
