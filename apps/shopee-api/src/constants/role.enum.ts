export const ROLE = {
    ADMIN: 'Admin',
    USER: 'User'
} as const

export type RoleType = (typeof ROLE)[keyof typeof ROLE]