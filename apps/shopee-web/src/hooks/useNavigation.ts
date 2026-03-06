import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import navigationService, { PATHS } from 'src/services/navigation.service'

export const useNavigation = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigationService.init(navigate)
  }, [navigate])

  return {
    ...navigationService,
    navigate,
    PATHS
  }
}

export { PATHS }
export default useNavigation
