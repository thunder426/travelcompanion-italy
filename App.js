import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import ExploreHomeScreen from './src/screens/ExploreHomeScreen';
import MapHomeScreen     from './src/screens/MapHomeScreen';
import ActivityScreen    from './src/screens/ActivityScreen';
import EssentialsScreen  from './src/screens/EssentialsScreen';
import JournalScreen     from './src/screens/JournalScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Explore:    { default: '🏛️' },
  Map:        { default: '🗺️' },
  Activity:   { default: '👣' },
  Essentials: { default: '📖' },
  Journal:    { default: '📝' },
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>
      {ICONS[name].default}
    </Text>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
            tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2a2a50' },
            tabBarActiveTintColor: '#e94560',
            tabBarInactiveTintColor: '#555',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Explore"
            component={ExploreHomeScreen}
            options={{
              title: 'Explore',
              tabBarIcon: ({ focused }) => <TabIcon name="Explore" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Map"
            component={MapHomeScreen}
            options={{
              title: 'Map',
              tabBarIcon: ({ focused }) => <TabIcon name="Map" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Activity"
            component={ActivityScreen}
            options={{
              title: 'Activity',
              tabBarIcon: ({ focused }) => <TabIcon name="Activity" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Essentials"
            component={EssentialsScreen}
            options={{
              title: 'Essentials',
              tabBarIcon: ({ focused }) => <TabIcon name="Essentials" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Journal"
            component={JournalScreen}
            options={{
              title: 'Journal',
              tabBarIcon: ({ focused }) => <TabIcon name="Journal" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
