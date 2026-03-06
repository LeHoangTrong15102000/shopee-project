import { useState, useEffect, useCallback } from 'react'
import useSocket from './useSocket'
import { SocketEvent, NewQuestionPayload, NewAnswerPayload, QuestionLikedPayload } from 'src/types/socket.types'

interface UseLiveQAReturn {
  newQuestions: NewQuestionPayload['question'][]
  newAnswers: NewAnswerPayload[]
  likeUpdates: Map<string, number>
  clearNewQuestions: () => void
}

const useLiveQA = (productId: string | undefined): UseLiveQAReturn => {
  const { socket, isConnected } = useSocket()
  const [newQuestions, setNewQuestions] = useState<NewQuestionPayload['question'][]>([])
  const [newAnswers, setNewAnswers] = useState<NewAnswerPayload[]>([])
  const [likeUpdates, setLikeUpdates] = useState<Map<string, number>>(new Map())

  const clearNewQuestions = useCallback(() => {
    setNewQuestions([])
  }, [])

  useEffect(() => {
    if (!socket || !isConnected || !productId) return

    const handleNewQuestion = (data: NewQuestionPayload) => {
      if (data.product_id === productId) {
        setNewQuestions((prev) => [...prev, data.question])
      }
    }

    const handleNewAnswer = (data: NewAnswerPayload) => {
      if (data.product_id === productId) {
        setNewAnswers((prev) => [...prev, data])
      }
    }

    const handleQuestionLiked = (data: QuestionLikedPayload) => {
      if (data.product_id === productId) {
        setLikeUpdates((prev) => {
          const next = new Map(prev)
          next.set(data.question_id, data.likes_count)
          return next
        })
      }
    }

    socket.on(SocketEvent.NEW_QUESTION, handleNewQuestion)
    socket.on(SocketEvent.NEW_ANSWER, handleNewAnswer)
    socket.on(SocketEvent.QUESTION_LIKED, handleQuestionLiked)

    return () => {
      socket.off(SocketEvent.NEW_QUESTION, handleNewQuestion)
      socket.off(SocketEvent.NEW_ANSWER, handleNewAnswer)
      socket.off(SocketEvent.QUESTION_LIKED, handleQuestionLiked)
      setNewQuestions([])
      setNewAnswers([])
      setLikeUpdates(new Map())
    }
  }, [socket, isConnected, productId])

  return { newQuestions, newAnswers, likeUpdates, clearNewQuestions }
}

export default useLiveQA
