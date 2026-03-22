import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  useProductDetailQuery,
  useProductReviews,
  useProductQuestions,
  useWishlistStatus,
  useRelatedProducts,
  useToggleWishlist,
  useAddToCart,
  useBuyNow,
  useCreateReview,
  useToggleReviewLike,
  useAskQuestion,
  useAnswerQuestion,
  useLikeQuestion,
} from '../hooks/useProductDetail';

const API_BASE = 'https://api-ecom.duthanhduoc.com';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockToast = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
};
jest.mock('@/components/ui/ToastProvider', () => ({
  useToast: () => mockToast,
}));

const mockProduct = {
  _id: 'p1',
  name: 'Test Product',
  image: 'img.jpg',
  images: ['img1.jpg'],
  description: 'Desc',
  category: { _id: 'cat-1', name: 'Cat' },
  price: 100000,
  rating: 4.5,
  price_before_discount: 150000,
  quantity: 50,
  sold: 200,
  view: 1000,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const server = setupServer(
  http.get(`${API_BASE}/products/:id`, () =>
    HttpResponse.json({ message: 'OK', data: mockProduct })
  ),
  http.get(`${API_BASE}/reviews/product/:id`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        reviews: [
          {
            _id: 'r1',
            rating: 5,
            comment: 'Great',
            user: { _id: 'u1', name: 'U' },
            helpful_count: 0,
            is_liked: false,
          },
        ],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
        stats: { total_reviews: 1, average_rating: 5, rating_breakdown: { 5: 1 } },
      },
    })
  ),
  http.get(`${API_BASE}/qa/questions`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        questions: [{ _id: 'q1', question: 'Q?', answers: [], likes_count: 0, is_liked: false }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      },
    })
  ),
  http.get(`${API_BASE}/wishlist/check/:id`, () =>
    HttpResponse.json({ message: 'OK', data: { in_wishlist: false } })
  ),
  http.post(`${API_BASE}/wishlist`, () => HttpResponse.json({ message: 'OK', data: {} })),
  http.delete(`${API_BASE}/wishlist/:id`, () => HttpResponse.json({ message: 'OK', data: {} })),
  http.post(`${API_BASE}/purchases/add-to-cart`, () =>
    HttpResponse.json({ message: 'OK', data: {} })
  ),
  http.post(`${API_BASE}/reviews`, () => HttpResponse.json({ message: 'OK', data: { _id: 'r2' } })),
  http.post(`${API_BASE}/qa/questions`, () =>
    HttpResponse.json({ message: 'OK', data: { _id: 'q2' } })
  ),
  http.post(`${API_BASE}/purchases/buy-products`, () =>
    HttpResponse.json({ message: 'OK', data: {} })
  ),
  http.post(`${API_BASE}/reviews/like/:id`, () =>
    HttpResponse.json({ message: 'OK', data: { is_liked: true, helpful_count: 1 } })
  ),
  http.post(`${API_BASE}/qa/questions/:id/answers`, () =>
    HttpResponse.json({ message: 'OK', data: { _id: 'a1', answer: 'Yes', is_seller: false } })
  ),
  http.post(`${API_BASE}/qa/questions/:id/like`, () =>
    HttpResponse.json({ message: 'OK', data: { is_liked: true, likes_count: 1 } })
  ),
  http.get(`${API_BASE}/products`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        products: [{ ...mockProduct, _id: 'p2', name: 'Related Product' }],
        pagination: { page: 1, limit: 10, page_size: 10 },
      },
    })
  )
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockToast.showSuccess.mockClear();
  mockToast.showError.mockClear();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useProductDetailQuery', () => {
  it('returns loading then product data', async () => {
    const { result } = renderHook(() => useProductDetailQuery('p1'), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data._id).toBe('p1');
  });

  it('is disabled when productId is empty', () => {
    const { result } = renderHook(() => useProductDetailQuery(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useProductReviews', () => {
  it('returns paginated reviews', async () => {
    const { result } = renderHook(() => useProductReviews('p1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].data.reviews).toHaveLength(1);
  });
});

describe('useProductQuestions', () => {
  it('returns paginated questions', async () => {
    const { result } = renderHook(() => useProductQuestions('p1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].data.questions).toHaveLength(1);
  });
});

describe('useWishlistStatus', () => {
  it('returns wishlist status', async () => {
    const { result } = renderHook(() => useWishlistStatus('p1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.in_wishlist).toBe(false);
  });
});

describe('useToggleWishlist', () => {
  it('shows success toast on toggle', async () => {
    const wrapper = createWrapper();
    const { result: wishlistResult } = renderHook(() => useWishlistStatus('p1'), { wrapper });
    await waitFor(() => expect(wishlistResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useToggleWishlist('p1'), { wrapper });
    await act(async () => {
      result.current.mutate(false);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToast.showSuccess).toHaveBeenCalledWith('PD_WISHLIST_ADDED');
  });
});

describe('useAddToCart', () => {
  it('shows success toast on add', async () => {
    const { result } = renderHook(() => useAddToCart(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ product_id: 'p1', buy_count: 2 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToast.showSuccess).toHaveBeenCalledWith('PD_ADD_TO_CART_SUCCESS');
  });
});

describe('useCreateReview', () => {
  it('shows success toast on review creation', async () => {
    const { result } = renderHook(() => useCreateReview('p1'), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ purchase_id: 'pur1', rating: 5, comment: 'Great product!' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToast.showSuccess).toHaveBeenCalledWith('PD_REVIEW_SUCCESS');
  });
});

describe('useAskQuestion', () => {
  it('shows success toast on question submission', async () => {
    const { result } = renderHook(() => useAskQuestion('p1'), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ product_id: 'p1', question: 'Is this good?' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToast.showSuccess).toHaveBeenCalledWith('PD_QUESTION_SUCCESS');
  });
});

describe('useRelatedProducts', () => {
  it('returns related products when categoryId is provided', async () => {
    const { result } = renderHook(() => useRelatedProducts('cat-1', 'p1'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.products).toHaveLength(1);
    expect(result.current.data?.data.products[0].name).toBe('Related Product');
  });

  it('is disabled when categoryId is undefined', () => {
    const { result } = renderHook(() => useRelatedProducts(undefined, 'p1'), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useBuyNow', () => {
  it('calls buyNow API successfully', async () => {
    const { result } = renderHook(() => useBuyNow(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ product_id: 'p1', buy_count: 1 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('shows error toast on failure', async () => {
    server.use(
      http.post(`${API_BASE}/purchases/buy-products`, () =>
        HttpResponse.json({ message: 'Error' }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useBuyNow(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ product_id: 'p1', buy_count: 1 });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToast.showError).toHaveBeenCalledWith('PD_BUY_NOW_ERROR');
  });
});

describe('useToggleReviewLike', () => {
  it('optimistically toggles review like', async () => {
    const wrapper = createWrapper();
    const { result: reviewsResult } = renderHook(() => useProductReviews('p1'), { wrapper });
    await waitFor(() => expect(reviewsResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useToggleReviewLike('p1'), { wrapper });
    await act(async () => {
      result.current.mutate('r1');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useAnswerQuestion', () => {
  it('shows success toast on answer submission', async () => {
    const { result } = renderHook(() => useAnswerQuestion('p1'), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ questionId: 'q1', answer: 'Yes it is!' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockToast.showSuccess).toHaveBeenCalledWith('PD_ANSWER_SUCCESS');
  });
});

describe('useLikeQuestion', () => {
  it('optimistically toggles question like', async () => {
    const wrapper = createWrapper();
    const { result: questionsResult } = renderHook(() => useProductQuestions('p1'), { wrapper });
    await waitFor(() => expect(questionsResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useLikeQuestion('p1'), { wrapper });
    await act(async () => {
      result.current.mutate('q1');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useToggleWishlist - optimistic rollback', () => {
  it('rolls back optimistic update on error', async () => {
    server.use(
      http.post(`${API_BASE}/wishlist`, () =>
        HttpResponse.json({ message: 'Error' }, { status: 500 })
      )
    );
    const wrapper = createWrapper();
    const { result: wishlistResult } = renderHook(() => useWishlistStatus('p1'), { wrapper });
    await waitFor(() => expect(wishlistResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useToggleWishlist('p1'), { wrapper });
    await act(async () => {
      result.current.mutate(false);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToast.showError).toHaveBeenCalledWith('PD_WISHLIST_ERROR');
  });
});

describe('useProductReviews - pagination', () => {
  it('fetches next page when hasNextPage is true', async () => {
    server.use(
      http.get(`${API_BASE}/reviews/product/:id`, ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page');
        if (page === '2') {
          return HttpResponse.json({
            message: 'OK',
            data: {
              reviews: [{ _id: 'r2', rating: 4, comment: 'Good', user: { _id: 'u2', name: 'U2' } }],
              pagination: { page: 2, limit: 5, total: 2, total_pages: 2 },
              stats: { total_reviews: 2, average_rating: 4.5, rating_breakdown: { 4: 1, 5: 1 } },
            },
          });
        }
        return HttpResponse.json({
          message: 'OK',
          data: {
            reviews: [{ _id: 'r1', rating: 5, comment: 'Great', user: { _id: 'u1', name: 'U' } }],
            pagination: { page: 1, limit: 5, total: 2, total_pages: 2 },
            stats: { total_reviews: 2, average_rating: 4.5, rating_breakdown: { 4: 1, 5: 1 } },
          },
        });
      })
    );
    const { result } = renderHook(() => useProductReviews('p1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages[1].data.reviews[0]._id).toBe('r2');
  });
});

describe('useProductQuestions - pagination', () => {
  it('fetches next page when hasNextPage is true', async () => {
    server.use(
      http.get(`${API_BASE}/qa/questions`, ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page');
        if (page === '2') {
          return HttpResponse.json({
            message: 'OK',
            data: {
              questions: [{ _id: 'q2', question: 'Q2?', answers: [], likes_count: 0 }],
              pagination: { page: 2, limit: 5, total: 2, total_pages: 2 },
            },
          });
        }
        return HttpResponse.json({
          message: 'OK',
          data: {
            questions: [{ _id: 'q1', question: 'Q?', answers: [], likes_count: 0 }],
            pagination: { page: 1, limit: 5, total: 2, total_pages: 2 },
          },
        });
      })
    );
    const { result } = renderHook(() => useProductQuestions('p1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages[1].data.questions[0]._id).toBe('q2');
  });
});

describe('useRelatedProducts - navigation', () => {
  it('returns products that can be navigated to', async () => {
    const { result } = renderHook(() => useRelatedProducts('cat-1', 'p1'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const relatedProduct = result.current.data?.data.products[0];
    expect(relatedProduct?._id).toBe('p2');
    expect(relatedProduct?.name).toBe('Related Product');
  });
});
