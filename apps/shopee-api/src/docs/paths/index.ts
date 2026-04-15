/**
 * Paths Index
 * Combine tất cả API paths cho Swagger documentation
 */

import { authPaths } from './auth.paths'
import { productsPaths } from './products.paths'

// Combine tất cả paths thành một object
export const paths = {
  ...authPaths,
  ...productsPaths,
}
