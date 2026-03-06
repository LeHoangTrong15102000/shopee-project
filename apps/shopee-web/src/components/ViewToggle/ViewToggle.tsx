import classNames from 'classnames'
import Button from 'src/components/Button'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
  className?: string
}

const ViewToggle = ({ viewMode, onViewChange, className }: ViewToggleProps) => {
  const handleGridClick = () => {
    onViewChange('grid')
  }

  const handleListClick = () => {
    onViewChange('list')
  }

  return (
    <div className={classNames('flex items-center gap-1 overflow-hidden rounded-lg', className)}>
      {/* Grid View Button */}
      <Button
        variant='ghost'
        animated={false}
        type='button'
        onClick={handleGridClick}
        className={classNames('p-2 transition-all duration-100 active:scale-95', {
          'bg-orange text-white': viewMode === 'grid',
          'border border-gray-200 bg-white text-gray-500 hover:text-gray-700 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-400 dark:hover:text-gray-300':
            viewMode !== 'grid'
        })}
        aria-label='Xem dạng lưới'
        aria-pressed={viewMode === 'grid'}
        title='Xem dạng lưới'
      >
        {/* Grid Icon - 4 squares in 2x2 */}
        <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 16 16' aria-hidden='true'>
          <rect x='1' y='1' width='6' height='6' rx='1' />
          <rect x='9' y='1' width='6' height='6' rx='1' />
          <rect x='1' y='9' width='6' height='6' rx='1' />
          <rect x='9' y='9' width='6' height='6' rx='1' />
        </svg>
      </Button>

      {/* List View Button */}
      <Button
        variant='ghost'
        animated={false}
        type='button'
        onClick={handleListClick}
        className={classNames('p-2 transition-all duration-100 active:scale-95', {
          'bg-orange text-white': viewMode === 'list',
          'border border-gray-200 bg-white text-gray-500 hover:text-gray-700 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-400 dark:hover:text-gray-300':
            viewMode !== 'list'
        })}
        aria-label='Xem dạng danh sách'
        aria-pressed={viewMode === 'list'}
        title='Xem dạng danh sách'
      >
        {/* List Icon - 3 horizontal lines */}
        <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 16 16' aria-hidden='true'>
          <rect x='1' y='2' width='14' height='2.5' rx='1' />
          <rect x='1' y='6.75' width='14' height='2.5' rx='1' />
          <rect x='1' y='11.5' width='14' height='2.5' rx='1' />
        </svg>
      </Button>
    </div>
  )
}

export default ViewToggle
