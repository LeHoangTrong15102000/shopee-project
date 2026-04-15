import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CopyButton from '../CopyButton'

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('CopyButton', () => {
  it('renders copy button', () => {
    render(<CopyButton text="123456" label="số tài khoản" />)
    expect(screen.getByTitle('Sao chép số tài khoản')).toBeInTheDocument()
  })

  it('copies text to clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<CopyButton text="123456" label="số tài khoản" />)
    fireEvent.click(screen.getByTitle('Sao chép số tài khoản'))
    expect(writeText).toHaveBeenCalledWith('123456')
  })

  it('renders with different label', () => {
    render(<CopyButton text="SHOPEE123" label="nội dung" />)
    expect(screen.getByTitle('Sao chép nội dung')).toBeInTheDocument()
  })
})
