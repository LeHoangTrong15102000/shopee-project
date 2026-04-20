import { Tabs } from 'expo-router'
import CustomTabBar from '@/components/navigation/CustomTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'TAB_HOME',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarLabel: 'TAB_CART',
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarLabel: 'TAB_LIVE',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarLabel: 'TAB_NOTIFICATIONS',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
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
