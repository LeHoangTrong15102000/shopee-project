import { AppText } from '@/components/ui'
import { useCartCount } from '@/hooks/useCartCount'
import { useColors } from '@/hooks/useColors.ts'
import { useUnreadCount } from '@/hooks/useNotifications'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Bell, Home, Radio, ShoppingCart, User } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'

interface TabIconProps {
  name: string
  color: string
  size: number
  badgeCount?: number
}

const TabIcon: React.FC<TabIconProps> = ({ name, color, size, badgeCount }) => {
  const colors = useColors()
  const badge =
    badgeCount != null && badgeCount > 0 ? (
      <View
        style={{
          position: 'absolute',
          top: -4,
          right: -6,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
        <Text style={{ color: colors.primaryForeground, fontSize: 9, fontWeight: 'bold' }}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </Text>
      </View>
    ) : null

  switch (name) {
    case 'home':
      return <Home size={size} color={color} />
    case 'cart':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingCart size={size} color={color} />
          {badge}
        </View>
      )
    case 'live':
      return <Radio size={size} color={color} />
    case 'notifications':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={size} color={color} />
          {badge}
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
  const unreadCount = unreadData?.data?.count ?? 0
  const cartCount = useCartCount()

  return (
    <View className="pb-safe-offset-0 flex-row border-t border-neutrals900 bg-background py-2">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]

        if ((options as { href?: string | null }).href === null) {
          return null
        }

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
                badgeCount={
                  route.name === 'notifications'
                    ? unreadCount
                    : route.name === 'cart'
                      ? cartCount
                      : undefined
                }
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
