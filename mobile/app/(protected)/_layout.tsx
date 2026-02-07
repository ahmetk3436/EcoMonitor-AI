import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Slot, Redirect, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection } from '../../lib/haptics';

const TABS = [
  { path: '/(protected)/home', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  { path: '/(protected)/map', icon: 'map', iconOutline: 'map-outline', label: 'Map' },
  { path: '/(protected)/alerts', icon: 'notifications', iconOutline: 'notifications-outline', label: 'Alerts' },
  { path: '/(protected)/history', icon: 'time', iconOutline: 'time-outline', label: 'History' },
  { path: '/(protected)/settings', icon: 'settings', iconOutline: 'settings-outline', label: 'Settings' },
] as const;

// Screens that are navigable but not shown in the tab bar
const HIDDEN_ROUTES = ['/(protected)/paywall', '/(protected)/coordinate-detail'];

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return <Redirect href="/(auth)/login" />;
  }

  // Check if current route is a hidden route (don't highlight any tab)
  const isHiddenRoute = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <View className="flex-1 bg-gray-950">
      <Slot />
      <View
        className="flex-row border-t border-gray-800 bg-gray-950"
        style={{ paddingBottom: insets.bottom }}
      >
        {TABS.map((tab) => {
          const isActive = !isHiddenRoute && (pathname === tab.path || pathname.startsWith(tab.path));
          return (
            <Pressable
              key={tab.path}
              className="flex-1 items-center py-3"
              onPress={() => {
                hapticSelection();
                router.push(tab.path as any);
              }}
            >
              <Ionicons
                name={(isActive ? tab.icon : tab.iconOutline) as any}
                size={24}
                color={isActive ? '#10b981' : '#6b7280'}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
