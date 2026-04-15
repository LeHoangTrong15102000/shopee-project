import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/utils/testUtils'
import InputFile from './InputFile'

describe('InputFile', () => {
  it('renders the select image button', () => {
    renderWithProviders(<InputFile />)
    expect(screen.getByRole('button', { name: /chọn ảnh/i })).toBeInTheDocument()
  })

  it('has a hidden file input', () => {
    renderWithProviders(<InputFile />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveClass('hidden')
  })

  it('clicking button triggers file input click', async () => {
    const { user } = renderWithProviders(<InputFile />)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')

    const button = screen.getByRole('button', { name: /chọn ảnh/i })
    await user.click(button)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('accepts only image file types', () => {
    renderWithProviders(<InputFile />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toHaveAttribute('accept', '.jpg,.jpeg,.png')
  })
})
