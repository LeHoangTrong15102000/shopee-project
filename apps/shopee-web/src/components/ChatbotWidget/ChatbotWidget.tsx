import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import chatbotApi from 'src/apis/chatbot.api'
import { ChatMessage } from 'src/types/chatbot.type'
import Button from 'src/components/Button'

export default function ChatbotWidget() {
  const { t } = useTranslation('chat')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: t('welcome'),
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [t])

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatbotApi.testChatbot({ message }),
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.data.botResponse,
        timestamp: new Date().toISOString()
      }
      setMessages((prev) => [...prev, assistantMessage])
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('error'),
        timestamp: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  })

  const handleSend = () => {
    if (!inputValue.trim() || sendMutation.isPending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }
    setMessages((prev) => [...prev, userMessage])
    const messageToSend = inputValue.trim()
    setInputValue('')
    sendMutation.mutate(messageToSend)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <motion.div
        className='fixed right-3 bottom-4 z-50 hidden sm:right-6 sm:bottom-6 md:flex'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          shape='pill'
          animated={false}
          onClick={() => setIsOpen(!isOpen)}
          className={classNames(
            'flex h-14 w-14 items-center justify-center bg-orange shadow-lg transition-colors hover:bg-[#d73211] focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
            !isOpen && 'animate-[message-shake_2s_ease-in-out_infinite]'
          )}
        >
          <motion.svg
            className='h-6 w-6 text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            animate={{
              rotate: isOpen ? 360 : 0,
              scale: isOpen ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </motion.svg>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='fixed right-3 bottom-24 z-50 hidden h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:right-6 sm:h-[500px] sm:w-[360px] md:flex dark:bg-slate-800'
          >
            <div className='flex items-center justify-between bg-orange px-4 py-3 text-white'>
              <div className='flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20'>
                  <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm font-medium'>{t('title')}</h3>
                  <p className='text-xs text-white/80'>{t('online')}</p>
                </div>
              </div>
              <Button
                shape='pill'
                animated={false}
                onClick={() => setIsOpen(false)}
                className='flex h-8 w-8 items-center justify-center bg-white/20 transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2'
                aria-label={t('close')}
              >
                <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </Button>
            </div>

            <div className='flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4 dark:bg-slate-900'>
              {messages.map((msg) => (
                <div key={msg.id} className={classNames('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={classNames(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'rounded-br-none bg-orange text-white'
                        : 'rounded-bl-none bg-white text-gray-800 shadow-xs dark:bg-slate-700 dark:text-gray-200'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {sendMutation.isPending && (
                <div className='flex justify-start'>
                  <div className='rounded-lg rounded-bl-none bg-white px-4 py-2 shadow-xs dark:bg-slate-700'>
                    <div className='flex gap-1'>
                      <span
                        className='h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className='h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className='h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500'
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className='border-t bg-white p-3 dark:border-slate-700 dark:bg-slate-800'>
              <div className='flex gap-2'>
                <input
                  ref={inputRef}
                  type='text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('placeholder')}
                  className='flex-1 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange focus:outline-hidden dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100'
                  disabled={sendMutation.isPending}
                />
                <Button
                  shape='pill'
                  animated={false}
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sendMutation.isPending}
                  className={classNames(
                    'flex h-10 w-10 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
                    inputValue.trim() && !sendMutation.isPending
                      ? 'bg-orange text-white hover:bg-[#d73211]'
                      : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-slate-600 dark:text-gray-500'
                  )}
                >
                  <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
