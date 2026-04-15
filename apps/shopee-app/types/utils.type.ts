export type SuccessResponseApi<Data> = {
  message: string
  data: Data
}

export type ErrorResponseApi<Data = Record<string, string>> = {
  message: string
  data?: Data
}
