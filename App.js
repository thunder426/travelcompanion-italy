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

import TranslationScreen from './src/screens/TranslationScreen';
import DiscoverScreen    from './src/screens/DiscoverScreen';
import MapScreen         from './src/screens/MapScreen';
import EssentialsScreen  from './src/screens/EssentialsScreen';
import NotesScreen       from './src/screens/NotesScreen';
import ExpenseScreen     from './src/screens/ExpenseScreen';
import RoutePlannerScreen from './src/screens/RoutePlannerScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Translate:  { default: '🌍' },
  Discover:   { default: '🏛️' },
  Map:        { default: '🗺️' },
  Essentials: { default: '📖' },
  Notes:      { default: '📝' },
  Expenses:   { default: '💰' },
  Routes:     { default: '🧭' },
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
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
            name="Translate"
            component={TranslationScreen}
            options={{
              title: 'Translate',
              tabBarIcon: ({ focused }) => <TabIcon name="Translate" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Discover"
            component={DiscoverScreen}
            options={{
              title: 'Discover',
              tabBarIcon: ({ focused }) => <TabIcon name="Discover" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{
              title: 'ZTL Map',
              tabBarIcon: ({ focused }) => <TabIcon name="Map" focused={focused} />,
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
            name="Notes"
            component={NotesScreen}
            options={{
              title: 'Notes',
              tabBarIcon: ({ focused }) => <TabIcon name="Notes" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Routes"
            component={RoutePlannerScreen}
            options={{
              title: 'Routes',
              tabBarIcon: ({ focused }) => <TabIcon name="Routes" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Expenses"
            component={ExpenseScreen}
            options={{
              title: 'Expenses',
              tabBarIcon: ({ focused }) => <TabIcon name="Expenses" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
