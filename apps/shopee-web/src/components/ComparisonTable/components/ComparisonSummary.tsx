import classNames from 'classnames'

interface ComparisonSummaryProps {
  comparisonSummary: { text: string; productName: string; color: string }[] | null
}

export default function ComparisonSummary({ comparisonSummary }: ComparisonSummaryProps) {
  if (!comparisonSummary || comparisonSummary.length === 0) {
    return null
  }

  return (
    <div className='mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/20'>
      <span className='font-medium text-gray-700 dark:text-gray-200'>Tóm tắt so sánh: </span>
      {comparisonSummary.map((item, index) => (
        <span key={index}>
          <span className={classNames('font-medium', item.color)}>{item.productName}</span>
          <span className='text-gray-600 dark:text-gray-300'> {item.text}</span>
          {index < comparisonSummary.length - 1 && <span className='text-gray-400 dark:text-gray-500'>, </span>}
        </span>
      ))}
    </div>
  )
}
