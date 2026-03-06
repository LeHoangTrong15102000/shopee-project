import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'
import { URL_LOGIN, URL_LOGOUT, URL_REFRESH_TOKEN, URL_REGISTER } from 'src/apis/auth.api'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'
import { AuthResponse, RefreshTokenResponse } from 'src/types/auth.type'
import { ErrorResponseApi } from 'src/types/utils.type'
import {
  clearLS,
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setProfileToLS,
  setRefreshTokenToLS
} from './auth'
import { isAxiosExpiredTokenError, isAxiosUnauthorizedError } from './utils'

class Http {
  instance: AxiosInstance
  private accessToken: string // Lưu access_Token trong class là nó lưu trên RAM
  private refreshToken: string
  private refreshTokenRequest: Promise<string> | null
  constructor() {
    // this.refreshTokenRequest = null
    this.accessToken = getAccessTokenFromLS() // lấy accessToken từ LS
    this.refreshToken = getRefreshTokenFromLS() // Ban đầu khi chưa có trong localStorage thì refresToken là undefined
    this.refreshTokenRequest = null
    this.instance = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000, // sau 10s thì nó sẽ ngừng gọi api
      headers: {
        'Content-Type': 'application/json', // Giao tiếp dạng json
        'expire-access-token': 60 * 60 * 24, // 10s sau khi access_token hết hạn thì sẽ đá người dùng về login
        'expire-refresh-token': 60 * 60 * 24 * 7 // 7 ngày
      }
    })
    // Add request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          // Khi đã đăng nhập rồi và có access_token rồi thì client sẽ gửi req lên server để cấu hình accToken vào headers.Authorization
          config.headers.authorization = this.accessToken // Config access_token lên headers-authorization
          return config // return lại headers-authorization có access_token lên server
        }
        return config // chưa đăng nhập thì trả lại config không có gì
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    // Add response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        // console.log(response)
        const { url } = response.config
        // Nên lấy cái path từ api, chứ nếu như thằng react-router nó cấu hình khác thì chắc chắn chúng ta sẽ bị lỗi -> tìm tàng lỗi
        if (url === URL_LOGIN || url === URL_REGISTER) {
          const data = response.data as AuthResponse
          this.accessToken = data.data.access_token
          this.refreshToken = data.data.refresh_token
          setAccessTokenToLS(this.accessToken) //  lưu vào localStorage
          setRefreshTokenToLS(this.refreshToken)
          setProfileToLS(data.data.user)
        } else if (url === URL_LOGOUT) {
          this.accessToken = ''
          this.refreshToken = ''
          clearLS() // xóa accessToken khỏi localStorage
        }
        return response
      },
      async (error: AxiosError) => {
        // Nếu mà phủ định trong đây thì error: (kiểu type sẽ là Never)
        // if (!isAxiosUnprocessableEntityError(error)) {
        //   console.log(error)
        // }
        // Dùng như nà sẽ bảo toàn về mặt type Error cho chúng ta

        // Chỉ toast những lỗi không phải của 422 và 401, nên logic code nó sẽ là như thế này
        if (
          ![HTTP_STATUS_CODE.UnprocessableEntity, HTTP_STATUS_CODE.Unauthorized].includes(
            error.response?.status as number
          )
        ) {
          const data: { message?: string } | undefined = error.response?.data as { message?: string } | undefined
          const message = data?.message || error.message // đôi khi data.message nó không trả về thì sẽ lấy error.message
          toast.error(message)
        }

        // Nếu  là lỗi 401
        if (isAxiosUnauthorizedError<ErrorResponseApi<{ name: string; message: string }>>(error)) {
          const config = error.response?.config ?? ({} as AxiosRequestConfig)
          // const config = error.response?.config ?? ({ headers: {} } as AxiosRequestConfig)
          const { url } = config
          // Trường hợp token hết hạn và request đó không phải của  request refresh token
          // Thì chúng ta mới tiền hành gọi refresh token(tức là những Api hết hạn thông thường) chúng ta dùng refresh_token để tiến hành gọi lại

          // Trường hợp 401 của thằng request refresh token thì chúng ta không cần phải gọi lại làm gì(đến nước đó đã lỗi rồi thì thôi) chúng ta cho người dùng đăng nhập lại

          // Có nghĩa là chúng ta chưa gọi đến thằng refresh_token nên mới bắt đầu tiền hành gọi
          if (isAxiosExpiredTokenError(error) && url !== URL_REFRESH_TOKEN) {
            // Hạn chế gọi 2 lần refreshToken
            this.refreshTokenRequest = this.refreshTokenRequest
              ? this.refreshTokenRequest
              : this.handleRefreshToken().finally(() => {
                  // Giữ lại refreshTokenRequest trong khoảng 10s cho những request tiếp theo nếu có 401 thì dùng, Và thời gian giữ lại nó phải bé hơn thời gian refreshToken
                  setTimeout(() => {
                    this.refreshTokenRequest = null
                  }, 10000)
                })

            // Nếu mà không return thì nó sẽ trả về giá trị promise<resolve> giá trị là undefined
            // Nếu mà không return thì dù cho nó có bị lỗi 401 thì nó vẫn clearLS() đi
            return this.refreshTokenRequest.then((access_token) => {
              // Nghĩa là chúng ta tiếp tục gọi lại request cũ vừa bị lỗi
              // return lại config để lấy cái access_token mới gắn vào
              return this.instance({ ...config, headers: { ...(config.headers || {}), authorization: access_token } }) // Ở phiên bản axios mới thì chúng ta sẽ làm như này
            })
            // .catch((refreshTokenError) => {
            //   throw refreshTokenError
            // })
          }

          // Các trường hợp khi mà đi kèm với
          // + Còn những trường hợp truyền token không đúng
          // + Không truyền token
          // + Token hết hạn nhưng gọi refreshToken bị failed (cũng có thể là refreshToken cũng đã hết hạn)

          // trường hợp đi kèm với clearLS() thì
          clearLS() // Clear localStorage
          this.accessToken = ''
          this.refreshToken = ''
          toast.error(error.response?.data?.data?.message ?? error.response?.data.message, { autoClose: 1000 })
        }
        return Promise.reject(error)
      }
    )
  }
  private async handleRefreshToken() {
    // Do chúng ta không return về một cái promise nên không thể .finally() được
    return await this.instance
      .post<RefreshTokenResponse>(URL_REFRESH_TOKEN, {
        refresh_token: this.refreshToken
      })
      .then((res) => {
        // khi mà thành công thì lấy ra access_token
        const { access_token } = res.data.data
        setAccessTokenToLS(access_token)
        this.accessToken = access_token // phải config lại thằng accessToken vào local
        return access_token
      })
      .catch((error) => {
        clearLS()
        this.accessToken = ''
        this.refreshToken = ''
        throw error
      })
  }
}

const http = new Http().instance

export default http

// Làm 1 cái project mới trong tháng 1 này mới được rồi qua tháng 2 lên đi làm, cố gắng thôi không còn cự được bao lâu nữa rồi cuộc sống không chờ mình đâu
