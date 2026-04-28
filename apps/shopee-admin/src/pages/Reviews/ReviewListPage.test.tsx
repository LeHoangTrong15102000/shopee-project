import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ReviewListPage from './ReviewListPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('ReviewListPage', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders review table after loading', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders page header with title', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders stat cards', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('renders search input', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders data rows in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders review stat cards with data', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalReviews')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.averageRating')).toBeInTheDocument()
  })

  it('renders rating column in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders review comment text in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.comment')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders moderation status badges', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.moderation')
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders review comment in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm rất tốt, giao hàng nhanh')).toBeInTheDocument()
    })
  })

  it('renders review rating in table', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    const table = screen.getByRole('table')
    expect(table).toHaveTextContent('columns.rating')
    await waitFor(() => {
      const cells = screen.getAllByRole('cell')
      const hasRatingCell = cells.some((cell) => /[1-5]/.test(cell.textContent || ''))
      expect(hasRatingCell).toBe(true)
    })
  })

  it('renders review stat card values', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalReviews')).toBeInTheDocument()
    })
    await waitFor(() => {
      const statCards = document.querySelectorAll('[class*="card"]')
      expect(statCards.length).toBeGreaterThan(0)
      expect(screen.getByText('stats.averageRating')).toBeInTheDocument()
    })
  })

  it('renders five star reviews stat', async () => {
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.fiveStarReviews')).toBeInTheDocument()
    })
  })

  it('navigates to review detail via dropdown view action', async () => {
    const { user } = renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.view')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.view'))
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/reviews/'))
  })

  it('opens delete dialog via dropdown menu', async () => {
    const { user } = renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.delete'))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
  })

  it('confirms delete and dialog closes', async () => {
    const { user } = renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.delete'))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.confirm/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('clicks approve action in dropdown menu', async () => {
    const { user } = renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.approve')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.approve'))
  })

  it('clicks flag action in dropdown menu', async () => {
    const { user } = renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.flag')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.flag'))
  })

  it('closes delete dialog via cancel button (onOpenChange false branch)', async () => {
    const { user } = renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByLabelText('common:aria.actions').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByLabelText('common:aria.actions')[0])
    await waitFor(() => {
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })
    await user.click(screen.getByText('actions.delete'))
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    // Click cancel to trigger onOpenChange(false) -> setDeleteId(null)
    await user.click(screen.getByRole('button', { name: /buttons.cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('renders user name or email in table cell', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews`, () => {
        return HttpResponse.json({
          data: {
            reviews: [
              {
                _id: 'review-no-name',
                user: { _id: 'user-1', name: '', email: 'noname@example.com' },
                product: { _id: 'prod-1', name: 'Test Product', image: '' },
                rating: 4,
                comment: 'Good product',
                helpful_count: 0,
                images: [],
                comments: [],
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        })
      }),
    )
    renderWithProviders(<ReviewListPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('noname@example.com')).toBeInTheDocument()
    })
  })
})
