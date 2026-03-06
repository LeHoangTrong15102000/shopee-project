// Để quy định rõ hơn về cái quyền thì chúng ta có thể khai báo 1 cái type cho nó
type Role = 'User' | 'Admin'

export interface User {
  _id: string
  roles: Role[] // roles kiểu như này thì nó sẽ rõ hơn
  email: string
  name?: string
  date_of_birth?: string // Api nó trả về cho chúng ta là ISO 8601
  avatar?: string
  address?: string
  phone?: string
  createdAt: string
  updatedAt: string
}
