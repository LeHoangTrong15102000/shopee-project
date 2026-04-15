import { createAuthStorage } from '@shopee/shared-utils'
import { User } from 'src/types/user.type'

const authStorage = createAuthStorage({
  accessTokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  profileKey: 'profile',
})

// EventTarget xử lý khi mà access_token hết hạn
export const LocalStorageEventTarget = new EventTarget()

export const setAccessTokenToLS = (access_token: string) => {
  authStorage.setAccessToken(access_token)
}

export const setRefreshTokenToLS = (refresh_token: string) => {
  authStorage.setRefreshToken(refresh_token)
}

// clear access_token khi logout
export const clearLS = () => {
  authStorage.clearAll()

  // Khi mà chúng ta clearLS() thì cái EventTarger() nó sẽ lắng nghe cái sự kiện này
  const clearLSEvent = new Event('clearLS')
  LocalStorageEventTarget.dispatchEvent(clearLSEvent)
}

export const getAccessTokenFromLS = () => authStorage.getAccessToken()

export const getRefreshTokenFromLS = () => authStorage.getRefreshToken()

export const getProfileFromLS = () => authStorage.getProfile<User>()

export const setProfileToLS = (profile: User) => {
  authStorage.setProfile(profile)
}
