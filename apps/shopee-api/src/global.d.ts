// Global type definitions cho toàn bộ project
// File này sẽ được TypeScript tự động load

declare namespace Express {
  interface Request {
    jwtDecoded: {
      id: string
      email: string
      roles: string[]
      created_at: string
    }
  }
}

// Global interfaces
interface User {
  email: string
  password: string
  name: string
  date_of_birth: string
  address: string
  phone: string
  roles: string[]
  avatar?: string
  [key: string]: unknown
}

interface Register {
  email: string
  password: string
  name: string
  date_of_birth: string
  address: string
  phone: string
}

interface Login {
  email: string
  password: string
}

interface PayloadToken {
  id: string
  email: string
  roles: string[]
  created_at: string
}

interface Token {
  tokens: string[]
}

type ErrorThrow = Record<string, unknown>
