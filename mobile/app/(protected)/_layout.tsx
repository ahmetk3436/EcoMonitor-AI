import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, Redirect, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import { authenticateWithBiometrics, isBiometricLockEnabled } from '../../lib/biometrics';

const TABS = [
  { path: '/home', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  { path: '/map', icon: 'map', iconOutline: 'map-outline', label: 'Map' },
  { path: '/alerts', icon: 'notifications', iconOutline: 'notifications-outline', label: 'Alerts' },
  { path: '/history', icon: 'time', iconOutline: 'time-outline', label: 'History' },
  { path: '/settings', icon: 'settings', iconOutline: 'settings-outline', label: 'Settings' },
] as const;

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const activeTab = TABS.find(t => t.path === pathname)?.path || TABS[0].path;

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [biometricRequired, setBiometricRequired] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAndAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);

      const required = await isBiometricLockEnabled();
      setBiometricRequired(required);

      if (!required) {
        setIsUnlocked(true);
        setIsAuthenticating(false);
        return;
      }

      const success = await authenticateWithBiometrics();
      if (success) {
        setIsUnlocked(true);
        hapticSuccess();
      } else {
        setAuthError('Authentication failed. Please try again.');
        hapticError();
      }
    } catch (error) {
      console.error('Biometric check error:', error);
      setAuthError('An error occurred. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRetry = async () => {
    hapticSelection();
    await checkAndAuthenticate();
  };

  useEffect(() => {
    checkAndAuthenticate();
  }, []);

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

  // Biometric Lock Overlay
  if (biometricRequired && !isUnlocked) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="flex-1 items-center justify-center px-6">
          {/* Lock Icon */}
          <View className="w-24 h-24 rounded-full bg-emerald-500/20 items-center justify-center mb-8">
            <Ionicons name="lock-closed" size={48} color="#10b981" />
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold text-center mb-2">
            EcoMonitor AI Locked
          </Text>

          {/* Subtitle */}
          <Text className="text-gray-400 text-base text-center mb-8">
            Authenticate to access your environmental data
          </Text>

          {/* Loading State */}
          {isAuthenticating && (
            <View className="items-center">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-gray-400 text-sm mt-4">
                Waiting for authentication...
              </Text>
            </View>
          )}

          {/* Error State with Retry Button */}
          {authError && !isAuthenticating && (
            <View className="items-center">
              <View className="bg-red-500/20 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-400 text-sm text-center">
                  {authError}
                </Text>
              </View>
              <Pressable
                onPress={handleRetry}
                className="bg-emerald-500 rounded-xl px-8 py-4 active:opacity-80"
              >
                <Text className="text-white font-semibold text-base">
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

          {/* Initial Retry Button (when not loading and no error yet but not unlocked) */}
          {!isAuthenticating && !authError && !isUnlocked && (
            <Pressable
              onPress={handleRetry}
              className="bg-emerald-500 rounded-xl px-8 py-4 active:opacity-80"
            >
              <Text className="text-white font-semibold text-base">
                Unlock with Biometrics
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SubscriptionProvider>
      <View className="flex-1 bg-gray-950">
        <Slot />
        <View
          className="flex-row border-t border-gray-800 bg-gray-950"
          style={{ paddingBottom: insets.bottom }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.path;
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
    </SubscriptionProvider>
  );
}