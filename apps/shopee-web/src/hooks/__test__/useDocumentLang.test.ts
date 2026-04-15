import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useDocumentLang from '../useDocumentLang'

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    i18n: { language: 'en' },
  })),
}))

describe('useDocumentLang', () => {
  it('should render without error', () => {
    const { result } = renderHook(() => useDocumentLang())

    expect(result.current).toBeUndefined()
  })

  it('should set document lang attribute', () => {
    renderHook(() => useDocumentLang())

    expect(document.documentElement.lang).toBe('en')
  })
})
