/// <reference types="jest" />
import { getQuestionsSchema, askQuestionSchema, answerQuestionSchema, likeQuestionSchema, likeAnswerSchema } from '@schemas/qa.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('askQuestionSchema', () => {
  it('should pass with valid data', () => {
    const result = askQuestionSchema.safeParse({
      body: { product_id: VALID_ID, question: 'This is a valid question with more than 10 characters' },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when product_id is missing', () => {
    const result = askQuestionSchema.safeParse({
      body: { question: 'This is a valid question with more than 10 characters' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when product_id is invalid', () => {
    const result = askQuestionSchema.safeParse({
      body: { product_id: 'invalid', question: 'This is a valid question with more than 10 characters' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when question is too short', () => {
    const result = askQuestionSchema.safeParse({
      body: { product_id: VALID_ID, question: 'Short' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when question is too long', () => {
    const result = askQuestionSchema.safeParse({
      body: { product_id: VALID_ID, question: 'a'.repeat(2001) },
    })
    expect(result.success).toBe(false)
  })
})

describe('answerQuestionSchema', () => {
  it('should pass with valid data', () => {
    const result = answerQuestionSchema.safeParse({
      params: { questionId: VALID_ID },
      body: { answer: 'This is a valid answer' },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when answer is missing', () => {
    const result = answerQuestionSchema.safeParse({
      params: { questionId: VALID_ID },
      body: {},
    })
    expect(result.success).toBe(false)
  })

  it('should fail when answer is empty', () => {
    const result = answerQuestionSchema.safeParse({
      params: { questionId: VALID_ID },
      body: { answer: '' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when answer is too long', () => {
    const result = answerQuestionSchema.safeParse({
      params: { questionId: VALID_ID },
      body: { answer: 'a'.repeat(2001) },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when questionId is invalid', () => {
    const result = answerQuestionSchema.safeParse({
      params: { questionId: 'invalid' },
      body: { answer: 'This is a valid answer' },
    })
    expect(result.success).toBe(false)
  })

  it('should pass with optional is_seller', () => {
    const result = answerQuestionSchema.safeParse({
      params: { questionId: VALID_ID },
      body: { answer: 'This is a valid answer', is_seller: true },
    })
    expect(result.success).toBe(true)
  })
})

describe('getQuestionsSchema', () => {
  it('should pass with valid data', () => {
    const result = getQuestionsSchema.safeParse({
      query: { product_id: VALID_ID, page: 1, limit: 10 },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when product_id is missing', () => {
    const result = getQuestionsSchema.safeParse({ query: {} })
    expect(result.success).toBe(false)
  })

  it('should fail when page is 0', () => {
    const result = getQuestionsSchema.safeParse({
      query: { product_id: VALID_ID, page: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 51', () => {
    const result = getQuestionsSchema.safeParse({
      query: { product_id: VALID_ID, limit: 51 },
    })
    expect(result.success).toBe(false)
  })
})

describe('likeQuestionSchema', () => {
  it('should pass with valid questionId', () => {
    const result = likeQuestionSchema.safeParse({ params: { questionId: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail when questionId is invalid', () => {
    const result = likeQuestionSchema.safeParse({ params: { questionId: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('likeAnswerSchema', () => {
  it('should pass with valid questionId and answerId', () => {
    const result = likeAnswerSchema.safeParse({ params: { questionId: VALID_ID, answerId: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail when questionId is invalid', () => {
    const result = likeAnswerSchema.safeParse({ params: { questionId: 'invalid', answerId: VALID_ID } })
    expect(result.success).toBe(false)
  })

  it('should fail when answerId is invalid', () => {
    const result = likeAnswerSchema.safeParse({ params: { questionId: VALID_ID, answerId: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

