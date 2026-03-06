import classNames from 'classnames'
import { format } from 'date-fns'
import { MessageReceivedPayload } from 'src/types/socket.types'

interface MessageItemProps {
  message: MessageReceivedPayload
  isSent: boolean
}

export default function MessageItem({ message, isSent }: MessageItemProps) {
  const formattedTime = format(new Date(message.created_at), 'HH:mm')

  const renderStatusIcon = () => {
    if (!isSent) return null

    switch (message.status) {
      case 'sent':
        return <span className='text-xs text-gray-400'>✓</span>
      case 'delivered':
        return <span className='text-xs text-gray-400'>✓✓</span>
      case 'read':
        return (
          <svg className='h-3.5 w-3.5 text-blue-500' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
            <path
              fillRule='evenodd'
              d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z'
              clipRule='evenodd'
            />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className={classNames('flex', isSent ? 'justify-end' : 'justify-start')}>
      <div className={classNames('flex max-w-[75%] gap-2', isSent ? 'flex-row-reverse' : 'flex-row')}>
        {!isSent && (
          <div className='shrink-0'>
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className='h-8 w-8 rounded-full object-cover'
              />
            ) : (
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-600 dark:bg-slate-600 dark:text-gray-300'>
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className={classNames('flex flex-col', isSent ? 'items-end' : 'items-start')}>
          {!isSent && <span className='mb-1 text-xs text-gray-500 dark:text-gray-400'>{message.sender.name}</span>}

          <div
            className={classNames(
              'rounded-lg px-3 py-2 text-sm',
              isSent
                ? 'rounded-br-sm bg-orange text-white'
                : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-gray-100'
            )}
          >
            {message.content}
          </div>

          <div className='mt-1 flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>{formattedTime}</span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  )
}
