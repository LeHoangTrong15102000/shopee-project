import { useRef, useEffect } from 'react'
import { MessageReceivedPayload } from 'src/types/socket.types'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: MessageReceivedPayload[]
  isLoading: boolean
  currentUserId?: string
}

export default function MessageList({ messages, isLoading, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-orange dark:border-slate-600' />
          <span className='text-sm text-gray-500 dark:text-gray-400'>Đang tải tin nhắn...</span>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500'>
          <svg className='h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='1.5'
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
          <span className='text-sm'>Chưa có tin nhắn</span>
        </div>
      </div>
    )
  }

  return (
    <div className='flex-1 space-y-3 overflow-y-auto p-4'>
      {messages.map((message) => (
        <MessageItem key={message._id} message={message} isSent={message.sender._id === currentUserId} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
