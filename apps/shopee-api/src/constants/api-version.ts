/**
 * API Version constants
 * Quản lý version và prefix cho API
 *
 * Hỗ trợ:
 * - Versioning cho API endpoints
 * - Deprecation warnings cho old endpoints
 * - Migration path cho clients
 */

export const API_VERSION = 'v1'
export const API_PREFIX = `/api/${API_VERSION}`

// Các version được hỗ trợ
export const SUPPORTED_VERSIONS = ['v1'] as const

// Type cho version
export type ApiVersion = (typeof SUPPORTED_VERSIONS)[number]

// Deprecated endpoints - sẽ bị remove trong tương lai
export const DEPRECATED_ENDPOINTS: DeprecatedEndpoint[] = [
  // Ví dụ: endpoint cũ sẽ được deprecate
  // {
  //   path: '/api/products',
  //   deprecatedAt: '2025-01-01',
  //   removeAt: '2025-07-01',
  //   replacement: '/api/v1/products',
  //   message: 'Vui lòng sử dụng /api/v1/products thay thế'
  // }
]

// Interface cho deprecated endpoint
export interface DeprecatedEndpoint {
  path: string
  deprecatedAt: string
  removeAt: string
  replacement: string
  message: string
}

/**
 * Kiểm tra xem endpoint có bị deprecated không
 * @param path - Path của endpoint
 * @returns Thông tin deprecation nếu có, undefined nếu không
 */
export const getDeprecationInfo = (path: string): DeprecatedEndpoint | undefined => {
  return DEPRECATED_ENDPOINTS.find((endpoint) => path.startsWith(endpoint.path))
}

/**
 * Tạo deprecation warning header
 * @param endpoint - Thông tin deprecated endpoint
 * @returns Object chứa các headers cần set
 */
export const getDeprecationHeaders = (endpoint: DeprecatedEndpoint): Record<string, string> => {
  return {
    Deprecation: endpoint.deprecatedAt,
    Sunset: endpoint.removeAt,
    Link: `<${endpoint.replacement}>; rel="successor-version"`,
    'X-Deprecation-Notice': endpoint.message,
  }
}

/**
 * Kiểm tra version có được hỗ trợ không
 * @param version - Version cần kiểm tra
 * @returns true nếu version được hỗ trợ
 */
export const isVersionSupported = (version: string): version is ApiVersion => {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion)
}

/**
 * Lấy version mới nhất
 * @returns Version mới nhất
 */
export const getLatestVersion = (): ApiVersion => {
  return SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]
}
