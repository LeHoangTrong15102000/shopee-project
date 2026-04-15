import { differenceInDays, format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import deburr from 'lodash/deburr'
import escape from 'lodash/escape'
import kebabCase from 'lodash/kebabCase'
import trim from 'lodash/trim'
import userImage from 'src/assets/images/user.svg'
import config from 'src/constant/config'

// Re-export shared utils for backward compatibility
export {
  isAxiosError,
  isAxiosUnauthorizedError,
  isAxiosExpiredTokenError,
  isAxiosUnprocessableEntityError,
  formatNumberToSocialStyle,
  rateSale,
  formatDiscount,
} from '@shopee/shared-utils'
import { formatNumber } from '@shopee/shared-utils'

// Re-export formatNumber as formatCurrency for backward compatibility
export const formatCurrency = formatNumber

/**
 * Tạo URL-friendly slug từ tên sản phẩm và ID
 * Sử dụng lodash trim, deburr, kebabCase để normalize string
 * @param params - Object chứa name và id
 * @param params.name - Tên sản phẩm
 * @param params.id - ID sản phẩm
 * @returns URL slug dạng "ten-san-pham-i-id"
 * @example generateNameId({ name: 'Điện thoại iPhone 12', id: '123' }) => 'dien-thoai-iphone-12-i-123'
 */
export const generateNameId = ({ name, id }: { name: string; id: string }): string => {
  const cleanName = trim(name)
  const normalizedName = deburr(cleanName)
  const kebabName = kebabCase(normalizedName)

  return `${kebabName}-i-${id}`
}

/**
 * Lấy ID sản phẩm từ URL slug
 * @param nameId - URL slug dạng "ten-san-pham-i-id"
 * @returns ID sản phẩm
 * @example getIdFromNameId('dien-thoai-iphone-12-i-123') => '123'
 */
export const getIdFromNameId = (nameId: string): string => {
  const arr = nameId.split('-i-')
  return arr[arr.length - 1]
}

/**
 * Cắt ngắn văn bản với độ dài tối đa và thêm suffix
 * @param text - Văn bản cần cắt
 * @param maxLength - Độ dài tối đa
 * @param suffix - Hậu tố thêm vào cuối (mặc định: '...')
 * @returns Văn bản đã được cắt ngắn
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text
  return trim(text.slice(0, maxLength)) + suffix
}

/**
 * Chuẩn hóa chuỗi tìm kiếm: loại bỏ dấu, chuyển thành chữ thường, trim whitespace
 * @param query - Chuỗi tìm kiếm
 * @returns Chuỗi đã được chuẩn hóa
 */
export const normalizeSearchQuery = (query: string): string => {
  return trim(deburr(query).toLowerCase())
}

/**
 * Escape HTML entities để prevent XSS attacks
 * @param str - Chuỗi cần escape
 * @returns Chuỗi đã được escape HTML entities
 */
export const escapeHtml = (str: string): string => {
  return escape(str)
}

// func lấy ra avatar cho chúng ta
export const getAvatarUrl = (avatarName?: string) => {
  if (!avatarName) return userImage
  // Nếu avatarName đã là URL đầy đủ (http:// hoặc https://), trả về trực tiếp
  if (avatarName.startsWith('http://') || avatarName.startsWith('https://')) {
    return avatarName
  }
  // Nếu là relative path, prefix với baseUrl
  return `${config.baseUrl}images/${avatarName}`
}

// Format relative time using date-fns (vừa xong, 5 phút trước, etc.)
export const formatTimeAgo = (dateString: string): string => {
  const date = parseISO(dateString)
  if (!isValid(date)) return ''

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: vi,
  })
}

// Format date theo định dạng cụ thể
export const formatDate = (dateString: string, formatStr: string = 'dd/MM/yyyy'): string => {
  const date = parseISO(dateString)
  if (!isValid(date)) return ''

  return format(date, formatStr, { locale: vi })
}

// Format datetime
export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, 'HH:mm dd/MM/yyyy')
}

// Check if date is within last N days
export const isWithinDays = (dateString: string, days: number): boolean => {
  const date = parseISO(dateString)
  if (!isValid(date)) return false

  return differenceInDays(new Date(), date) <= days
}

/**
 * Scroll to top of the page
 * @param prefersReducedMotion - If true, uses instant scroll instead of smooth
 */
export const scrollToTop = (prefersReducedMotion: boolean = false) => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
}
