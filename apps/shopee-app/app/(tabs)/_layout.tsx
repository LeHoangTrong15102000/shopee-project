import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import CustomTabBar from '@/components/navigation/CustomTabBar'

export default function TabsLayout() {
  const { t } = useTranslation()

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('TAB_HOME'),
          tabBarLabel: 'TAB_HOME',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('TAB_CART'),
          tabBarLabel: 'TAB_CART',
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t('TAB_LIVE'),
          tabBarLabel: 'TAB_LIVE',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('TAB_NOTIFICATIONS'),
          tabBarLabel: 'TAB_NOTIFICATIONS',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('TAB_ACCOUNT'),
          tabBarLabel: 'TAB_ACCOUNT',
        }}
      />
      {/* Mall is not a primary tab — accessible via MallScreen content */}
      <Tabs.Screen
        name="mall"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}
