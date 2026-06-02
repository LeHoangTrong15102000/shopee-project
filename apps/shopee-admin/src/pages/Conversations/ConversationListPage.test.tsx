import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ConversationListPage from './ConversationListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('ConversationListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders page header', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders conversations table after loading', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders column headers', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.id')).toBeInTheDocument()
    expect(screen.getByText('columns.user')).toBeInTheDocument()
    expect(screen.getByText('columns.status')).toBeInTheDocument()
  })

  it('renders user names', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
    })
  })

  it('renders status badges', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('status.open')).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders view buttons in table rows', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })
    // View buttons exist in the table (one per row)
    const table = screen.getByRole('table')
    const buttons = table.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders message count column', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.messageCount')).toBeInTheDocument()
  })

  it('renders date column', async () => {
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('columns.date')).toBeInTheDocument()
  })

  it('renders user ID fallback when user is a string', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            conversations: [
              {
                _id: 'conv-str-user',
                user: 'user-id-string',
                messages: [],
                message_count: 0,
                status: 'open',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        })
      }),
    )
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('d-string')).toBeInTheDocument()
    })
  })

  it('renders pagination when multiple pages', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            conversations: [
              {
                _id: 'conv-001',
                user: { _id: 'user-1', name: 'Test', email: 'test@test.com' },
                messages: [],
                message_count: 0,
                status: 'open',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
          },
        })
      }),
    )
    renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByText(/pagination\.page/)).toBeInTheDocument()
    })
    expect(screen.getByText(/pagination\.of/)).toBeInTheDocument()
  })

  it('pagination buttons work', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            conversations: [
              {
                _id: 'conv-001',
                user: { _id: 'user-1', name: 'Test', email: 'test@test.com' },
                messages: [],
                message_count: 0,
                status: 'open',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByText(/pagination\.page/)).toBeInTheDocument()
    })
    // Click next page button (aria-label pagination.nextPage)
    const nextBtn = screen.getByRole('button', { name: 'pagination.nextPage' })
    await user.click(nextBtn)
    await waitFor(() => {
      const pageSpan = screen.getByText(/pagination\.page/)
      expect(pageSpan.textContent).toContain('2')
    })
  })

  it('previous page button works', async () => {
    server.use(
      http.get(`${API_URL}/admin/conversations`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            conversations: [
              {
                _id: 'conv-001',
                user: { _id: 'user-1', name: 'Test', email: 'test@test.com' },
                messages: [],
                message_count: 0,
                status: 'open',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
          },
        })
      }),
    )
    const { user } = renderWithProviders(<ConversationListPage />)
    await waitFor(() => {
      expect(screen.getByText(/pagination\.page/)).toBeInTheDocument()
    })
    // Go to page 2 first
    const nextBtn = screen.getByRole('button', { name: 'pagination.nextPage' })
    await user.click(nextBtn)
    await waitFor(() => {
      const pageSpan = screen.getByText(/pagination\.page/)
      expect(pageSpan.textContent).toContain('2')
    })
    // Now click previous
    const prevBtn = screen.getByRole('button', { name: 'pagination.previousPage' })
    await user.click(prevBtn)
    await waitFor(() => {
      const pageSpan = screen.getByText(/pagination\.page/)
      expect(pageSpan.textContent).toContain('1')
    })
  })
})
