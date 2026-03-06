import { useState, useCallback, useEffect, useRef } from 'react'
import useSocket from './useSocket'
import { SocketEvent, UserTypingPayload } from 'src/types/socket.types'

const TYPING_TIMEOUT = 3000

const useTypingIndicator = (chatId: string | null) => {
  const { socket, emit } = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<string, UserTypingPayload>>(new Map())
  const typingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const isTypingRef = useRef(false)

  const startTyping = useCallback(() => {
    if (!chatId || isTypingRef.current) return
    isTypingRef.current = true
    emit(SocketEvent.TYPING_START, { chat_id: chatId })
  }, [chatId, emit])

  const stopTyping = useCallback(() => {
    if (!chatId || !isTypingRef.current) return
    isTypingRef.current = false
    emit(SocketEvent.TYPING_STOP, { chat_id: chatId })
  }, [chatId, emit])

  useEffect(() => {
    if (!socket || !chatId) return

    const handleUserTyping = (data: UserTypingPayload) => {
      if (data.chat_id !== chatId) return

      setTypingUsers((prev) => {
        const next = new Map(prev)
        next.set(data.user_id, data)
        return next
      })

      const existingTimeout = typingTimeoutRef.current.get(data.user_id)
      if (existingTimeout) clearTimeout(existingTimeout)

      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.delete(data.user_id)
          return next
        })
        typingTimeoutRef.current.delete(data.user_id)
      }, TYPING_TIMEOUT)

      typingTimeoutRef.current.set(data.user_id, timeout)
    }

    const handleUserStoppedTyping = (data: UserTypingPayload) => {
      if (data.chat_id !== chatId) return
      setTypingUsers((prev) => {
        const next = new Map(prev)
        next.delete(data.user_id)
        return next
      })
      const timeout = typingTimeoutRef.current.get(data.user_id)
      if (timeout) {
        clearTimeout(timeout)
        typingTimeoutRef.current.delete(data.user_id)
      }
    }

    socket.on(SocketEvent.USER_TYPING, handleUserTyping)
    socket.on(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping)

    return () => {
      socket.off(SocketEvent.USER_TYPING, handleUserTyping)
      socket.off(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping)
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout))
      typingTimeoutRef.current.clear()
    }
  }, [socket, chatId])

  useEffect(() => {
    return () => {
      setTypingUsers(new Map())
      isTypingRef.current = false
    }
  }, [chatId])

  return {
    typingUsers: Array.from(typingUsers.values()),
    isAnyoneTyping: typingUsers.size > 0,
    startTyping,
    stopTyping
  }
}

export default useTypingIndicator
