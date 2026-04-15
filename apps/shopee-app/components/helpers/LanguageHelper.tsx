import { useEffect } from 'react'
import { changeLanguage } from '@/config/i18n'
import { useAppStore } from '@/store/appStore'

export const LanguageHelper = () => {
  const language = useAppStore((state) => state.language)

  useEffect(() => {
    changeLanguage(language).then(() => {
      console.log('Changed to', language)
    })
  }, [language])

  return <></>
}
