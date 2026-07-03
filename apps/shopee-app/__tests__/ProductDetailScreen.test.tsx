import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import ProductDetailScreen from '../components/product-detail/ProductDetailScreen'

const API_BASE = 'https://api-ecom.lehoangtrong.com'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}))

const mockToast = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
}
jest.mock('@/components/ui/ToastProvider', () => ({
  useToast: () => mockToast,
}))

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    foreground: '#fff',
    warning: '#f4c790',
    neutrals400: '#6e6e6e',
    neutrals700: '#3a3a3a',
    neutrals800: '#2a2a2a',
    background: '#000',
  }),
}))

const mockRouter = { back: jest.fn(), push: jest.fn() }
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native')
  const R = require('react')
  return {
    BottomSheetModal: R.forwardRef((_: Record<string, unknown>, ref: React.Ref<unknown>) => {
      R.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: jest.fn() }))
      return null
    }),
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
  }
})

// Mock heavy child components to isolate screen logic
jest.mock('../components/product-detail/ImageGallery', () => {
  const { Text } = require('react-native')
  return ({ images }: { images: unknown[] }) => <Text>ImageGallery:{images?.length}</Text>
})
jest.mock('../components/product-detail/ProductInfo', () => {
  const { Text } = require('react-native')
  return ({ product }: { product: { name: string } }) => <Text>{product.name}</Text>
})
jest.mock('../components/product-detail/ProductDescription', () => {
  const { Text } = require('react-native')
  return () => <Text>Description</Text>
})
jest.mock('../components/product-detail/ProductDetailSkeleton', () => {
  const { Text } = require('react-native')
  return () => <Text>Loading...</Text>
})
jest.mock('../components/product-detail/ReviewSection', () => {
  const { Text } = require('react-native')
  return () => <Text>Reviews</Text>
})
jest.mock('../components/product-detail/QASection', () => {
  const { Text } = require('react-native')
  return () => <Text>QA</Text>
})
jest.mock('../components/product-detail/RelatedProducts', () => {
  const { Text } = require('react-native')
  return () => <Text>Related</Text>
})
jest.mock('../components/product-detail/StickyBottomBar', () => {
  const { Text } = require('react-native')
  return () => <Text>BottomBar</Text>
})
jest.mock('../components/product-detail/QuantitySelector', () => {
  const { Text } = require('react-native')
  return () => <Text>QuantitySelector</Text>
})
jest.mock('../components/product-detail/WishlistButton', () => {
  const { Text } = require('react-native')
  return () => <Text>WishlistButton</Text>
})
jest.mock('../components/product-detail/ReviewForm', () => {
  const R = require('react')
  return R.forwardRef(() => null)
})
jest.mock('../components/product-detail/QuestionForm', () => {
  const R = require('react')
  return R.forwardRef(() => null)
})

const mockProduct = {
  _id: 'p1',
  name: 'Test Product',
  image: 'img.jpg',
  images: ['img1.jpg', 'img2.jpg'],
  description: '<p>A test product</p>',
  category: { _id: 'cat-1', name: 'Category' },
  price: 100000,
  rating: 4.5,
  price_before_discount: 150000,
  quantity: 50,
  sold: 200,
  view: 1000,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockProductOutOfStock = {
  ...mockProduct,
  _id: 'p2',
  quantity: 0,
}

const mockProductSingleImage = {
  ...mockProduct,
  _id: 'p3',
  images: [],
}

const server = setupServer(
  http.get(`${API_BASE}/products/:id`, () =>
    HttpResponse.json({ message: 'OK', data: mockProduct })
  ),
  http.get(`${API_BASE}/reviews/product/:id`, () =>
    HttpResponse.json({
      message: 'OK',
      data: {
        reviews: [],
        pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
        stats: { total_reviews: 0, average_rating: 0, rating_breakdown: {} },
      },
    })
  ),
  http.get(`${API_BASE}/qa/questions`, () =>
    HttpResponse.json({
      message: 'OK',
      data: { questions: [], pagination: { page: 1, limit: 5, total: 0, total_pages: 0 } },
    })
  ),
  http.get(`${API_BASE}/wishlist/check/:id`, () =>
    HttpResponse.json({ message: 'OK', data: { in_wishlist: false } })
  ),
  http.get(`${API_BASE}/products`, () =>
    HttpResponse.json({
      message: 'OK',
      data: { products: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } },
    })
  )
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
})
afterAll(() => server.close())

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ProductDetailScreen', () => {
  it('shows skeleton while loading', () => {
    server.use(http.get(`${API_BASE}/products/:id`, () => new Promise(() => undefined)))
    const { getByText } = renderWithProviders(<ProductDetailScreen productId="p1" />)
    expect(getByText('Loading...')).toBeTruthy()
  })

  it('shows error state on server error', async () => {
    server.use(http.get(`${API_BASE}/products/:id`, () => new HttpResponse(null, { status: 500 })))
    const { findByText } = renderWithProviders(<ProductDetailScreen productId="p1" />)
    expect(await findByText('PD_SERVER_ERROR')).toBeTruthy()
  })

  it('renders product name on success', async () => {
    const { findByText } = renderWithProviders(<ProductDetailScreen productId="p1" />)
    expect(await findByText('Test Product')).toBeTruthy()
  })

  it('shows 404 toast and navigates back', async () => {
    server.use(http.get(`${API_BASE}/products/:id`, () => new HttpResponse(null, { status: 404 })))
    renderWithProviders(<ProductDetailScreen productId="p1" />)
    await waitFor(() => {
      expect(mockToast.showError).toHaveBeenCalledWith('PD_PRODUCT_NOT_FOUND')
    })
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('shows out-of-stock message when quantity is 0', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () =>
        HttpResponse.json({ message: 'OK', data: mockProductOutOfStock })
      )
    )
    const { findByText } = renderWithProviders(<ProductDetailScreen productId="p2" />)
    expect(await findByText('PD_OUT_OF_STOCK')).toBeTruthy()
  })

  it('renders single image when images array is empty', async () => {
    server.use(
      http.get(`${API_BASE}/products/:id`, () =>
        HttpResponse.json({ message: 'OK', data: mockProductSingleImage })
      )
    )
    const { findByText } = renderWithProviders(<ProductDetailScreen productId="p3" />)
    expect(await findByText('ImageGallery:1')).toBeTruthy()
  })
})
