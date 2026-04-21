import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProductQA from '../ProductQA/ProductQA'

// Hoisted mock variables (must be hoisted for vi.mock factories)
const {
  mockState,
  mockFetchNextPage,
  mockAskQuestionMutate,
  mockAnswerQuestionMutate,
  mockLikeQuestionMutate,
  mockLikeAnswerMutate,
  mockInvalidateQueries,
  mockToastSuccess,
  mockToastError,
  mockToastWarning,
} = vi.hoisted(() => ({
  mockState: {
    isAuthenticated: false,
    questionsData: {
      data: {
        data: {
          questions: [] as any[],
          pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
        },
      },
    } as any,
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
  },
  mockFetchNextPage: vi.fn(),
  mockAskQuestionMutate: vi.fn(),
  mockAnswerQuestionMutate: vi.fn(),
  mockLikeQuestionMutate: vi.fn(),
  mockLikeAnswerMutate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockToastWarning: vi.fn(),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'questionCount') return `${options?.count || 0} questions`
      if (key === 'reply') return `Reply (${options?.count || 0})`
      return key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}))

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useInfiniteQuery: () => ({
      data: mockState.isLoading ? undefined : { pages: [mockState.questionsData] },
      isLoading: mockState.isLoading,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: mockState.hasNextPage,
      isFetchingNextPage: mockState.isFetchingNextPage,
    }),
    useMutation: ({ onSuccess, onError }: any) => {
      const mutationFn = vi.fn((data: any) => {
        if (data?.product_id || data?.questionId || typeof data === 'string') {
          onSuccess?.()
          return Promise.resolve()
        }
        onError?.()
        return Promise.reject()
      })

      return {
        mutate: mutationFn,
        isPending: false,
      }
    },
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
    warning: (msg: string) => mockToastWarning(msg),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours ago',
}))

// Mock qa.api
vi.mock('src/apis/qa.api', () => ({
  default: {
    getQuestions: vi.fn(() => Promise.resolve(mockState.questionsData)),
    askQuestion: mockAskQuestionMutate,
    answerQuestion: mockAnswerQuestionMutate,
    likeQuestion: mockLikeQuestionMutate,
    likeAnswer: mockLikeAnswerMutate,
  },
}))

// Mock AppContext — use getter so isAuthenticated reads dynamically from mockState
vi.mock('src/contexts/app.context', () => ({
  AppContext: {
    Provider: ({ children }: any) => children,
    Consumer: {} as any,
    get _currentValue() {
      return {
        isAuthenticated: mockState.isAuthenticated,
        setIsAuthenticated: vi.fn(),
        profile: null,
        setProfile: vi.fn(),
        reset: vi.fn(),
      }
    },
  },
}))

// Mock Button component
vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}))

describe('ProductQA', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    mockState.isAuthenticated = false
    mockState.isLoading = false
    mockState.hasNextPage = false
    mockState.isFetchingNextPage = false
    mockState.questionsData = {
      data: {
        data: {
          questions: [],
          pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
        },
      },
    }

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductQA productId="test-product-id" {...props} />
      </QueryClientProvider>,
    )
  }

  describe('Loading state', () => {
    it('shows skeleton when loading', () => {
      mockState.isLoading = true

      renderComponent()

      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeTruthy()
      expect(skeleton?.closest('[role="status"]')).toBeTruthy()
    })

    it('shows multiple skeleton items', () => {
      mockState.isLoading = true

      renderComponent()

      const skeletonItems = document.querySelectorAll('.animate-pulse .rounded-lg')
      expect(skeletonItems.length).toBeGreaterThan(0)
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no questions', async () => {
      mockState.isLoading = false
      mockState.questionsData = {
        data: {
          data: {
            questions: [],
            pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('empty.title')).toBeTruthy()
      })
    })

    it('shows empty state subtitle', async () => {
      mockState.isLoading = false

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('empty.subtitle')).toBeTruthy()
      })
    })
  })

  describe('Authenticated user', () => {
    beforeEach(() => {
      mockState.isAuthenticated = true
    })

    it('shows ask question form for authenticated user', async () => {
      renderComponent()

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('questionPlaceholder')
        expect(textarea).toBeTruthy()
      })
    })

    it('shows submit button for authenticated user', async () => {
      renderComponent()

      await waitFor(() => {
        const submitButton = screen.getByText('submitQuestion')
        expect(submitButton).toBeTruthy()
      })
    })

    it('submit button is disabled when textarea is empty', async () => {
      renderComponent()

      await waitFor(() => {
        const submitButton = screen.getByText('submitQuestion') as HTMLButtonElement
        expect(submitButton.disabled).toBe(true)
      })
    })
  })

  describe('Unauthenticated user', () => {
    beforeEach(() => {
      mockState.isAuthenticated = false
    })

    it('shows login prompt for unauthenticated user', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('loginToAsk')).toBeTruthy()
      })
    })

    it('shows login link for unauthenticated user', async () => {
      renderComponent()

      await waitFor(() => {
        const loginLink = screen.getByText('loginNow')
        expect(loginLink).toBeTruthy()
        expect(loginLink.closest('a')?.getAttribute('href')).toBe('/login')
      })
    })
  })

  describe('Question list rendering', () => {
    beforeEach(() => {
      mockState.isLoading = false
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Is this product good?',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 5,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
              {
                _id: 'q2',
                question: 'What is the warranty?',
                user: {
                  _id: 'u2',
                  name: 'Jane Smith',
                  avatar: 'https://example.com/avatar.jpg',
                },
                likes_count: 3,
                is_liked: true,
                answers: [],
                createdAt: '2026-03-18T09:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 2, total_pages: 1 },
          },
        },
      }
    })

    it('renders question list with user names', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy()
        expect(screen.getByText('Jane Smith')).toBeTruthy()
      })
    })

    it('renders question text', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Is this product good?')).toBeTruthy()
        expect(screen.getByText('What is the warranty?')).toBeTruthy()
      })
    })

    it('shows question count', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('2 questions')).toBeTruthy()
      })
    })
  })

  describe('User avatars', () => {
    it('shows avatar image when available', async () => {
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: 'https://example.com/avatar.jpg',
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        const avatar = screen.getByAltText('John Doe') as HTMLImageElement
        expect(avatar).toBeTruthy()
        expect(avatar.src).toContain('avatar.jpg')
      })
    })

    it('shows initials fallback when no avatar', async () => {
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('J')).toBeTruthy()
      })
    })
  })

  describe('Answers section', () => {
    beforeEach(() => {
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [
                  {
                    _id: 'a1',
                    answer: 'This is a great product!',
                    user: {
                      _id: 'u2',
                      name: 'Seller Name',
                      avatar: null,
                      is_seller: false,
                    },
                    likes_count: 2,
                    is_liked: false,
                    createdAt: '2026-03-18T11:00:00Z',
                  },
                ],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }
    })

    it('renders answers for questions', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('This is a great product!')).toBeTruthy()
      })
    })

    it('shows answer user name', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Seller Name')).toBeTruthy()
      })
    })

    it('shows answer likes count', async () => {
      renderComponent()

      await waitFor(() => {
        const answerSection = screen.getByText('This is a great product!').closest('div')
        expect(answerSection?.textContent).toContain('2')
      })
    })
  })

  describe('Seller badge', () => {
    it('shows seller badge on seller answers', async () => {
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [
                  {
                    _id: 'a1',
                    answer: 'Official answer',
                    user: {
                      _id: 'u2',
                      name: 'Official Seller',
                      avatar: null,
                      is_seller: true,
                    },
                    likes_count: 0,
                    is_liked: false,
                    createdAt: '2026-03-18T11:00:00Z',
                  },
                ],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('seller')).toBeTruthy()
      })
    })

    it('does not show seller badge on non-seller answers', async () => {
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [
                  {
                    _id: 'a1',
                    answer: 'Regular answer',
                    user: {
                      _id: 'u2',
                      name: 'Regular User',
                      avatar: null,
                      is_seller: false,
                    },
                    likes_count: 0,
                    is_liked: false,
                    createdAt: '2026-03-18T11:00:00Z',
                  },
                ],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.queryByText('seller')).toBeNull()
      })
    })
  })

  describe('Reply form toggle', () => {
    beforeEach(() => {
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }
    })

    it('shows reply button', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Reply (0)')).toBeTruthy()
      })
    })

    it('toggles reply form when reply button clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Reply (0)')).toBeTruthy()
      })

      const replyButton = screen.getByText('Reply (0)')
      await user.click(replyButton)

      await waitFor(() => {
        const replyForm = document.querySelector('#reply-form-q1')
        expect(replyForm).toBeTruthy()
      })
    })
  })

  describe('Load more button', () => {
    it('shows load more button when hasNextPage is true', async () => {
      mockState.hasNextPage = true
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 10, total_pages: 2 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('loadMore')).toBeTruthy()
      })
    })

    it('does not show load more button when hasNextPage is false', async () => {
      mockState.hasNextPage = false
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.queryByText('loadMore')).toBeNull()
      })
    })

    it('calls fetchNextPage when load more clicked', async () => {
      const user = userEvent.setup()
      mockState.hasNextPage = true
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 10, total_pages: 2 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('loadMore')).toBeTruthy()
      })

      const loadMoreButton = screen.getByText('loadMore')
      await user.click(loadMoreButton)

      expect(mockFetchNextPage).toHaveBeenCalled()
    })

    it('shows loading text when fetching next page', async () => {
      mockState.hasNextPage = true
      mockState.isFetchingNextPage = true
      mockState.questionsData = {
        data: {
          data: {
            questions: [
              {
                _id: 'q1',
                question: 'Test question',
                user: {
                  _id: 'u1',
                  name: 'John Doe',
                  avatar: null,
                },
                likes_count: 0,
                is_liked: false,
                answers: [],
                createdAt: '2026-03-18T10:00:00Z',
              },
            ],
            pagination: { page: 1, limit: 5, total: 10, total_pages: 2 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('loading')).toBeTruthy()
      })
    })
  })

  describe('className prop', () => {
    it('passes through className prop', async () => {
      mockState.isLoading = false

      const { container } = renderComponent({ className: 'custom-class' })

      await waitFor(() => {
        const mainDiv = container.querySelector('.custom-class')
        expect(mainDiv).toBeTruthy()
      })
    })

    it('applies default className when not provided', async () => {
      mockState.isLoading = false

      const { container } = renderComponent()

      await waitFor(() => {
        const mainDiv = container.querySelector('.rounded-sm.bg-white')
        expect(mainDiv).toBeTruthy()
      })
    })
  })
})

describe('ProductQA – extended', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockState.isAuthenticated = false
    mockState.isLoading = false
    mockState.hasNextPage = false
    mockState.isFetchingNextPage = false
    mockState.questionsData = {
      data: {
        data: {
          questions: [],
          pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
        },
      },
    }

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductQA productId="test-product-id" {...props} />
      </QueryClientProvider>,
    )
  }

  const singleQuestion = {
    _id: 'q1',
    question: 'Is this product good?',
    user: { _id: 'u1', name: 'John Doe', avatar: null },
    likes_count: 5,
    is_liked: false,
    answers: [],
    createdAt: '2026-03-18T10:00:00Z',
  }

  const singleQuestionWithAnswer = {
    _id: 'q1',
    question: 'Is this product good?',
    user: { _id: 'u1', name: 'John Doe', avatar: null },
    likes_count: 5,
    is_liked: false,
    answers: [
      {
        _id: 'a1',
        answer: 'Yes, great product!',
        user: { _id: 'u2', name: 'Seller', avatar: null, is_seller: false },
        likes_count: 2,
        is_liked: false,
        createdAt: '2026-03-18T11:00:00Z',
      },
    ],
    createdAt: '2026-03-18T10:00:00Z',
  }

  describe('Like when unauthenticated', () => {
    it('like question when unauthenticated calls toast.warning', async () => {
      const user = userEvent.setup()
      mockState.isAuthenticated = false
      mockState.questionsData = {
        data: {
          data: {
            questions: [singleQuestion],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Is this product good?')).toBeTruthy()
      })

      // Like question button has aria-label t('likeQuestionAria') → "likeQuestionAria"
      const likeBtn = screen.getByRole('button', { name: 'likeQuestionAria' })
      await user.click(likeBtn)

      expect(mockToastWarning).toHaveBeenCalledTimes(1)
    })

    it('like answer when unauthenticated calls toast.warning', async () => {
      const user = userEvent.setup()
      mockState.isAuthenticated = false
      mockState.questionsData = {
        data: {
          data: {
            questions: [singleQuestionWithAnswer],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Yes, great product!')).toBeTruthy()
      })

      // Like answer button has aria-label t('likeAnswerAria') → "likeAnswerAria"
      const likeAnswerBtn = screen.getByRole('button', { name: 'likeAnswerAria' })
      await user.click(likeAnswerBtn)

      expect(mockToastWarning).toHaveBeenCalledTimes(1)
    })
  })

  describe('Ask question with empty text', () => {
    it('does not call mutation when question text is empty', async () => {
      const user = userEvent.setup()
      mockState.isAuthenticated = true

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('submitQuestion')).toBeTruthy()
      })

      const submitBtn = screen.getByText('submitQuestion') as HTMLButtonElement
      // Button should be disabled when textarea is empty
      expect(submitBtn.disabled).toBe(true)

      // Attempt to click the disabled button — mutation should NOT fire
      await user.click(submitBtn)

      // toast.success is only called on mutation success; it should not have been called
      expect(mockToastSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Cancel reply button', () => {
    it('hides the reply form when cancel is clicked', async () => {
      const user = userEvent.setup()
      mockState.isAuthenticated = true
      mockState.questionsData = {
        data: {
          data: {
            questions: [singleQuestion],
            pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
          },
        },
      }

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Reply (0)')).toBeTruthy()
      })

      // Open the reply form
      const replyBtn = screen.getByText('Reply (0)')
      await user.click(replyBtn)

      await waitFor(() => {
        expect(document.querySelector('#reply-form-q1')).toBeTruthy()
      })

      // Click cancel (cancelReply key → "cancelReply" from t mock)
      const cancelBtn = screen.getByText('cancelReply')
      await user.click(cancelBtn)

      await waitFor(() => {
        expect(document.querySelector('#reply-form-q1')).toBeNull()
      })
    })
  })

  describe('Sort dropdown', () => {
    it('renders sort dropdown with correct options', async () => {
      renderComponent()

      await waitFor(() => {
        const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select')
        expect(sortSelect).toBeTruthy()
      })

      const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select')!
      const options = Array.from(sortSelect.options).map((o) => o.value)
      expect(options).toContain('newest')
      expect(options).toContain('most_liked')
      expect(options).toContain('most_answered')
    })

    it('sort dropdown defaults to "newest"', async () => {
      renderComponent()

      await waitFor(() => {
        const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select')
        expect(sortSelect).toBeTruthy()
      })

      const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select')!
      expect(sortSelect.value).toBe('newest')
    })
  })
})
