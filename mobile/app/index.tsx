import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';

const ONBOARDING_KEY = 'onboarding_complete';

export default function Index() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
        setOnboardingComplete(value === 'true');
      } catch {
        setOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);

  if (isLoading || onboardingComplete === null) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (isAuthenticated || isGuest) {
    return <Redirect href="/(protected)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
