import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import shopChatApi, { ShopConversation } from 'src/apis/shopChat.api'
import SEO from 'src/components/SEO'
import ChatWindow from 'src/components/Chat/ChatWindow'

const ConversationHistory = () => {
  const [selectedConversation, setSelectedConversation] = useState<ShopConversation | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['shopConversations'],
    queryFn: () => shopChatApi.getConversations(),
  })

  const conversations: ShopConversation[] = data?.data?.data?.conversations ?? []

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      } else if (diffDays === 1) {
        return 'Yesterday'
      } else if (diffDays < 7) {
        return `${diffDays} days ago`
      } else {
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }
    } catch {
      return ''
    }
  }

  return (
    <div className='rounded-sm bg-white px-4 pb-10 shadow md:px-7 md:pb-20 dark:bg-slate-800'>
      <SEO title='Shop Conversations' description='Your conversations with shops' />
      <div className='border-b border-b-gray-200 py-6 dark:border-b-slate-700'>
        <h1 className='text-lg font-medium capitalize text-gray-900 dark:text-gray-100'>
          Chat with Shops
        </h1>
        <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
          Your conversation history with shops
        </div>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center py-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-[#ee4d2d] border-t-transparent' />
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='mb-4 h-16 w-16 text-gray-300 dark:text-gray-600'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155'
            />
          </svg>
          <p className='text-gray-500 dark:text-gray-400'>No conversations yet</p>
          <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
            Start a conversation from a shop profile or product page
          </p>
        </div>
      )}

      {!isLoading && conversations.length > 0 && (
        <ul className='divide-y divide-gray-100 dark:divide-slate-700'>
          {conversations.map((conv) => (
            <li key={conv._id}>
              <button
                type='button'
                onClick={() => setSelectedConversation(conv)}
                className='flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50'
              >
                {/* Shop avatar */}
                <div className='h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-slate-600 dark:bg-slate-700'>
                  {conv.shopAvatar ? (
                    <img
                      src={conv.shopAvatar}
                      alt={conv.shopName}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center'>
                      <svg
                        className='h-6 w-6 text-gray-400 dark:text-gray-500'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Conv info */}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between'>
                    <h3 className='truncate font-medium text-gray-900 dark:text-gray-100'>
                      {conv.shopName}
                    </h3>
                    <span className='ml-2 shrink-0 text-xs text-gray-400 dark:text-gray-500'>
                      {formatDate(conv.lastMessageAt ?? conv.updatedAt)}
                    </span>
                  </div>
                  {conv.lastMessage ? (
                    <p className='mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400'>
                      {conv.lastMessage}
                    </p>
                  ) : (
                    <p className='mt-0.5 truncate text-sm italic text-gray-400 dark:text-gray-500'>
                      No messages yet
                    </p>
                  )}
                </div>

                {/* Arrow indicator */}
                <svg
                  className='h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ChatWindow overlay when conversation selected */}
      {selectedConversation && (
        <div className='fixed bottom-4 right-4 z-50'>
          <ChatWindow
            conversationId={selectedConversation._id}
            sellerName={selectedConversation.shopName}
          />
          <button
            type='button'
            onClick={() => setSelectedConversation(null)}
            className='mt-2 w-full rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300'
          >
            Close chat
          </button>
        </div>
      )}
    </div>
  )
}

export default ConversationHistory
