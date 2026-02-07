import 'react-native-reanimated';
import '../global.css';
import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { initializePurchases } from '../lib/purchases';

initializePurchases();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <StatusBar style="light" />
          <Slot />
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
