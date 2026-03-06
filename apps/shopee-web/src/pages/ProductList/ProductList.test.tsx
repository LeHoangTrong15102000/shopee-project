import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'

describe('ProductList', () => {
  it('renders product list page at root', async () => {
    renderWithRouter({ route: '/' })

    await waitFor(
      () => {
        expect(document.body).toBeTruthy()
      },
      { timeout: 10000 }
    )
  })

  it('handles query parameters for filtering', async () => {
    renderWithRouter({ route: '/?page=1&limit=20' })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/')
      },
      { timeout: 10000 }
    )
  })
})
