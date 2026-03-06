import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Sets document.documentElement.lang based on the current i18n language.
 * Should be called once in App.tsx.
 */
export default function useDocumentLang() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])
}
