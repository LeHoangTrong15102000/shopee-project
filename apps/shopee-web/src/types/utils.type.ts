// truyền vào responseApi 1 generic type chung, được trả về từ Api sẽ có 2 thuộc tính là (message và data: Data)
// Ở đây coi ResponseApi như hàm và <Data> là param truyền vào thì sẽ có dược type như kia {message: , data?:}
export interface SuccessResponseApi<Data> {
  message: string
  // data có kiểu trả về là Data
  data: Data // Quy định như này để dùng cho nhiều loại repsonse trả về
}

// Api trả về cho Api bị gọi lỗi, có thể có data hoặc không
export interface ErrorResponseApi<Data> {
  message: string
  data?: Data
}

/**
 * cú pháp `-?` loại bỏ các key optional (ví như name?: string) -> loại bỏ undefined của key optional
 * NonNullable là một utils của thằng typescript nó sẽ loại bỏ đi giá trị undefined của một cái Type
 */
export type NoUndefinedField<T> = {
  [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>>
}

// Vế đầu tiên là loại bỏ `optional` attribute - Vế sau có nghĩa là loại bỏ đi giá trị null hoặc undefined của `value`

// Error type for retry callbacks in React Query
export interface RetryError {
  name?: string
  code?: string
  response?: {
    status: number
  }
}
