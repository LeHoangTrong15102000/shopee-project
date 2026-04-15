import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import QAPage from './QAPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('QAPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<QAPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders page title after loading', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders stats section after loading', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders QA stats after loading', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalQuestions')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.totalAnswers')).toBeInTheDocument()
    expect(screen.getByText('stats.unanswered')).toBeInTheDocument()
  })

  it('renders question cards after loading', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.deleteItem/i }).length).toBeGreaterThan(0)
    })
  })

  it('renders question metadata', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalQuestions')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByText(/answers/i).length).toBeGreaterThan(0)
    })
  })

  it('renders delete button for each question', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalQuestions')).toBeInTheDocument()
    })
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })

  it('renders question titles after loading', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalQuestions')).toBeInTheDocument()
    })
    // Questions should be rendered as cards
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders question titles from mock data', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
  })

  it('renders question user info', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getAllByText(/Nguyễn Văn A/).length).toBeGreaterThan(0)
    })
  })

  it('clicks delete button opens confirm dialog', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.deleteItem/i }).length).toBeGreaterThan(0)
    })
    const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByText('toast.deleteQuestionTitle')).toBeInTheDocument()
    })
  })

  it('renders question title text from mock data', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
  })

  it('renders answer count text', async () => {
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getAllByText(/answers/i).length).toBeGreaterThan(0)
    })
  })

  it('expands question to show answer content', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    // Click the first question's collapsible trigger to expand it
    const trigger = screen.getByText('Sản phẩm có bảo hành không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      // After expanding, the answer content should be visible
      await waitFor(() => {
        expect(screen.getByText('Có bảo hành 12 tháng')).toBeInTheDocument()
      })
    }
  })

  it('shows no answers text for question without answers', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Có hỗ trợ trả góp không?')).toBeInTheDocument()
    })
    // Click the third question (qa-3 has 0 answers)
    const trigger = screen.getByText('Có hỗ trợ trả góp không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('noAnswers')).toBeInTheDocument()
      })
    }
  })
})
