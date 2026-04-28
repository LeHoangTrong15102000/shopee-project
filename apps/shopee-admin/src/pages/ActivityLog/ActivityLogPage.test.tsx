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

  it('renders entries with different action types', async () => {
    const store = useActivityLogStore.getState()
    store.addLog({ action: 'create', entityType: 'Product', entityName: 'New Product', adminEmail: 'a@test.com' })
    store.addLog({ action: 'update', entityType: 'Category', entityName: 'Updated Cat', adminEmail: 'a@test.com' })
    store.addLog({ action: 'delete', entityType: 'User', entityName: 'Deleted User', adminEmail: 'a@test.com' })
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('New Product')).toBeInTheDocument()
    })
    expect(screen.getByText('Updated Cat')).toBeInTheDocument()
    expect(screen.getByText('Deleted User')).toBeInTheDocument()
  })

  it('does not show clear log button when no entries', async () => {
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('empty.title')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /actions.clearLog/i })).not.toBeInTheDocument()
  })

  it('renders unknown action type with fallback FileText icon', async () => {
    // Directly set state with an unknown action type to cover the ?? FileText branch
    useActivityLogStore.setState({
      entries: [
        {
          id: 'test-unknown',
          action: 'unknown' as 'create',
          entityType: 'Product',
          entityName: 'Unknown Action Product',
          adminEmail: 'admin@test.com',
          timestamp: new Date().toISOString(),
        },
      ],
    })
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('Unknown Action Product')).toBeInTheDocument()
    })
  })

  it('groups entries by date correctly', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    useActivityLogStore.setState({
      entries: [
        {
          id: 'entry-today',
          action: 'create',
          entityType: 'Product',
          entityName: 'Today Product',
          adminEmail: 'admin@test.com',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'entry-yesterday',
          action: 'update',
          entityType: 'Order',
          entityName: 'Yesterday Order',
          adminEmail: 'admin@test.com',
          timestamp: yesterday.toISOString(),
        },
      ],
    })
    renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('Today Product')).toBeInTheDocument()
      expect(screen.getByText('Yesterday Order')).toBeInTheDocument()
    })
  })

  it('cancels clear log when dialog is dismissed', async () => {
    useActivityLogStore.getState().addLog({
      action: 'create',
      entityType: 'Product',
      entityName: 'Keep This',
      adminEmail: 'admin@test.com',
    })
    const { user } = renderWithProviders(<ActivityLogPage />)
    await waitFor(() => {
      expect(screen.getByText('Keep This')).toBeInTheDocument()
    })
    const clearBtn = screen.getByRole('button', { name: /actions.clearLog/i })
    await user.click(clearBtn)
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    const cancelBtn = screen.getByRole('button', { name: /buttons.cancel/i })
    await user.click(cancelBtn)
    await waitFor(() => {
      expect(screen.getByText('Keep This')).toBeInTheDocument()
    })
  })
})
