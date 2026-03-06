//  Test những hàm liên quan đến authenticated
import { describe, it, expect, beforeEach } from 'vitest'
import {
  clearLS,
  getAccessTokenFromLS,
  getProfileFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setProfileToLS,
  setRefreshTokenToLS,
  LocalStorageEventTarget
} from 'src/utils/auth'

const access_token =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAyVDE0OjExOjMwLjYxMloiLCJpYXQiOjE3MDQyMDQ2OTAsImV4cCI6MTcwNDI5MTA5MH0.wAci7__9N-qgkLDtklgqL1h2RC52jKrxG3qbmOo5kWg'

const refresh_token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAyVDE0OjExOjMwLjYxMloiLCJpYXQiOjE3MDQyMDQ2OTAsImV4cCI6MTcxMjg0NDY5MH0.deXlO8p2rHP5zlRaVhL_ePOOZ1LWenzyeIw6OJengyA'

const profile =
  '{"_id":"63e0f0386d7c620340850e6e","roles":["User"],"email":"langtupro0456@gmail.com","createdAt":"2023-02-06T12:19:04.582Z","updatedAt":"2024-01-02T04:56:13.929Z","__v":0,"address":"126/13 đường 17 khu phố 5 phường Linh Trung Tp Thủ Đức","date_of_birth":"1990-04-27T17:00:00.000Z","name":"Lê Hoàng Trọng 1","phone":"0773094710","avatar":"77d9909d-3161-4195-a67c-db4585f80e4b.jpg"}'

// Cẩn thận import thằng beforeEach từ thằng node:test
beforeEach(() => {
  localStorage.clear()
})

describe('access_token', () => {
  it('access_token được set vào localStorage', () => {
    // Đầu tiên là chạy hàm setAccessTokenToLS
    setAccessTokenToLS(access_token)
    // Nếu mà test đúng thì thằng toBe nó phải trả về accesS_token
    expect(getAccessTokenFromLS()).toBe(access_token)
  })
})

describe('refresh_token', () => {
  it('refresh_token được set vào localStorage', () => {
    setRefreshTokenToLS(refresh_token)
    expect(getRefreshTokenFromLS()).toEqual(refresh_token)
  })
})

// describe('getAccessTokenFromLS', () => {
//   it('access_token được lấy từ localStorage', () => {
//     setAccessTokenToLS(access_token)
//     expect(localStorage.getItem('access_token')).toBe(access_token)
//   })
// })

// describe('getRefreshTokenFromLS', () => {
//   it('refresh_token được lấy từ localStorage', () => {
//     setRefreshTokenToLS(refresh_token)
//     expect(localStorage.getItem('refresh_token')).toBe(refresh_token)
//   })
// })

// Hầu hết các trường hợp set thì đều test băng `getItem` vì đã chạy hàm setProfile trước rồi
describe('profile', () => {
  it('profile được set vào localStorage', () => {
    setProfileToLS(JSON.parse(profile))
    expect(localStorage.getItem('profile')).toEqual(profile)
  })
})

// describe('getProfileFromLS', () => {
//   it('profile được lấy từ localStorage', () => {
//     setProfileToLS(JSON.parse(profile))
//     expect(localStorage.getItem('profile')).toEqual(profile)
//   })
// })

// test với clearLS, hàm clearLS có sử dụng Event là API trên trình duyệt nhưng mà may là thằng jsdom nó vẫn hiểu được Event
// Thăng tabnine được
describe('clearLS', () => {
  it('Xóa tất cả access_token refresh_token và profile khỏi localStorage', () => {
    setAccessTokenToLS(access_token)
    setRefreshTokenToLS(refresh_token)
    setProfileToLS(JSON.parse(profile))
    clearLS()
    expect(getAccessTokenFromLS()).toBe('')
    expect(getRefreshTokenFromLS()).toBe('')
    expect(getProfileFromLS()).toBe(null)
  })

  it('dispatches clearLS event on LocalStorageEventTarget', () => {
    let eventFired = false
    const handler = () => {
      eventFired = true
    }
    LocalStorageEventTarget.addEventListener('clearLS', handler)
    clearLS()
    expect(eventFired).toBe(true)
    LocalStorageEventTarget.removeEventListener('clearLS', handler)
  })
})
