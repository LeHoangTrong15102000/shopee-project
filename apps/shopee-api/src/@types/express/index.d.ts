// Express type augmentations
declare namespace Express {
  interface Request {
    jwtDecoded: {
      id: string
      email: string
      name?: string
      roles: string[]
      created_at: string
    }
  }
}
