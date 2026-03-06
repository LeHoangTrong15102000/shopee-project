import { useState, useCallback, useEffect } from 'react'
import useSocket from './useSocket'
import {
  SocketEvent,
  MessageReceivedPayload,
  SendMessagePayload,
  JoinChatPayload,
  MessageDeliveredPayload
} from 'src/types/socket.types'

interface ChatState {
  messages: MessageReceivedPayload[]
  currentChatId: string | null
  isLoading: boolean
}

const useChat = () => {
  const { socket, isConnected, emit } = useSocket()
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentChatId: null,
    isLoading: false
  })

  const joinChat = useCallback(
    (chatId: string) => {
      setChatState((prev) => ({ ...prev, currentChatId: chatId, messages: [], isLoading: true }))
      emit(SocketEvent.JOIN_CHAT, { chat_id: chatId } as JoinChatPayload)
    },
    [emit]
  )

  const leaveChat = useCallback(() => {
    if (chatState.currentChatId) {
      emit(SocketEvent.LEAVE_CHAT, { chat_id: chatState.currentChatId })
      setChatState((prev) => ({ ...prev, currentChatId: null, messages: [] }))
    }
  }, [chatState.currentChatId, emit])

  const sendMessage = useCallback(
    (message: string) => {
      if (!chatState.currentChatId || !message.trim()) return
      const payload: SendMessagePayload = {
        chat_id: chatState.currentChatId,
        message: message.trim(),
        message_type: 'text'
      }
      emit(SocketEvent.SEND_MESSAGE, payload)
    },
    [chatState.currentChatId, emit]
  )

  useEffect(() => {
    if (!socket) return

    const handleMessageReceived = (data: MessageReceivedPayload) => {
      if (data.chat_id === chatState.currentChatId) {
        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, data],
          isLoading: false
        }))
      }
    }

    const handleMessageDelivered = (data: MessageDeliveredPayload) => {
      if (data.chat_id === chatState.currentChatId) {
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg._id === data.message_id ? { ...msg, status: 'delivered' as const } : msg
          )
        }))
      }
    }

    const handleUserJoined = () => {
      setChatState((prev) => ({ ...prev, isLoading: false }))
    }

    socket.on(SocketEvent.MESSAGE_RECEIVED, handleMessageReceived)
    socket.on(SocketEvent.MESSAGE_DELIVERED, handleMessageDelivered)
    socket.on(SocketEvent.USER_JOINED, handleUserJoined)

    return () => {
      socket.off(SocketEvent.MESSAGE_RECEIVED, handleMessageReceived)
      socket.off(SocketEvent.MESSAGE_DELIVERED, handleMessageDelivered)
      socket.off(SocketEvent.USER_JOINED, handleUserJoined)
    }
  }, [socket, chatState.currentChatId])

  return {
    messages: chatState.messages,
    currentChatId: chatState.currentChatId,
    isLoading: chatState.isLoading,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage
  }
}

export default useChat
