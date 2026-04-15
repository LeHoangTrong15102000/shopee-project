import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import NotificationListPage from './NotificationListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('NotificationListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders notification table after loading', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with title', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders create notification buttons', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /tabs.targeted/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tabs.broadcast/i })).toBeInTheDocument()
  })

  it('renders page description', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/notifications`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders search input', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search.placeholder')).toBeInTheDocument()
  })

  it('opens targeted notification dialog when targeted button clicked', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('form.userId')).toBeInTheDocument()
      expect(screen.getByLabelText('form.title')).toBeInTheDocument()
    })
  })

  it('opens broadcast notification dialog when broadcast button clicked', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('form.title')).toBeInTheDocument()
      expect(screen.getByLabelText('form.message')).toBeInTheDocument()
    })
  })

  it('fills targeted notification form', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const titleInput = screen.getByLabelText('form.title')
    const messageInput = screen.getByLabelText('form.message')
    await user.type(titleInput, 'Test Notification')
    await user.type(messageInput, 'Test message content')
    expect(titleInput).toHaveValue('Test Notification')
    expect(messageInput).toHaveValue('Test message content')
  })

  it('renders notification type badges', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.type')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('submits targeted notification form', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const targetedBtn = screen.getByRole('button', { name: /tabs.targeted/i })
    await user.click(targetedBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('form.userId'), 'user-123')
    await user.type(screen.getByLabelText('form.title'), 'Test Notification Title')
    await user.type(screen.getByLabelText('form.message'), 'Test notification message content')
    const sendBtn = screen.getByRole('button', { name: /buttons.send/i })
    await user.click(sendBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('renders notification title in table', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Đơn hàng mới')).toBeInTheDocument()
    })
  })

  it('fills broadcast notification form', async () => {
    const { user } = renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const broadcastBtn = screen.getByRole('button', { name: /tabs.broadcast/i })
    await user.click(broadcastBtn)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const titleInput = screen.getByLabelText('form.title')
    const messageInput = screen.getByLabelText('form.message')
    await user.type(titleInput, 'Broadcast Title')
    await user.type(messageInput, 'Broadcast message content')
    expect(titleInput).toHaveValue('Broadcast Title')
    expect(messageInput).toHaveValue('Broadcast message content')
  })

  it('renders notification date in table', async () => {
    renderWithProviders(<NotificationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const dateCells = screen.getAllByText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
      expect(dateCells.length).toBeGreaterThan(0)
    })
  })
})
