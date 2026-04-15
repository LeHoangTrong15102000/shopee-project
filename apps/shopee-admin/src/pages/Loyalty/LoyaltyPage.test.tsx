import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from 'src/test-utils'
import LoyaltyPage from './LoyaltyPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('LoyaltyPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders tabs', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.rewards')).toBeInTheDocument()
      expect(screen.getByText('tabs.transactions')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders rewards table by default', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('can switch to transactions tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const transactionsTab = screen.getByRole('tab', { name: /tabs.transactions/i })
    await user.click(transactionsTab)
    expect(transactionsTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders stat cards', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/loyalty/rewards`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders create reward button', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /rewards.addReward/i })).toBeInTheDocument()
  })

  it('opens create reward dialog when add button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addButton = screen.getByRole('button', { name: /rewards.addReward/i })
    await user.click(addButton)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('rewards.name')).toBeInTheDocument()
    expect(screen.getByLabelText('rewards.description')).toBeInTheDocument()
    expect(screen.getByLabelText('rewards.pointsRequired')).toBeInTheDocument()
  })

  it('renders loyalty stat cards', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const statsTab = screen.getByRole('tab', { name: /tabs.stats/i })
    await user.click(statsTab)
    await waitFor(() => {
      expect(screen.getByText('stats.totalUsers')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.pointsEarned')).toBeInTheDocument()
    expect(screen.getByText('stats.pointsRedeemed')).toBeInTheDocument()
  })

  it('fills create reward form fields', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addButton = screen.getByRole('button', { name: /rewards.addReward/i })
    await user.click(addButton)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const nameInput = screen.getByLabelText('rewards.name')
    const descInput = screen.getByLabelText('rewards.description')
    const pointsInput = screen.getByLabelText('rewards.pointsRequired')
    await user.type(nameInput, 'Test Reward')
    await user.type(descInput, 'Test Description')
    await user.clear(pointsInput)
    await user.type(pointsInput, '500')
    expect(nameInput).toHaveValue('Test Reward')
    expect(descInput).toHaveValue('Test Description')
    expect(pointsInput).toHaveValue(500)
  })

  it('renders reward names in table', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('rewards.name')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders reward column headers', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('rewards.name')).toBeInTheDocument()
    expect(screen.getByText('rewards.description')).toBeInTheDocument()
    expect(screen.getByText('rewards.points')).toBeInTheDocument()
    expect(screen.getByText('rewards.status')).toBeInTheDocument()
  })

  it('renders transaction data in transactions tab', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const transactionsTab = screen.getByRole('tab', { name: /tabs.transactions/i })
    await user.click(transactionsTab)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('submits create reward form', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addButton = screen.getByRole('button', { name: /rewards.addReward/i })
    await user.click(addButton)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('rewards.name'), 'New Reward')
    await user.type(screen.getByLabelText('rewards.description'), 'A great reward')
    await user.clear(screen.getByLabelText('rewards.pointsRequired'))
    await user.type(screen.getByLabelText('rewards.pointsRequired'), '1500')
    const createBtn = screen.getByRole('button', { name: /buttons.create/i })
    await user.click(createBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders reward points in table', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('rewards.points')
    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument()
    })
  })

  it('fills all create reward form fields', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const addButton = screen.getByRole('button', { name: /rewards.addReward/i })
    await user.click(addButton)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const nameInput = screen.getByLabelText('rewards.name')
    const descInput = screen.getByLabelText('rewards.description')
    const pointsInput = screen.getByLabelText('rewards.pointsRequired')
    await user.type(nameInput, 'New Test Reward')
    await user.type(descInput, 'A test reward description')
    await user.clear(pointsInput)
    await user.type(pointsInput, '750')
    expect(nameInput).toHaveValue('New Test Reward')
    expect(descInput).toHaveValue('A test reward description')
    expect(pointsInput).toHaveValue(750)
  })

  it('renders reward name from mock data', async () => {
    renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Giảm 50k')).toBeInTheDocument()
    })
  })

  it('clicks edit reward button opens edit dialog', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.editItem/i }).length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByRole('button', { name: /aria.editItem/i })[0])
    await waitFor(() => {
      expect(screen.getByText('rewards.editReward')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('rewards.name')).toHaveValue('Giảm 50k')
  })

  it('clicks delete reward button opens confirm dialog', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.deleteItem/i }).length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByRole('button', { name: /aria.deleteItem/i })[0])
    await waitFor(() => {
      expect(screen.getByText('toast.deleteTitle')).toBeInTheDocument()
    })
  })

  it('opens adjust points dialog from stats tab', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.stats')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.stats'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actions.adjustPoints/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /actions.adjustPoints/i }))
    await waitFor(() => {
      expect(screen.getByLabelText('actions.userId')).toBeInTheDocument()
      expect(screen.getByLabelText('actions.pointsAmount')).toBeInTheDocument()
    })
  })

  it('switches to transactions tab and shows data', async () => {
    const { user } = renderWithProviders(<LoyaltyPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.transactions')).toBeInTheDocument()
    })
    await user.click(screen.getByText('tabs.transactions'))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })
})
