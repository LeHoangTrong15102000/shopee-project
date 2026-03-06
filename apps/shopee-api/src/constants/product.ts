export const SORT_BY = ['createdAt', 'view', 'sold', 'price'] as const
export const ORDER = ['desc', 'asc'] as const

export type SortByType = (typeof SORT_BY)[number]
export type OrderType = (typeof ORDER)[number]
