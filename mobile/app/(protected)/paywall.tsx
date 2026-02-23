import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';

// RevenueCat UI — paywall is fully managed from RevenueCat dashboard
let RevenueCatUI: any = null;
let PAYWALL_RESULT: any = { PURCHASED: 'PURCHASED', RESTORED: 'RESTORED', NOT_PRESENTED: 'NOT_PRESENTED', ERROR: 'ERROR', CANCELLED: 'CANCELLED' };
try {
  const mod = require('react-native-purchases-ui');
  RevenueCatUI = mod.default ?? mod;
  if (mod.PAYWALL_RESULT) PAYWALL_RESULT = mod.PAYWALL_RESULT;
} catch {
  // react-native-purchases-ui not available (Expo Go / dev)
}

interface ContextualPaywallProps {
  onPurchaseCompleted: () => void;
  onDismiss: () => void;
}

function ContextualPaywall({ onPurchaseCompleted, onDismiss }: ContextualPaywallProps) {
  const { packages, handlePurchase, handleRestore, checkSubscription } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  useEffect(() => {
    if (packages && packages.length > 0) {
      setPackagesError(null);
      return;
    }

    const timer = setTimeout(() => {
      if (!packages || packages.length === 0) {
        setPackagesError('Subscriptions not available in this environment');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [packages]);

  const onPurchase = async (packageIdentifier: string) => {
    setLoading(packageIdentifier);
    setError(null);
    try {
      await handlePurchase(packageIdentifier);
      await checkSubscription();
      onPurchaseCompleted();
    } catch (e: any) {
      setError(e?.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const onRestore = async () => {
    setLoading('restore');
    setError(null);
    try {
      await handleRestore();
      await checkSubscription();
      onPurchaseCompleted();
    } catch (e: any) {
      setError(e?.message || 'Restore failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <TouchableOpacity onPress={onDismiss} style={{ alignSelf: 'flex-end', padding: 8 }}>
          <Text style={{ color: '#9ca3af', fontSize: 16 }}>Close</Text>
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 24 }}>
          Upgrade to Premium
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 12 }}>
          Unlock unlimited scans, advanced analytics, and more!
        </Text>

        {error && (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginTop: 20 }}>
            <Text style={{ color: '#dc2626', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        <View style={{ marginTop: 32, gap: 12 }}>
          {packages && packages.length > 0 ? (
            packages.map((pkg: any) => (
              <TouchableOpacity
                key={pkg.identifier}
                onPress={() => onPurchase(pkg.identifier)}
                disabled={loading !== null}
                style={{
                  backgroundColor: loading === pkg.identifier ? '#374151' : '#2563eb',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  opacity: loading !== null && loading !== pkg.identifier ? 0.5 : 1,
                }}
              >
                {loading === pkg.identifier ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                      {pkg.product?.title || pkg.identifier}
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 16 }}>
                      {pkg.product?.priceString || ''}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : packagesError ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>{packagesError}</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>Loading offers...</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onRestore}
          disabled={loading !== null}
          style={{ marginTop: 24, padding: 12, opacity: loading !== null ? 0.5 : 1 }}
        >
          {loading === 'restore' ? (
            <ActivityIndicator color="#60a5fa" />
          ) : (
            <Text style={{ color: '#60a5fa', textAlign: 'center', fontSize: 14 }}>
              Restore Purchase
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          Cancel anytime. Subscription auto-renews unless canceled.
        </Text>
      </ScrollView>
    </View>
  );
}

export default function PaywallScreen() {
  const { checkSubscription } = useSubscription();

  const handleDismiss = () => router.back();

  const handlePurchaseCompleted = async () => {
    await checkSubscription();
    router.back();
  };

  if (!RevenueCatUI) {
    return (
      <ContextualPaywall onPurchaseCompleted={handlePurchaseCompleted} onDismiss={handleDismiss} />
    );
  }

  return (
    <RevenueCatUI.Paywall
      onDismiss={handleDismiss}
      onPurchaseCompleted={handlePurchaseCompleted}
      onRestoreCompleted={handlePurchaseCompleted}
      onPurchaseError={() => router.back()}
      onRestoreError={() => router.back()}
    />
  );
}