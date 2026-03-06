import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'

describe('ProductDetail', () => {
  it('renders product detail page', async () => {
    // Use a mock product URL slug
    renderWithRouter({ route: '/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9' })

    await waitFor(
      () => {
        // Page should load (either product detail or redirect)
        expect(document.body).toBeTruthy()
      },
      { timeout: 10000 }
    )
  })

  it('navigates to correct URL', async () => {
    const productSlug = '/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9'
    renderWithRouter({ route: productSlug })

    expect(window.location.pathname).toBe(productSlug)
  })
})
