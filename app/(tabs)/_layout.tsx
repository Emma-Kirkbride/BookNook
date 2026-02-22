import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/ExploreIcon.png')} 
              style={{ width: 28, height: 28, tintColor: color }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Bookshelves"
        options={{
          title: 'Bookshelves',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/BookshelvesIcon.png')} 
              style={{ width: 28, height: 28, tintColor: color }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="BookWormAI"
        options={{
          title: 'BookWorm AI',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/BookWormIcon.png')} 
              style={{ width: 25, height: 25, tintColor: color }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('@/assets/images/SettingsIcon.png')} 
              style={{ width: 28, height: 28, tintColor: color }}
            />
          ),
        }}
      />
    </Tabs>
  );
}