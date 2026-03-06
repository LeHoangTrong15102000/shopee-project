import { UserTypingPayload } from 'src/types/socket.types'

interface TypingIndicatorProps {
  typingUsers: UserTypingPayload[]
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].user_name} đang nhập`
    }
    const names = typingUsers.map((user) => user.user_name).join(', ')
    return `${names} đang nhập`
  }

  return (
    <div className='flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400'>
      <span>{getTypingText()}</span>
      <span className='flex gap-0.5'>
        <span
          className='h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <span
          className='h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
          style={{ animationDelay: '200ms', animationDuration: '1s' }}
        />
        <span
          className='h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
          style={{ animationDelay: '400ms', animationDuration: '1s' }}
        />
      </span>
    </div>
  )
}
