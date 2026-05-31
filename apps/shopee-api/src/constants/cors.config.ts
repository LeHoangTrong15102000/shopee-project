import { CorsOptions } from 'cors'
import { isProduction } from '@utils/helper'

// Danh sách các origins được phép truy cập API
const ALLOWED_ORIGINS_DEV = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:5173',
]

const ALLOWED_ORIGINS_PROD = [
  'https://lehoangtrong.com',
  'https://www.lehoangtrong.com',
  'https://shop-admin.lehoangtrong.com',
  // Localhost origins cho development/testing (kể cả khi chạy prod mode)
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:5173',
]

// Kết hợp danh sách origins dựa trên môi trường
export const ALLOWED_ORIGINS = isProduction
  ? ALLOWED_ORIGINS_PROD
  : [...ALLOWED_ORIGINS_DEV, ...ALLOWED_ORIGINS_PROD]

// Hàm kiểm tra origin có trong whitelist không
export const checkOriginWhitelist = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  // Cho phép requests không có origin (như mobile apps, Postman, curl)
  if (!origin) {
    return callback(null, true)
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true)
  } else {
    callback(new Error(`Origin ${origin} không được phép truy cập`))
  }
}

// CORS configuration options
export const corsOptions: CorsOptions = {
  origin: checkOriginWhitelist,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 giờ - thời gian cache preflight request
}
