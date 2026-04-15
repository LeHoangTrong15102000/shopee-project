/**
 * Utility functions để sanitize input, chống NoSQL injection
 */

// Danh sách các ký tự nguy hiểm trong MongoDB query
const DANGEROUS_KEYS = ['$', '.']
const MONGO_OPERATORS = [
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$ne',
  '$in',
  '$nin',
  '$or',
  '$and',
  '$not',
  '$nor',
  '$exists',
  '$type',
  '$expr',
  '$regex',
  '$where',
  '$elemMatch',
]

/**
 * Sanitize một string, loại bỏ các ký tự nguy hiểm
 * @param value - Giá trị string cần sanitize
 * @returns String đã được sanitize
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') return value

  // Escape các ký tự đặc biệt có thể gây injection
  let sanitized = value
    .replace(/\$/g, '&#36;') // Escape ký tự $
    .replace(/\{/g, '&#123;') // Escape ký tự {
    .replace(/\}/g, '&#125;') // Escape ký tự }

  return sanitized
}

/**
 * Kiểm tra xem key có chứa ký tự nguy hiểm không
 * @param key - Key cần kiểm tra
 * @returns true nếu key nguy hiểm
 */
const isDangerousKey = (key: string): boolean => {
  if (typeof key !== 'string') return false

  // Kiểm tra key bắt đầu bằng $ hoặc chứa dấu .
  if (key.startsWith('$') || key.includes('.')) {
    return true
  }

  // Kiểm tra các MongoDB operators
  return MONGO_OPERATORS.includes(key.toLowerCase())
}

/**
 * Sanitize một object, loại bỏ các key nguy hiểm và sanitize values
 * Hỗ trợ nested objects và arrays
 * @param obj - Object cần sanitize
 * @param depth - Độ sâu hiện tại (để tránh infinite recursion)
 * @returns Object đã được sanitize
 */
export const sanitizeObject = (obj: unknown, depth: number = 0): unknown => {
  // Giới hạn độ sâu để tránh stack overflow
  const MAX_DEPTH = 20
  if (depth > MAX_DEPTH) return obj

  // Xử lý null/undefined
  if (obj === null || obj === undefined) return obj

  // Xử lý string
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  // Xử lý number, boolean
  if (typeof obj !== 'object') return obj

  // Xử lý array
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1))
  }

  // Xử lý object
  const sanitized: Record<string, unknown> = {}

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    // Bỏ qua các key nguy hiểm
    if (isDangerousKey(key)) {
      continue
    }

    // Sanitize key (loại bỏ ký tự nguy hiểm trong key name)
    const sanitizedKey = key.replace(/[$\.]/g, '_')

    // Recursive sanitize value
    sanitized[sanitizedKey] = sanitizeObject((obj as Record<string, unknown>)[key], depth + 1)
  }

  return sanitized
}

/**
 * Sanitize MongoDB query, loại bỏ các operators nguy hiểm
 * Dùng cho các trường hợp cần kiểm tra query trực tiếp
 * @param query - MongoDB query cần sanitize
 * @returns Query đã được sanitize
 */
export const sanitizeMongoQuery = (query: unknown): unknown => {
  if (query === null || query === undefined) return query

  if (typeof query === 'string') {
    // Kiểm tra string có chứa pattern injection không
    if (query.includes('$') || query.includes('{')) {
      return sanitizeString(query)
    }
    return query
  }

  if (typeof query !== 'object') return query

  if (Array.isArray(query)) {
    return query.map((item) => sanitizeMongoQuery(item))
  }

  const sanitized: Record<string, unknown> = {}

  for (const key of Object.keys(query as Record<string, unknown>)) {
    // Loại bỏ hoàn toàn các MongoDB operators nguy hiểm
    if (MONGO_OPERATORS.includes(key)) {
      continue
    }

    // Loại bỏ key bắt đầu bằng $
    if (key.startsWith('$')) {
      continue
    }

    sanitized[key] = sanitizeMongoQuery((query as Record<string, unknown>)[key])
  }

  return sanitized
}
