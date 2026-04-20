/// <reference types="jest" />

import {
  ERROR_CODES,
  AUTH_MESSAGES,
  USER_MESSAGES,
  PRODUCT_MESSAGES,
  PURCHASE_MESSAGES,
  CATEGORY_MESSAGES,
  REVIEW_MESSAGES,
  WISHLIST_MESSAGES,
  COMMON_MESSAGES,
  VALIDATION_MESSAGES,
  CONVERSATION_MESSAGES,
  UPLOAD_MESSAGES,
  SECURITY_MESSAGES,
} from '@constants/messages'

describe('messages constants', () => {
  describe('ERROR_CODES', () => {
    it('should export AUTH error codes in the E1xxx range', () => {
      expect(ERROR_CODES.AUTH_EMAIL_EXISTS).toBe('E1001')
      expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('E1002')
      expect(ERROR_CODES.AUTH_UNAUTHORIZED).toBe('E1008')
      expect(ERROR_CODES.AUTH_FORBIDDEN).toBe('E1009')
    })

    it('should export USER error codes in the E2xxx range', () => {
      expect(ERROR_CODES.USER_NOT_FOUND).toBe('E2001')
      expect(ERROR_CODES.USER_EMAIL_EXISTS).toBe('E2002')
    })

    it('should export PRODUCT error codes in the E3xxx range', () => {
      expect(ERROR_CODES.PRODUCT_NOT_FOUND).toBe('E3001')
      expect(ERROR_CODES.PRODUCT_QUANTITY_EXCEEDED).toBe('E3002')
    })

    it('should export PURCHASE error codes in the E4xxx range', () => {
      expect(ERROR_CODES.PURCHASE_NOT_FOUND).toBe('E4001')
      expect(ERROR_CODES.PURCHASE_PRODUCT_NOT_FOUND).toBe('E4002')
    })

    it('should export CATEGORY error codes in the E5xxx range', () => {
      expect(ERROR_CODES.CATEGORY_NOT_FOUND).toBe('E5001')
      expect(ERROR_CODES.CATEGORY_NAME_EXISTS).toBe('E5002')
    })

    it('should export REVIEW error codes in the E6xxx range', () => {
      expect(ERROR_CODES.REVIEW_NOT_FOUND).toBe('E6001')
      expect(ERROR_CODES.REVIEW_ALREADY_EXISTS).toBe('E6002')
    })

    it('should export WISHLIST error codes in the E7xxx range', () => {
      expect(ERROR_CODES.WISHLIST_NOT_FOUND).toBe('E7001')
      expect(ERROR_CODES.WISHLIST_ALREADY_EXISTS).toBe('E7002')
    })

    it('should export COMMON error codes in the E9xxx range', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('E9001')
      expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBe('E9002')
      expect(ERROR_CODES.BAD_REQUEST).toBe('E9003')
      expect(ERROR_CODES.NOT_FOUND).toBe('E9004')
    })
  })

  describe('AUTH_MESSAGES', () => {
    it('should have REGISTER_SUCCESS message', () => {
      expect(typeof AUTH_MESSAGES.REGISTER_SUCCESS).toBe('string')
    })

    it('should have LOGIN_SUCCESS message', () => {
      expect(typeof AUTH_MESSAGES.LOGIN_SUCCESS).toBe('string')
    })

    it('should have all required auth messages', () => {
      expect(AUTH_MESSAGES).toHaveProperty('LOGOUT_SUCCESS')
      expect(AUTH_MESSAGES).toHaveProperty('REFRESH_TOKEN_SUCCESS')
      expect(AUTH_MESSAGES).toHaveProperty('EMAIL_EXISTS')
      expect(AUTH_MESSAGES).toHaveProperty('INVALID_CREDENTIALS')
      expect(AUTH_MESSAGES).toHaveProperty('TOKEN_NOT_SENT')
      expect(AUTH_MESSAGES).toHaveProperty('TOKEN_EXPIRED')
      expect(AUTH_MESSAGES).toHaveProperty('TOKEN_INVALID')
      expect(AUTH_MESSAGES).toHaveProperty('UNAUTHORIZED')
      expect(AUTH_MESSAGES).toHaveProperty('FORBIDDEN')
    })
  })

  describe('USER_MESSAGES', () => {
    it('should have all required user messages', () => {
      expect(USER_MESSAGES).toHaveProperty('CREATE_SUCCESS')
      expect(USER_MESSAGES).toHaveProperty('UPDATE_SUCCESS')
      expect(USER_MESSAGES).toHaveProperty('DELETE_SUCCESS')
      expect(USER_MESSAGES).toHaveProperty('GET_SUCCESS')
      expect(USER_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(USER_MESSAGES).toHaveProperty('EMAIL_EXISTS')
    })
  })

  describe('PRODUCT_MESSAGES', () => {
    it('should have all required product messages', () => {
      expect(PRODUCT_MESSAGES).toHaveProperty('CREATE_SUCCESS')
      expect(PRODUCT_MESSAGES).toHaveProperty('UPDATE_SUCCESS')
      expect(PRODUCT_MESSAGES).toHaveProperty('DELETE_SUCCESS')
      expect(PRODUCT_MESSAGES).toHaveProperty('GET_SUCCESS')
      expect(PRODUCT_MESSAGES).toHaveProperty('GET_LIST_SUCCESS')
      expect(PRODUCT_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(PRODUCT_MESSAGES).toHaveProperty('QUANTITY_EXCEEDED')
    })
  })

  describe('PURCHASE_MESSAGES', () => {
    it('should have static success and error messages', () => {
      expect(PURCHASE_MESSAGES).toHaveProperty('ADD_TO_CART_SUCCESS')
      expect(PURCHASE_MESSAGES).toHaveProperty('UPDATE_SUCCESS')
      expect(PURCHASE_MESSAGES).toHaveProperty('BUY_SUCCESS')
      expect(PURCHASE_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(PURCHASE_MESSAGES).toHaveProperty('PRODUCT_NOT_FOUND')
    })

    it('should have DELETE_SUCCESS as a function that formats count', () => {
      expect(typeof PURCHASE_MESSAGES.DELETE_SUCCESS).toBe('function')
      expect(PURCHASE_MESSAGES.DELETE_SUCCESS(3)).toContain('3')
      expect(PURCHASE_MESSAGES.DELETE_SUCCESS(0)).toContain('0')
    })
  })

  describe('CATEGORY_MESSAGES', () => {
    it('should have all required category messages', () => {
      expect(CATEGORY_MESSAGES).toHaveProperty('CREATE_SUCCESS')
      expect(CATEGORY_MESSAGES).toHaveProperty('UPDATE_SUCCESS')
      expect(CATEGORY_MESSAGES).toHaveProperty('DELETE_SUCCESS')
      expect(CATEGORY_MESSAGES).toHaveProperty('GET_SUCCESS')
      expect(CATEGORY_MESSAGES).toHaveProperty('GET_LIST_SUCCESS')
      expect(CATEGORY_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(CATEGORY_MESSAGES).toHaveProperty('NAME_EXISTS')
    })
  })

  describe('REVIEW_MESSAGES', () => {
    it('should have all required review messages', () => {
      expect(REVIEW_MESSAGES).toHaveProperty('CREATE_SUCCESS')
      expect(REVIEW_MESSAGES).toHaveProperty('UPDATE_SUCCESS')
      expect(REVIEW_MESSAGES).toHaveProperty('DELETE_SUCCESS')
      expect(REVIEW_MESSAGES).toHaveProperty('GET_SUCCESS')
      expect(REVIEW_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(REVIEW_MESSAGES).toHaveProperty('ALREADY_REVIEWED')
    })
  })

  describe('WISHLIST_MESSAGES', () => {
    it('should have all required wishlist messages', () => {
      expect(WISHLIST_MESSAGES).toHaveProperty('ADD_SUCCESS')
      expect(WISHLIST_MESSAGES).toHaveProperty('REMOVE_SUCCESS')
      expect(WISHLIST_MESSAGES).toHaveProperty('GET_SUCCESS')
      expect(WISHLIST_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(WISHLIST_MESSAGES).toHaveProperty('ALREADY_EXISTS')
    })
  })

  describe('COMMON_MESSAGES', () => {
    it('should have success and error messages', () => {
      expect(COMMON_MESSAGES).toHaveProperty('SUCCESS')
      expect(COMMON_MESSAGES).toHaveProperty('CREATED')
      expect(COMMON_MESSAGES).toHaveProperty('UPDATED')
      expect(COMMON_MESSAGES).toHaveProperty('DELETED')
      expect(COMMON_MESSAGES).toHaveProperty('ERROR')
      expect(COMMON_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(COMMON_MESSAGES).toHaveProperty('BAD_REQUEST')
      expect(COMMON_MESSAGES).toHaveProperty('INTERNAL_SERVER_ERROR')
      expect(COMMON_MESSAGES).toHaveProperty('VALIDATION_ERROR')
      expect(COMMON_MESSAGES).toHaveProperty('INVALID_ID')
    })
  })

  describe('VALIDATION_MESSAGES', () => {
    it('should have REQUIRED as a function', () => {
      expect(typeof VALIDATION_MESSAGES.REQUIRED).toBe('function')
      expect(VALIDATION_MESSAGES.REQUIRED('email')).toContain('email')
    })

    it('should have MIN_LENGTH as a function', () => {
      expect(typeof VALIDATION_MESSAGES.MIN_LENGTH).toBe('function')
      expect(VALIDATION_MESSAGES.MIN_LENGTH('password', 8)).toContain('8')
    })

    it('should have MAX_LENGTH as a function', () => {
      expect(typeof VALIDATION_MESSAGES.MAX_LENGTH).toBe('function')
      expect(VALIDATION_MESSAGES.MAX_LENGTH('name', 100)).toContain('100')
    })

    it('should have static messages for common validation errors', () => {
      expect(typeof VALIDATION_MESSAGES.INVALID_EMAIL).toBe('string')
      expect(typeof VALIDATION_MESSAGES.INVALID_PHONE).toBe('string')
      expect(typeof VALIDATION_MESSAGES.INVALID_DATE).toBe('string')
      expect(typeof VALIDATION_MESSAGES.INVALID_OBJECT_ID).toBe('string')
    })

    it('should have POSITIVE_NUMBER as a function', () => {
      expect(typeof VALIDATION_MESSAGES.POSITIVE_NUMBER).toBe('function')
      expect(VALIDATION_MESSAGES.POSITIVE_NUMBER('price')).toContain('price')
    })

    it('should have MIN_VALUE as a function', () => {
      expect(typeof VALIDATION_MESSAGES.MIN_VALUE).toBe('function')
      expect(VALIDATION_MESSAGES.MIN_VALUE('age', 18)).toContain('18')
    })

    it('should have MAX_VALUE as a function', () => {
      expect(typeof VALIDATION_MESSAGES.MAX_VALUE).toBe('function')
      expect(VALIDATION_MESSAGES.MAX_VALUE('age', 120)).toContain('120')
    })

    it('should have ARRAY_NOT_EMPTY as a function', () => {
      expect(typeof VALIDATION_MESSAGES.ARRAY_NOT_EMPTY).toBe('function')
      expect(VALIDATION_MESSAGES.ARRAY_NOT_EMPTY('items')).toContain('items')
    })

    it('should have INVALID_ENUM as a function', () => {
      expect(typeof VALIDATION_MESSAGES.INVALID_ENUM).toBe('function')
      const result = VALIDATION_MESSAGES.INVALID_ENUM('status', ['active', 'inactive'])
      expect(result).toContain('active')
      expect(result).toContain('inactive')
    })
  })

  describe('CONVERSATION_MESSAGES', () => {
    it('should have all required conversation messages', () => {
      expect(CONVERSATION_MESSAGES).toHaveProperty('CREATE_SUCCESS')
      expect(CONVERSATION_MESSAGES).toHaveProperty('GET_SUCCESS')
      expect(CONVERSATION_MESSAGES).toHaveProperty('GET_LIST_SUCCESS')
      expect(CONVERSATION_MESSAGES).toHaveProperty('UPDATE_SUCCESS')
      expect(CONVERSATION_MESSAGES).toHaveProperty('DELETE_SUCCESS')
      expect(CONVERSATION_MESSAGES).toHaveProperty('SEND_MESSAGE_SUCCESS')
      expect(CONVERSATION_MESSAGES).toHaveProperty('NOT_FOUND')
      expect(CONVERSATION_MESSAGES).toHaveProperty('CHATBOT_ERROR')
      expect(CONVERSATION_MESSAGES).toHaveProperty('STREAMING_ERROR')
    })
  })

  describe('UPLOAD_MESSAGES', () => {
    it('should have all required upload messages', () => {
      expect(UPLOAD_MESSAGES).toHaveProperty('UPLOAD_SUCCESS')
      expect(UPLOAD_MESSAGES).toHaveProperty('UPLOAD_AVATAR_SUCCESS')
      expect(UPLOAD_MESSAGES).toHaveProperty('UPLOAD_PRODUCT_IMAGE_SUCCESS')
      expect(UPLOAD_MESSAGES).toHaveProperty('FILE_NOT_FOUND')
      expect(UPLOAD_MESSAGES).toHaveProperty('FILE_TOO_LARGE')
      expect(UPLOAD_MESSAGES).toHaveProperty('INVALID_FILE_TYPE')
      expect(UPLOAD_MESSAGES).toHaveProperty('UPLOAD_FAILED')
    })
  })

  describe('SECURITY_MESSAGES', () => {
    it('should have all required security messages', () => {
      expect(SECURITY_MESSAGES).toHaveProperty('RATE_LIMIT_EXCEEDED')
      expect(SECURITY_MESSAGES).toHaveProperty('SUSPICIOUS_ACTIVITY')
      expect(SECURITY_MESSAGES).toHaveProperty('INVALID_CONTENT_TYPE')
      expect(SECURITY_MESSAGES).toHaveProperty('REQUEST_TOO_LARGE')
    })
  })
})
