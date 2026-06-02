import React, { useState } from 'react'
import { View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native'
import { Image, type ImageProps } from 'expo-image'
import { useColors } from '@/hooks/useColors'

interface AppImageProps extends Omit<ImageProps, 'style'> {
  style?: StyleProp<ImageStyle>
  fallbackStyle?: StyleProp<ViewStyle>
}

const AppImage: React.FC<AppImageProps> = ({
  style,
  fallbackStyle,
  placeholder,
  transition,
  onError,
  ...rest
}) => {
  const colors = useColors()
  const [hasError, setHasError] = useState(false)

  const handleError: ImageProps['onError'] = (e) => {
    setHasError(true)
    onError?.(e)
  }

  if (hasError) {
    return (
      <View style={[style as ViewStyle, { backgroundColor: colors.neutrals800 }, fallbackStyle]} />
    )
  }

  return (
    <Image
      style={style}
      placeholder={placeholder ?? { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      transition={transition ?? 200}
      recyclingKey={typeof rest.source === 'string' ? rest.source : undefined}
      onError={handleError}
      {...rest}
    />
  )
}

export default AppImage
