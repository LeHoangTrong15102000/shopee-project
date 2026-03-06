// Viết những  cái liên quan đến uth

import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'

export const access_token_1s =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTAzVDA3OjU4OjEzLjI1MVoiLCJpYXQiOjE3MDQyNjg2OTMsImV4cCI6MTcwNDI2ODY5NH0.zMLnzrH-oOGnzs3-XQBtBU_RQYiPB4w_OPX00e2UVVc'

export const refresh_token_1000days =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAyLTA2VDA4OjM1OjQ1LjE1OVoiLCJpYXQiOjE3MDcyMDg1NDUsImV4cCI6MTc5MzYwODU0NX0.1-G282S-oOgn141fr5khQNx7m3n4kLpqeu2nLOQLaG4'

export const access_token =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAyLTA2VDA4OjM1OjQ1LjE1OVoiLCJpYXQiOjE3MDcyMDg1NDUsImV4cCI6MTcwODIwODU0NH0.GOwVFVH3wMDjgWEHOCFNTogz_0Ow1pCTa3-jkegm-jM'

const loginRes = {
  message: 'Đăng nhập thành công',
  data: {
    access_token:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTE2VDA4OjI0OjQ3LjExMVoiLCJpYXQiOjE3MDUzOTM0ODcsImV4cCI6MTcwNTk5ODI4N30.SQ6g7I0nsEqLkRwJhr2HV8GzhLeyHDwgi2euZltuOp8',
    expires: 604800,
    refresh_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTE2VDA4OjI0OjQ3LjExMVoiLCJpYXQiOjE3MDUzOTM0ODcsImV4cCI6MTcxNDAzMzQ4N30.0Q9XQFmmSdPgL4pwIS83knp6ZFh3C1iwIUZm09yQ58Q',
    expires_refresh_token: 8640000,
    user: {
      _id: '63e0f0386d7c620340850e6e',
      roles: ['User'],
      email: 'langtupro0456@gmail.com',
      createdAt: '2023-02-06T12:19:04.582Z',
      updatedAt: '2024-01-09T04:36:01.373Z',
      __v: 0,
      address: '126/13 đường 17 khu phố 5 phường Linh Trung Tp Thủ Đức',
      date_of_birth: '1990-04-17T17:00:00.000Z',
      name: 'Lê Hoàng Trọng',
      phone: '0773094710',
      avatar: '77d9909d-3161-4195-a67c-db4585f80e4b.jpg'
    }
  }
}

// Res khi mà refresh-access-token thành công
const refreshTokenRes = {
  message: 'Refresh Token thành công',
  data: {
    access_token:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAyLTA2VDA4OjM2OjM0Ljc0M1oiLCJpYXQiOjE3MDcyMDg1OTQsImV4cCI6MTcwNzgxMzM5NH0.cePhoZ02rx59VCNE8pssex4INLmWmk586t6xIVJeUns'
  }
}

export const loginRequest = http.post(`${config.baseUrl}login`, () => {
  // return res(ctx.status(HTTP_STATUS_CODE.Ok), ctx.json(loginRes))
  return HttpResponse.json(loginRes, { status: HTTP_STATUS_CODE.Ok })
})

// Tạo thêm Refresh Token ở đây luôn

export const refreshToken = http.post(`${config.baseUrl}refresh-access-token`, () => {
  // return res(ctx.status(HTTP_STATUS_CODE.Ok), ctx.json(refreshTokenRes))
  return HttpResponse.json(refreshTokenRes, { status: HTTP_STATUS_CODE.Ok })
})

const authRequests = [loginRequest, refreshToken]

export default authRequests
