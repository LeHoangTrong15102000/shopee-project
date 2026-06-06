import { validateEnv } from './env.schema'

// Validate env first — throws and exits with a clear error if invalid
const env = validateEnv()

export const config = {
  SECRET_KEY: env.SECRET_KEY_JWT,
  EXPIRE_ACCESS_TOKEN: env.JWT_ACCESS_TTL,
  EXPIRE_REFRESH_TOKEN: env.JWT_REFRESH_TTL,
  AUTH_STRICT_MODE: env.AUTH_STRICT_MODE,
  REDIS_URL: env.REDIS_URL,
  TWO_FACTOR_ENCRYPTION_KEY: env.TWO_FACTOR_ENCRYPTION_KEY,
  FLASH_SALE_CHECK_INTERVAL: env.FLASH_SALE_CHECK_INTERVAL,
  REFUND_REQUEST_DEADLINE_DAYS: env.REFUND_REQUEST_DEADLINE_DAYS,
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
}

export const FOLDER_UPLOAD = env.UPLOAD_DIR

export const FOLDERS = {
  PRODUCT: 'product',
  AVATAR: 'avatar',
}

export const ROUTE_IMAGE = 'images'
