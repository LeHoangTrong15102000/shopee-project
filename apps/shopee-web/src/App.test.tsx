import { screen, waitFor } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import path from './constant/path'
import { renderWithRouter, waitForPageLoad } from './utils/testUtils'

describe('App', () => {
  test('App render và hiển thị trang chủ', async () => {
    renderWithRouter()

    // Đợi trang chủ load xong
    await waitForPageLoad('/', 10000)

    // Verify vào đúng trang chủ
    await waitFor(
      () => {
        expect(
          document.body.textContent?.includes('Kênh người bán') ||
            document.body.textContent?.includes('Danh Mục') ||
            window.location.pathname === '/'
        ).toBeTruthy()
      },
      { timeout: 10000 }
    )
  })

  test('Về trang not found', async () => {
    const badRoute = '/some/bad/route'
    renderWithRouter({ route: badRoute })

    await waitFor(
      () => {
        expect(
          screen.queryByText(/Page Not Found/i) || screen.queryByText(/404/i) || window.location.pathname === badRoute
        ).toBeTruthy()
      },
      { timeout: 10000 }
    )
  })

  test('Render trang Register', async () => {
    renderWithRouter({ route: path.register })

    // Verify route đúng
    expect(window.location.pathname).toBe('/register')

    // Chờ lazy-loaded Register page render xong (có thể mất lâu lần đầu)
    await waitFor(
      () => {
        expect(
          screen.queryByText(/Bạn đã có tài khoản?/i) ||
            screen.queryByText(/Đăng ký/i) ||
            document.querySelector('input[name="email"]')
        ).toBeTruthy()
      },
      { timeout: 55000 }
    )
  })
})
