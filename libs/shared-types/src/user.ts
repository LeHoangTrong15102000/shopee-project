export interface User {
  _id: string
  roles: string[]
  email: string
  name?: string
  date_of_birth?: string
  avatar?: string
  address?: string
  phone?: string
  twoFactorEnabled?: boolean
  /** Whether this account has a user-chosen password (false for Google-OAuth accounts) */
  hasPassword?: boolean
  createdAt: string
  updatedAt: string
}
