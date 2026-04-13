import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import TranslationScreen from './src/screens/TranslationScreen';
import MuseumScreen from './src/screens/MuseumScreen';
import MapScreen from './src/screens/MapScreen';
import ExplorerScreen from './src/screens/ExplorerScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Translate: '📷',
    Museum: '🏛️',
    Map: '🗺️',
    Explorer: '🔍',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[name]}
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
            tabBarStyle: { backgroundColor: '#1a1a2e' },
            tabBarActiveTintColor: '#e94560',
            tabBarInactiveTintColor: '#888',
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
            name="Museum"
            component={MuseumScreen}
            options={{
              title: 'Museum Guide',
              tabBarIcon: ({ focused }) => <TabIcon name="Museum" focused={focused} />,
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
            name="Explorer"
            component={ExplorerScreen}
            options={{
              title: 'Explorer',
              tabBarIcon: ({ focused }) => <TabIcon name="Explorer" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
