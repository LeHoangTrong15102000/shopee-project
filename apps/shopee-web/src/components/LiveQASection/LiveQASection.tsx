import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import Button from 'src/components/Button'

interface LiveQAAnswer {
  question_id: string
  answer: {
    user_name: string
    answer: string
    is_seller: boolean
  }
}

interface LiveQASectionProps {
  newQuestionCount: number
  newAnswers: LiveQAAnswer[]
  onViewQuestions?: () => void
  className?: string
}

export default function LiveQASection({
  newQuestionCount,
  newAnswers,
  onViewQuestions,
  className
}: LiveQASectionProps) {
  const { t } = useTranslation('product')

  if (newQuestionCount <= 0 && newAnswers.length === 0) {
    return null
  }

  return (
    <div
      className={classNames(
        'animate-fade-in rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/20',
        className
      )}
    >
      {newQuestionCount > 0 && (
        <Button
          variant='ghost'
          animated={false}
          className='flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30'
          onClick={onViewQuestions}
        >
          <span className='text-lg'>❓</span>
          <span className='font-medium text-blue-600 dark:text-blue-400'>
            {t('qa.newQuestions', { count: newQuestionCount })}
          </span>
          <span className='ml-auto text-xs text-gray-400 dark:text-gray-500'>{t('qa.clickToView')}</span>
        </Button>
      )}
      {newAnswers.length > 0 && (
        <div className='mt-2 space-y-1'>
          {newAnswers.slice(-3).map((item, index) => (
            <div
              key={`${item.question_id}-${index}`}
              className={classNames('flex items-start gap-2 rounded-sm px-2 py-1 text-xs', {
                'border-l-2 border-[#ee4d2d] bg-[#fff5f0] dark:bg-orange-900/20': item.answer.is_seller,
                'bg-white dark:bg-slate-700': !item.answer.is_seller
              })}
            >
              <span>{item.answer.is_seller ? '🏪' : '💬'}</span>
              <div>
                <span
                  className={classNames('font-medium', {
                    'text-[#ee4d2d]': item.answer.is_seller,
                    'text-gray-700 dark:text-gray-200': !item.answer.is_seller
                  })}
                >
                  {item.answer.user_name}
                  {item.answer.is_seller && ` (${t('qa.seller')})`}
                </span>
                <p className='mt-0.5 line-clamp-2 text-gray-600 dark:text-gray-300'>{item.answer.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
