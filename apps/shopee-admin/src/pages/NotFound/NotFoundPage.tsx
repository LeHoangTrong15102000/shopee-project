import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileQuestion } from 'lucide-react'
import { Button } from 'src/components/ui/button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  return (
    <div role="main" className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <FileQuestion className="mb-4 size-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('notFound.description')}</p>
      <Button onClick={() => navigate('/')} className="mt-6">
        {t('notFound.goToDashboard')}
      </Button>
    </div>
  )
}
