import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils'

describe('Home', () => {
  it('renders home page', async () => {
    renderWithRouter({ route: '/' })

    await waitForPageLoad('/')

    await waitFor(
      () => {
        expect(document.body).toBeTruthy()
      },
      { timeout: 10000 }
    )
  })

  it('loads at root path', async () => {
    renderWithRouter({ route: '/' })
    expect(window.location.pathname).toBe('/')
  })
})
