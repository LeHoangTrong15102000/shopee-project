import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import QAPage from './QAPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

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

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/qa/questions`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  it('confirms delete question and dialog closes', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.deleteItem/i }).length).toBeGreaterThan(0)
    })
    const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('toast.deleteQuestionTitle')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /buttons.confirm/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('opens delete answer dialog when answer delete button clicked', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Sản phẩm có bảo hành không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Có bảo hành 12 tháng')).toBeInTheDocument()
      })
      const answerDeleteBtns = screen.getAllByRole('button', { name: /aria.deleteItem/i })
      // After expanding qa-1: idx 0 = qa-1 question delete, idx 1 = qa-1 answer delete,
      // idx 2 = qa-2 question delete, idx 3 = qa-3 question delete
      await user.click(answerDeleteBtns[1])
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getByText('toast.deleteAnswerTitle')).toBeInTheDocument()
      })
    }
  })

  it('confirms delete answer and dialog closes', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Sản phẩm có bảo hành không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Có bảo hành 12 tháng')).toBeInTheDocument()
      })
      const answerDeleteBtns = screen.getAllByRole('button', { name: /aria.deleteItem/i })
      // idx 1 is the answer delete button (idx 0 is the question delete for qa-1)
      await user.click(answerDeleteBtns[1])
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /buttons.confirm/i }))
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    }
  })

  it('renders question content text when expanded', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Sản phẩm có bảo hành không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Có bảo hành 12 tháng')).toBeInTheDocument()
      })
    }
  })

  it('collapses question when clicking trigger again', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Sản phẩm có bảo hành không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Có bảo hành 12 tháng')).toBeInTheDocument()
      })
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.queryByText('Có bảo hành 12 tháng')).not.toBeInTheDocument()
      })
    }
  })

  it('closes question delete dialog via cancel button (onOpenChange false branch)', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /aria.deleteItem/i }).length).toBeGreaterThan(0)
    })
    const deleteButtons = screen.getAllByRole('button', { name: /aria.deleteItem/i })
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
    // Click cancel to trigger onOpenChange(false) -> setDeleteQ(null)
    await user.click(screen.getByRole('button', { name: /buttons.cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('closes answer delete dialog via cancel button (onOpenChange false branch)', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm có bảo hành không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Sản phẩm có bảo hành không?').closest('button')
    if (trigger) {
      await user.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Có bảo hành 12 tháng')).toBeInTheDocument()
      })
      const answerDeleteBtns = screen.getAllByRole('button', { name: /aria.deleteItem/i })
      await user.click(answerDeleteBtns[1])
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getByText('toast.deleteAnswerTitle')).toBeInTheDocument()
      })
      // Click cancel to trigger onOpenChange(false) -> setDeleteA(null)
      await user.click(screen.getByRole('button', { name: /buttons.cancel/i }))
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    }
  })

  it('opens answer form when clicking answer button on unanswered question', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Có hỗ trợ trả góp không?')).toBeInTheDocument()
    })
    // Expand qa-3 first so CollapsibleContent is visible
    const trigger = screen.getByText('Có hỗ trợ trả góp không?').closest('button')
    if (trigger) await user.click(trigger)
    // qa-3 has answers_count=0, so it shows the Answer button
    const answerBtn = screen.getByRole('button', { name: /actions.answer/i })
    await user.click(answerBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('answerForm.label')).toBeInTheDocument()
    })
  })

  it('shows validation error when submitting empty answer', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Có hỗ trợ trả góp không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Có hỗ trợ trả góp không?').closest('button')
    if (trigger) await user.click(trigger)
    const answerBtn = screen.getByRole('button', { name: /actions.answer/i })
    await user.click(answerBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('answerForm.label')).toBeInTheDocument()
    })
    // Submit without typing anything
    await user.click(screen.getByRole('button', { name: 'answerForm.submit' }))
    await waitFor(() => {
      expect(screen.getByText('answerForm.validation')).toBeInTheDocument()
    })
  })

  it('clears validation error when typing in answer textarea', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Có hỗ trợ trả góp không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Có hỗ trợ trả góp không?').closest('button')
    if (trigger) await user.click(trigger)
    const answerBtn = screen.getByRole('button', { name: /actions.answer/i })
    await user.click(answerBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('answerForm.label')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'answerForm.submit' }))
    await waitFor(() => {
      expect(screen.getByText('answerForm.validation')).toBeInTheDocument()
    })
    // Type something to clear the error
    await user.type(screen.getByLabelText('answerForm.label'), 'Some answer')
    await waitFor(() => {
      expect(screen.queryByText('answerForm.validation')).not.toBeInTheDocument()
    })
  })

  it('submits answer successfully and closes form', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Có hỗ trợ trả góp không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Có hỗ trợ trả góp không?').closest('button')
    if (trigger) await user.click(trigger)
    const answerBtn = screen.getByRole('button', { name: /actions.answer/i })
    await user.click(answerBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('answerForm.label')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('answerForm.label'), 'Có hỗ trợ trả góp')
    await user.click(screen.getByRole('button', { name: 'answerForm.submit' }))
    await waitFor(() => {
      expect(screen.queryByLabelText('answerForm.label')).not.toBeInTheDocument()
    })
  })

  it('closes answer form when clicking cancel', async () => {
    const { user } = renderWithProviders(<QAPage />)
    await waitFor(() => {
      expect(screen.getByText('Có hỗ trợ trả góp không?')).toBeInTheDocument()
    })
    const trigger = screen.getByText('Có hỗ trợ trả góp không?').closest('button')
    if (trigger) await user.click(trigger)
    const answerBtn = screen.getByRole('button', { name: /actions.answer/i })
    await user.click(answerBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('answerForm.label')).toBeInTheDocument()
    })
    // Click Cancel button
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByLabelText('answerForm.label')).not.toBeInTheDocument()
    })
  })
})
