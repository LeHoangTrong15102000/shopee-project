import { User } from 'src/types/user.type'

// EventTarget xử lý khi mà access_token hết hạn
export const LocalStorageEventTarget = new EventTarget() // event có sẵn của js trình duyệt

export const setAccessTokenToLS = (access_token: string) => {
  localStorage.setItem('access_token', access_token)
}

export const setRefreshTokenToLS = (refresh_token: string) => {
  localStorage.setItem('refresh_token', refresh_token)
}

// clear access_token khi logout
export const clearLS = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('profile')

  // Khi mà chúng ta clearLS() thì cái EventTarger() nó sẽ lắng nghe cái sự kiện này
  const clearLSEvent = new Event('clearLS') // này cũng là Api có sẵn của js trình duyệt
  LocalStorageEventTarget.dispatchEvent(clearLSEvent)
}

export const getAccessTokenFromLS = () => localStorage.getItem('access_token') ?? ''

export const getRefreshTokenFromLS = () => localStorage.getItem('refresh_token') ?? ''

// mặc định khi mà không có thì nó sẽ về null
export const getProfileFromLS = () => {
  try {
    const result = localStorage.getItem('profile')
    return result ? JSON.parse(result) : null
  } catch {
    return null
  }
}

export const setProfileToLS = (profile: User) => {
  localStorage.setItem('profile', JSON.stringify(profile))
}
