export const sortBy = {
  createdAt: 'createdAt',
  view: 'view',
  sold: 'sold',
  price: 'price'
} as const

// tránh trường hợp sortBy.createdAt = 'updatedAt' -> bị thay đổi giá trị
export const order = {
  asc: 'asc',
  desc: 'desc'
} as const
