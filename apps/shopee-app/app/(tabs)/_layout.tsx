import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import CustomScreenHeader from '@/components/navigation/ScreenHeader';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'HOME',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'MORE',
        }}
      />
    </Tabs>
  );
}

