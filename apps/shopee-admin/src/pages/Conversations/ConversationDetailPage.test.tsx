import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ConversationDetailPage from './ConversationDetailPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'conv-001' }),
  }
})

describe('ConversationDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders page header with conversation ID', async () => {
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText(/detail.title/)).toBeInTheDocument()
    })
  })

  it('renders back button', async () => {
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('detail.backToList')).toBeInTheDocument()
    })
  })

  it('renders messages section title', async () => {
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('detail.messages')).toBeInTheDocument()
    })
  })

  it('renders message content', async () => {
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
    expect(screen.getByText('Hi, how can I help?')).toBeInTheDocument()
  })

  it('renders sender type badges', async () => {
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('senderType.user')).toBeInTheDocument()
    })
    expect(screen.getByText('senderType.admin')).toBeInTheDocument()
  })

  it('shows error state when conversation not found', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      }),
    )
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('notFound')).toBeInTheDocument()
    })
  })

  it('navigates back when back button clicked', async () => {
    const { user } = renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('detail.backToList')).toBeInTheDocument()
    })
    await user.click(screen.getByText('detail.backToList'))
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('shows no messages state for empty conversation', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations/:id`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            _id: 'conv-empty',
            user: { _id: 'user-1', name: 'Test', email: 'test@test.com' },
            messages: [],
            message_count: 0,
            status: 'open',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        })
      }),
    )
    renderWithProviders(<ConversationDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('detail.noMessages')).toBeInTheDocument()
    })
  })
})
