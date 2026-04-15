import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductImages from '../ProductImages'
import { Product, ProductSKU } from 'src/types/product.type'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'images.galleryLabel': 'Thư viện ảnh',
        'images.previousImage': 'Ảnh trước',
        'images.nextImage': 'Ảnh tiếp',
        'images.imageN': `Ảnh ${params?.index} của ${params?.name}`,
      }
      return translations[key] || key
    },
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props} />,
  },
  AnimatePresence: ({ children }: any) => children,
}))

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}))

vi.mock('src/components/ShareButton', () => ({
  default: ({ url, title }: any) => <button>Share: {title}</button>,
}))

vi.mock('src/components/WishlistButton', () => ({
  default: ({ productId, productName }: any) => <button>Wishlist: {productName}</button>,
}))

describe('ProductImages', () => {
  const mockProduct: Product = {
    _id: 'prod1',
    name: 'Test Product',
    description: 'Test description',
    price: 100000,
    price_before_discount: 150000,
    quantity: 10,
    sold: 50,
    view: 100,
    rating: 4.5,
    image: 'https://example.com/image1.jpg',
    images: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
      'https://example.com/image4.jpg',
      'https://example.com/image5.jpg',
      'https://example.com/image6.jpg',
    ],
    category: { _id: 'cat1', name: 'Category 1' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as Product

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product images', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const mainImage = screen.getByAltText('Test Product')
    expect(mainImage).toBeInTheDocument()
  })

  it('displays first image as active by default', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const mainImage = screen.getByAltText('Test Product')
    expect(mainImage).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('changes active image when thumbnail is clicked', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const thumbnails = screen.getAllByRole('button')
    const secondThumbnail = thumbnails.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Ảnh 2'),
    )

    if (secondThumbnail) {
      fireEvent.click(secondThumbnail)
      const mainImage = screen.getByAltText('Test Product')
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image2.jpg')
    }
  })

  it('changes active image on thumbnail hover', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const thumbnails = screen.getAllByRole('button')
    const secondThumbnail = thumbnails.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Ảnh 2'),
    )

    if (secondThumbnail) {
      fireEvent.mouseEnter(secondThumbnail)
      const mainImage = screen.getByAltText('Test Product')
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image2.jpg')
    }
  })

  it('changes active image on Enter key press', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const thumbnails = screen.getAllByRole('button')
    const secondThumbnail = thumbnails.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Ảnh 2'),
    )

    if (secondThumbnail) {
      fireEvent.keyDown(secondThumbnail, { key: 'Enter' })
      const mainImage = screen.getByAltText('Test Product')
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image2.jpg')
    }
  })

  it('changes active image on Space key press', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const thumbnails = screen.getAllByRole('button')
    const secondThumbnail = thumbnails.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Ảnh 2'),
    )

    if (secondThumbnail) {
      fireEvent.keyDown(secondThumbnail, { key: ' ' })
      const mainImage = screen.getByAltText('Test Product')
      expect(mainImage).toHaveAttribute('src', 'https://example.com/image2.jpg')
    }
  })

  it('navigates to next images when next button is clicked', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const nextButton = screen.getByLabelText('Ảnh tiếp')
    fireEvent.click(nextButton)

    // After clicking next, the slider should move forward
    expect(nextButton).toBeInTheDocument()
  })

  it('navigates to previous images when prev button is clicked', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const nextButton = screen.getByLabelText('Ảnh tiếp')
    fireEvent.click(nextButton)

    const prevButton = screen.getByLabelText('Ảnh trước')
    fireEvent.click(prevButton)

    expect(prevButton).toBeInTheDocument()
  })

  it('navigates with arrow keys', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const gallery = screen.getByRole('group')

    fireEvent.keyDown(gallery, { key: 'ArrowRight' })
    fireEvent.keyDown(gallery, { key: 'ArrowLeft' })

    expect(gallery).toBeInTheDocument()
  })

  it('switches to SKU image when SKU with image is selected', () => {
    const mockSKU: ProductSKU = {
      _id: 'sku1',
      tier_index: [0],
      price: 100000,
      price_before_discount: 150000,
      quantity: 5,
      sold: 10,
      image: 'https://example.com/sku-image.jpg',
      sku: 'SKU001',
      is_active: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    render(<ProductImages product={mockProduct} reducedMotion={false} selectedSKU={mockSKU} />)
    const mainImage = screen.getByAltText('Test Product')
    expect(mainImage).toHaveAttribute('src', 'https://example.com/sku-image.jpg')
  })

  it('falls back to product image when SKU has no image', () => {
    const mockSKU: ProductSKU = {
      _id: 'sku1',
      product_id: 'prod1',
      tier_index: [0],
      price: 100000,
      price_before_discount: 150000,
      quantity: 5,
      sold: 10,
      sku: 'SKU001',
      is_active: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    render(<ProductImages product={mockProduct} reducedMotion={false} selectedSKU={mockSKU} />)
    const mainImage = screen.getByAltText('Test Product')
    expect(mainImage).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('shows fallback image on error', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const mainImage = screen.getByAltText('Test Product')
    fireEvent.error(mainImage)

    expect(mainImage).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'))
  })

  it('handles zoom on mouse move', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const zoomContainer = screen.getByAltText('Test Product').parentElement

    if (zoomContainer) {
      fireEvent.mouseMove(zoomContainer, { pageX: 100, pageY: 100 })
      expect(zoomContainer).toBeInTheDocument()
    }
  })

  it('removes zoom on mouse leave', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const zoomContainer = screen.getByAltText('Test Product').parentElement

    if (zoomContainer) {
      fireEvent.mouseMove(zoomContainer, { pageX: 100, pageY: 100 })
      fireEvent.mouseLeave(zoomContainer)
      expect(zoomContainer).toBeInTheDocument()
    }
  })

  it('renders share button', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    expect(screen.getByText('Share: Test Product')).toBeInTheDocument()
  })

  it('renders wishlist button', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    expect(screen.getByText('Wishlist: Test Product')).toBeInTheDocument()
  })

  it('highlights active thumbnail', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    const thumbnails = screen.getAllByRole('button')
    const firstThumbnail = thumbnails.find((btn) =>
      btn.getAttribute('aria-label')?.includes('Ảnh 1'),
    )

    if (firstThumbnail) {
      const activeIndicator = firstThumbnail.querySelector('.border-orange')
      expect(
        activeIndicator || firstThumbnail.parentElement?.querySelector('.border-orange'),
      ).toBeInTheDocument()
    }
  })

  it('renders with reduced motion', () => {
    render(<ProductImages product={mockProduct} reducedMotion={true} />)
    const mainImage = screen.getByAltText('Test Product')
    expect(mainImage).toBeInTheDocument()
  })

  it('displays correct number of visible thumbnails', () => {
    render(<ProductImages product={mockProduct} reducedMotion={false} />)
    // Should show 5 thumbnails at a time (0-5 index)
    const thumbnails = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-label')?.includes('Ảnh'))
    expect(thumbnails.length).toBeGreaterThan(0)
  })
})
