import axios, { AxiosError } from 'axios'
import { differenceInDays, format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import deburr from 'lodash/deburr'
import escape from 'lodash/escape'
import kebabCase from 'lodash/kebabCase'
import trim from 'lodash/trim'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import userImage from 'src/assets/images/user.svg'
import config from 'src/constant/config'
import { ErrorResponseApi } from 'src/types/utils.type'

// Hàm kiểm tra Error từ Axios
export function isAxiosError<T>(error: unknown): error is AxiosError<T> {
  return axios.isAxiosError(error)
}

// genericType <FormError> khi mà server trả về lỗi
//  Mong muốn error trả về có kiểu là AxiosError và genericType là FormError
export function isAxiosUnprocessableEntityError<FormError>(error: unknown): error is AxiosError<FormError> {
  // Khi đã có lỗi rồi mình muốn kiểm tra xem lỗi đó có phải là lỗi 422 ?
  return isAxiosError(error) && error.response?.status === HTTP_STATUS_CODE.UnprocessableEntity
}

// Hàm kiểm tra Unauthorized
export function isAxiosUnauthorizedError<UnauthorizedError>(error: unknown): error is AxiosError<UnauthorizedError> {
  return isAxiosError(error) && error.response?.status === HTTP_STATUS_CODE.Unauthorized
}

// Hàm kiểm tra ExpiredTokenError() -> hàm nay sẽ có lỗi là UnauthorizedTokenError()
// Cần phải truyền vào cái isAxiosUnauthorizedError để biết kiểu dữ liệu trả về của cái Error này là gì -> Trả về response lỗi và bên trong sẽ có kiểu lỗi khi trả về là gì
export function isAxiosExpiredTokenError<UnauthorizedError>(error: unknown): error is AxiosError<UnauthorizedError> {
  return (
    isAxiosUnauthorizedError<ErrorResponseApi<{ name: string; message: string }>>(error) &&
    error.response?.data?.data?.name === 'EXPIRED_TOKEN'
  )
}

// Tạo 2 function để tính convert giá tiền và số lượt bán trong productList
export function formatCurrency(currency: number) {
  return new Intl.NumberFormat('de-DE').format(currency)
}

export function formatNumberToSocialStyle(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  })
    .format(value)
    .replace('.', ',')
    .toLowerCase()
}

// Function tính tỉ lệ giá giảm trong productDetail
export const rateSale = (original: number, sale: number) => {
  return Math.round(((original - sale) / original) * 100) + '%'
}

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
    locale: vi
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
    behavior: prefersReducedMotion ? 'auto' : 'smooth'
  })
}
