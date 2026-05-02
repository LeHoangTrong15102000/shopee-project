import Anthropic from '@anthropic-ai/sdk'
import { ChatMessage } from '../@types/conversation.type'
import { MESSAGE_ROLE } from '@database/models/conversation.model'
import type { MessageRole } from '@database/models/conversation.model'
import { createMessage } from './conversation.helper'

// Kiểm tra API key khi module được load
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY chưa được cấu hình trong file .env')
  console.warn('⚠️  Chatbot sẽ hoạt động với fallback responses')
}

/**
 * Khởi tạo Anthropic client với timeout
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 10000, // 10 giây timeout
})

/**
 * Tạo system prompt cho Shopee chatbot
 */
const getSystemPrompt = (): string => {
  return `Bạn là trợ lý ảo Shopee Vietnam. Hỗ trợ về sản phẩm, đơn hàng, thanh toán bằng tiếng Việt thân thiện. Trả lời ngắn gọn, có emoji, chuyên nghiệp. Chỉ nói về shopping.`
}

/**
 * Fallback responses khi không có Anthropic API key hoặc có lỗi
 */
const getFallbackResponse = (userMessage: string, errorType = 'general'): string => {
  const lowerMessage = userMessage.toLowerCase()

  // Xử lý theo loại lỗi
  if (errorType === 'quota') {
    if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello')) {
      return 'Xin chào! Tôi là trợ lý ảo của Shopee. Hiện tại tài khoản Anthropic đã hết quota, nhưng tôi vẫn có thể hỗ trợ bạn với các câu hỏi cơ bản. Bạn cần hỗ trợ gì? 😊'
    }
    return 'Xin lỗi, hệ thống AI hiện đã hết quota. Vui lòng liên hệ quản trị viên để nạp thêm credit hoặc liên hệ CSKH: 1900-1234 để được hỗ trợ trực tiếp! 💳😔'
  }

  if (errorType === 'auth') {
    return 'Xin lỗi, có lỗi xác thực với hệ thống AI. Vui lòng liên hệ quản trị viên hoặc CSKH: 1900-1234 để được hỗ trợ! 🔑😔'
  }

  // Responses thông thường
  if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello')) {
    return 'Xin chào! Tôi là trợ lý ảo của Shopee. Hiện tại hệ thống AI đang bảo trì, nhưng tôi vẫn có thể hỗ trợ bạn với các câu hỏi cơ bản. Bạn cần hỗ trợ gì? 😊'
  }

  if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('mua')) {
    return 'Để tìm sản phẩm phù hợp, bạn có thể duyệt qua các danh mục trên trang chủ hoặc sử dụng tính năng tìm kiếm. Nếu cần hỗ trợ chi tiết, vui lòng liên hệ hotline: 1900-1234 📞'
  }

  if (lowerMessage.includes('đơn hàng') || lowerMessage.includes('order')) {
    return 'Bạn có thể kiểm tra đơn hàng trong mục "Đơn mua" trên tài khoản của mình. Nếu có vấn đề, vui lòng liên hệ CSKH: 1900-1234 📦'
  }

  return 'Xin lỗi, hệ thống AI đang bảo trì. Để được hỗ trợ nhanh nhất, vui lòng liên hệ hotline: 1900-1234 hoặc chat với CSKH trên app Shopee. Cảm ơn bạn! 😔💫'
}

/**
 * Chuyển đổi messages thành format cho Anthropic
 */
const formatMessagesForAnthropic = (
  messages: ChatMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> => {
  return messages.map((msg) => ({
    role: msg.role === MESSAGE_ROLE.USER ? ('user' as const) : ('assistant' as const),
    content: msg.content,
  }))
}

/**
 * Generate response sử dụng Anthropic Claude
 */
export const generateChatResponse = async (
  messages: ChatMessage[],
  userMessage: string,
): Promise<string> => {
  try {
    // Kiểm tra API key trước khi gọi Anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('🚫 Không có ANTHROPIC_API_KEY - sử dụng fallback')
      return getFallbackResponse(userMessage)
    }

    console.log('🤖 Đang gọi Anthropic Claude API...')

    const allMessages: ChatMessage[] = [...messages, createMessage(userMessage, MESSAGE_ROLE.USER)]

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Model nhanh và rẻ nhất
      max_tokens: 150, // Giảm từ 500 xuống 150 để nhanh hơn
      temperature: 0.7,
      system: getSystemPrompt(),
      messages: formatMessagesForAnthropic(allMessages),
    })

    // Lấy text từ response
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if ('text' in block) return block.text
        return ''
      })
      .join('')

    console.log('✅ Anthropic Claude API response thành công')
    return text || getFallbackResponse(userMessage, 'general')
  } catch (error) {
    const err = error as Error & { status?: number }
    console.error('❌ Lỗi khi gọi Anthropic API:', err)

    // Kiểm tra loại lỗi cụ thể
    if (
      err.status === 429 ||
      err.message?.includes('quota') ||
      err.message?.includes('rate limit')
    ) {
      console.log('💳 Lỗi quota/rate limit Anthropic - sử dụng fallback response')
      return getFallbackResponse(userMessage, 'quota')
    }

    if (
      err.status === 401 ||
      err.message?.includes('authentication') ||
      err.message?.includes('api key')
    ) {
      console.log('🔑 Lỗi authentication Anthropic - sử dụng fallback response')
      return getFallbackResponse(userMessage, 'auth')
    }

    // Fallback response cho các lỗi khác
    console.log('🔧 Lỗi khác - sử dụng fallback response')
    return getFallbackResponse(userMessage, 'general')
  }
}

/**
 * Generate streaming response sử dụng Anthropic Claude
 */
export const generateStreamingChatResponse = async (
  messages: ChatMessage[],
  userMessage: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
) => {
  try {
    // Kiểm tra API key trước khi gọi Anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('🚫 Không có ANTHROPIC_API_KEY - sử dụng fallback streaming')
      const fallbackText = getFallbackResponse(userMessage)

      // Simulate streaming cho fallback response
      const words = fallbackText.split(' ')
      for (let i = 0; i < words.length; i++) {
        setTimeout(() => {
          onChunk(words[i] + ' ')
          if (i === words.length - 1) onComplete()
        }, i * 100) // 100ms delay between words
      }
      return
    }

    console.log('🤖 Đang khởi tạo Anthropic Claude Streaming...')

    const allMessages: ChatMessage[] = [...messages, createMessage(userMessage, MESSAGE_ROLE.USER)]

    // Tạo streaming request với Anthropic
    const stream = await anthropic.messages.stream({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0.7,
      system: getSystemPrompt(),
      messages: formatMessagesForAnthropic(allMessages),
    })

    console.log('📡 Đang nhận streaming data từ Claude...')

    // Handle stream events
    stream.on('text', (chunk: string) => {
      onChunk(chunk)
    })

    stream.on('end', () => {
      console.log('✅ Streaming hoàn tất')
      onComplete()
    })

    stream.on('error', (error: Error) => {
      console.error('❌ Lỗi streaming:', error)
      onError(error.message || 'Streaming error')
    })
  } catch (error) {
    const err = error as Error & { status?: number }
    console.error('❌ Lỗi khởi tạo streaming:', err)

    // Fallback với error handling
    if (err.status === 429) {
      onError('Quota limit reached')
    } else if (err.status === 401) {
      onError('Authentication failed')
    } else {
      onError(err.message || 'Failed to initialize streaming')
    }
  }
}

/**
 * Tạo title cho conversation dựa trên tin nhắn đầu tiên
 */
export const generateConversationTitle = async (firstMessage: string): Promise<string> => {
  try {
    if (firstMessage.length <= 50) {
      return firstMessage
    }

    // Fallback nếu không có API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 20,
      temperature: 0.3,
      system:
        'Hãy tạo một tiêu đề ngắn gọn (tối đa 50 ký tự) cho cuộc trò chuyện dựa trên tin nhắn đầu tiên của khách hàng. Chỉ trả về tiêu đề, không giải thích.',
      messages: [
        {
          role: 'user' as const,
          content: firstMessage,
        },
      ],
    })

    const title = response.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if ('text' in block) return block.text
        return ''
      })
      .join('')

    return (
      title.slice(0, 50).trim() ||
      firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    )
  } catch (error) {
    console.error('Error generating conversation title:', error)
    return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
  }
}

// Export compatibility object for existing code
export const chatBotService = {
  generateResponse: generateChatResponse,
  generateStreamingResponse: generateStreamingChatResponse,
  generateConversationTitle,
}
