import { createContext, useState, useMemo, useCallback } from 'react'
import { User } from 'src/types/user.type'
import { getAccessTokenFromLS, getProfileFromLS } from 'src/utils/auth'
import { useCartStore } from 'src/stores/cart.store'

interface AppContextInterface {
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
  profile: User | null
  setProfile: React.Dispatch<React.SetStateAction<User | null>>
  reset: () => void
}

// Khởi tạo giá trị cho localStorage
export const getInitialAppContext: () => AppContextInterface = () => ({
  // Nó sẽ kiểm tra nếu mà có access_token rồi thì khi mà F5 lại thì nó vẫn đăng nhập
  isAuthenticated: Boolean(getAccessTokenFromLS()), // ép kiểu cho nó
  setIsAuthenticated: () => null,
  profile: getProfileFromLS(), // ban đầu cho nó giá trị khởi tạo là null, lấy ra user từ localStorage
  setProfile: () => null,
  reset: () => null
})

const initialAppContext = getInitialAppContext()

// Khai báo một context
export const AppContext = createContext<AppContextInterface>(initialAppContext) // cho nó 1 giá trị khởi tạo

// Khi mà không truyền vào provider cái value thì giá trị khởi tạo sẽ được dùng
export const AppProvider = ({ children }: { children: React.ReactNode; defaultValue?: AppContextInterface }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAppContext.isAuthenticated)
  const [profile, setProfile] = useState<AppContextInterface['profile']>(initialAppContext.profile)

  // Mỗi khi mà clearLS thì hàm reset này nó sẽ gọi lại
  const reset = useCallback(() => {
    // Không nên reset lại bằng giá trị của initalAppContext
    setIsAuthenticated(false)
    setProfile(null)
    // Clear cart state in Zustand store
    useCartStore.getState().clearCart()
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      setIsAuthenticated,
      profile,
      setProfile,
      reset
    }),
    [isAuthenticated, profile, reset]
  )

  return (
    // Trong đây truyền những giá trị được khai báo trong AppProvider
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  )
}
