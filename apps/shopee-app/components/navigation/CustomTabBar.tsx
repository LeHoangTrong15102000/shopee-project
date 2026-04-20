import React from 'react'
import { TouchableOpacity, View, Text } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useColors } from '@/hooks/useColors.ts'
import { Home, ShoppingCart, Radio, Bell, User } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { useUnreadCount } from '@/hooks/useNotifications'

interface TabIconProps {
  name: string
  color: string
  size: number
  unreadCount?: number
}

const TabIcon: React.FC<TabIconProps> = ({ name, color, size, unreadCount }) => {
  switch (name) {
    case 'home':
      return <Home size={size} color={color} />
    case 'cart':
      return <ShoppingCart size={size} color={color} />
    case 'live':
      return <Radio size={size} color={color} />
    case 'notifications':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={size} color={color} />
          {unreadCount != null && unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#EE4D2D',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      )
    case 'account':
      return <User size={size} color={color} />
    default:
      return <Home size={size} color={color} />
  }
}

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const colors = useColors()
  const { t } = useTranslation()
  const { data: unreadData } = useUnreadCount()
  const unreadCount = (unreadData as any)?.data?.count ?? 0

  return (
    <View className="pb-safe-offset-0 flex-row border-t border-neutrals900 bg-background py-2">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name

        const isFocused = state.index === index

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params)
          }
        }

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          })
        }

        const iconColor = isFocused ? colors.primary : colors.neutrals400
        const labelColor = isFocused ? colors.primary : colors.neutrals400

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              borderRadius: 12,
              marginHorizontal: 4,
            }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <TabIcon
                name={route.name}
                color={iconColor}
                size={24}
                unreadCount={route.name === 'notifications' ? unreadCount : undefined}
              />
            </View>

            <AppText
              raw
              style={{
                color: labelColor,
                fontSize: 12,
                fontWeight: isFocused ? '600' : '400',
                textAlign: 'center',
              }}>
              {t(label as string)}
            </AppText>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default CustomTabBar
