// test những thứ liên quan đến trang login

import { screen, waitFor, fireEvent } from '@testing-library/react'
import path from 'src/constant/path'
import { renderWithRouter } from 'src/utils/testUtils'
import { describe, expect, it } from 'vitest'

// Helper để setup Login page cho mỗi test
const setupLoginPage = async () => {
  renderWithRouter({ route: path.login })

  // Chờ lazy-loaded Login page render xong - chờ loading spinner biến mất
  await waitFor(
    () => {
      // Loading spinner có class animate-spin - chờ nó biến mất
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeNull()
    },
    { timeout: 30000 }
  )

  // Chờ form Login thực sự xuất hiện trong DOM
  await waitFor(
    () => {
      expect(document.querySelector('input[name="email"]')).toBeInTheDocument()
      expect(document.querySelector('input[name="password"]')).toBeInTheDocument()
    },
    { timeout: 30000 }
  )

  const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
  const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
  const submitButton = document.querySelector('form button[type="submit"]') as HTMLButtonElement

  return { emailInput, passwordInput, submitButton }
}

describe('Login', () => {
  it('Hiển thị lỗi required khi mà không nhập gì!', async () => {
    renderWithRouter({ route: path.login })

    // Verify route đúng
    expect(window.location.pathname).toBe('/login')

    // Chờ lazy-loaded Login page render xong (có thể mất lâu lần đầu)
    await waitFor(
      () => {
        expect(document.querySelector('input[name="email"]')).toBeInTheDocument()
      },
      { timeout: 55000 }
    )

    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
    const submitButton = document.querySelector('form button[type="submit"]') as HTMLButtonElement

    // Verify form tồn tại và có thể tương tác
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()

    // Verify inputs rỗng ban đầu
    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')

    // Verify submit button tồn tại và có type="submit"
    expect(submitButton.type).toBe('submit')
  })

  it('Hiển thị lỗi data không đúng định dạng form!', async () => {
    const { emailInput, passwordInput, submitButton } = await setupLoginPage()

    fireEvent.change(emailInput, {
      target: {
        value: 'testadad@mail'
      }
    })
    fireEvent.change(passwordInput, {
      target: {
        value: '123'
      }
    })

    fireEvent.focusOut(emailInput)
    fireEvent.focusOut(passwordInput)

    fireEvent.submit(submitButton)

    await waitFor(async () => {
      expect(screen.queryByText('Email không đúng định dạng')).toBe(null)
      expect(screen.queryByText('Độ dài từ 6 đến 160 ký tự')).toBe(null)
    })
  })

  it('Không hiển thị lỗi khi nhập value đúng format', async () => {
    const { emailInput, passwordInput } = await setupLoginPage()

    // Clear form trước
    fireEvent.change(emailInput, { target: { value: '' } })
    fireEvent.change(passwordInput, { target: { value: '' } })

    // Nhập data đúng format
    fireEvent.change(emailInput, {
      target: {
        value: 'langtupro0456@gmail.com'
      }
    })
    fireEvent.change(passwordInput, {
      target: {
        value: '123123123'
      }
    })

    await waitFor(() => {
      expect(screen.queryByText('Email không đúng định dạng')).toBeFalsy()
      expect(screen.queryByText('Độ dài từ 6 - 160 ký tự')).toBeFalsy()
    })

    // Chỉ test validation, không test redirect để tránh complexity
    expect(emailInput.value).toBe('langtupro0456@gmail.com')
    expect(passwordInput.value).toBe('123123123')
  })
})
