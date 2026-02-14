import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  Switch,
  ScrollView,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import { hapticWarning, hapticMedium, hapticLight, hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({
  icon,
  iconColor = '#10b981',
  label,
  sublabel,
  onPress,
  showChevron = true,
  rightElement,
  destructive,
}: SettingRowProps) {
  return (
    <Pressable
      className="flex-row items-center justify-between px-4 py-4"
      onPress={() => {
        hapticSelection();
        onPress();
      }}
    >
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon as any} size={22} color={iconColor} />
        <View className="ml-3 flex-1">
          <Text className={`text-base font-medium ${destructive ? 'text-red-400' : 'text-white'}`}>
            {label}
          </Text>
          {sublabel && (
            <Text className="text-sm text-gray-500 mt-0.5">{sublabel}</Text>
          )}
        </View>
      </View>
      {rightElement || (showChevron && (
        <Ionicons name="chevron-forward" size={20} color="#374151" />
      ))}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, logout, deleteAccount, isGuest } = useAuth();
  const { isSubscribed, isLoading: subscriptionLoading, handleRestore } = useSubscription();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const available = await isBiometricAvailable();
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkBiometrics();
    setRefreshing(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    hapticWarning();
    Alert.alert(
      'Delete Account',
      'This action is permanent. All your data will be erased and cannot be recovered. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => setShowDeleteModal(true) },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    hapticMedium();
    const success = await handleRestore();
    Alert.alert(
      success ? 'Success' : 'Not Found',
      success ? 'Purchases restored!' : 'No previous purchases found.'
    );
  };

  const handleExportData = async () => {
    if (!isSubscribed) {
      Alert.alert(
        'Premium Feature',
        'CSV export is available for Premium subscribers only. Would you like to upgrade?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(protected)/paywall' as any) },
        ]
      );
      return;
    }

    setIsExporting(true);

    try {
      const response = await api.get('/export/csv', {
        responseType: 'blob',
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `ecomonitor-export-${timestamp}.csv`;
      const filePath = `${(FileSystem as any).cacheDirectory}${fileName}`;

      const blobData = response.data as Blob;
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Content = result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blobData);
      });

      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });

      hapticSuccess();

      await shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export EcoMonitor Data',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error: any) {
      hapticError();

      if (error.response?.data?.code === 'PREMIUM_REQUIRED') {
        Alert.alert(
          'Premium Required',
          'CSV export is a premium feature. Upgrade to export your environmental monitoring data.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/(protected)/paywall' as any) },
          ]
        );
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to export your data. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <ScrollView className="flex-1">
          <View className="px-6 pt-6 pb-4">
            <Text className="text-3xl font-bold text-white">Settings</Text>
          </View>

          {/* Profile */}
          <View className="items-center pt-4 pb-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
            >
              <Ionicons name="person" size={40} color="#10b981" />
            </View>
            <Text className="text-xl font-bold text-white">Guest</Text>
            <Pressable
              className="mt-3 rounded-full px-6 py-2"
              style={{ backgroundColor: '#10b981' }}
              onPress={() => {
                hapticLight();
                router.push('/(auth)/register');
              }}
            >
              <Text className="text-white font-medium">Create Account</Text>
            </Pressable>
          </View>

          {/* Purchases */}
          <View className="px-6 pt-4 pb-2">
            <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              PURCHASES
            </Text>
          </View>
          <View className="mx-4 rounded-2xl" style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
            <SettingRow
              icon="card-outline"
              label="Restore Purchases"
              onPress={handleRestorePurchases}
            />
          </View>

          {/* Legal */}
          <View className="px-6 pt-6 pb-2">
            <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              LEGAL
            </Text>
          </View>
          <View className="mx-4 rounded-2xl" style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
            <SettingRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => {
                Linking.openURL('https://ecomonitor-ai.com/privacy').catch(() => {
                  Alert.alert('Privacy Policy', 'We respect your privacy and protect your data. Full policy available at ecomonitor-ai.com/privacy');
                });
              }}
            />
            <View style={{ height: 1, backgroundColor: '#1f2937', marginHorizontal: 16 }} />
            <SettingRow
              icon="reader-outline"
              label="Terms of Service"
              onPress={() => {
                Linking.openURL('https://ecomonitor-ai.com/terms').catch(() => {
                  Alert.alert('Terms of Service', 'By using EcoMonitor AI you agree to our terms. Full terms available at ecomonitor-ai.com/terms');
                });
              }}
            />
          </View>

          {/* App Info */}
          <View className="items-center py-8">
            <Text className="text-sm text-gray-500">EcoMonitor AI v1.0.0</Text>
            <Text className="text-xs text-gray-600 mt-1">Made with care for the planet</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
          />
        }
      >
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-white">Settings</Text>
        </View>

        {/* Profile Header */}
        <View className="items-center pt-4 pb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
          >
            <Ionicons name="person" size={40} color="#10b981" />
          </View>
          <Text className="text-xl font-bold text-white">{user?.email}</Text>
        </View>

        {/* Account Section */}
        <View className="px-6 pt-2 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            ACCOUNT
          </Text>
        </View>
        <View className="mx-4 rounded-2xl mb-3" style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
          <SettingRow
            icon="mail-outline"
            label="Email"
            sublabel={user?.email}
            onPress={() => {}}
            showChevron={false}
          />
          <View style={{ height: 1, backgroundColor: '#1f2937', marginHorizontal: 16 }} />
          <SettingRow
            icon="download-outline"
            iconColor="#0D9488"
            label="Export Data"
            sublabel={isSubscribed ? 'Download your monitoring data' : 'Premium only'}
            onPress={handleExportData}
            showChevron={!isExporting && isSubscribed}
            rightElement={
              isExporting ? (
                <ActivityIndicator size="small" color="#0D9488" />
              ) : !isSubscribed ? (
                <View className="bg-amber-900/30 px-2 py-1 rounded-md">
                  <Text className="text-xs font-semibold text-amber-400">PRO</Text>
                </View>
              ) : undefined
            }
          />
        </View>

        {/* Security Section */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            SECURITY
          </Text>
        </View>
        <View className="mx-4 rounded-2xl mb-3" style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
          {biometricType && (
            <>
              <SettingRow
                icon="finger-print"
                label={biometricType}
                sublabel={`Use ${biometricType} to unlock the app`}
                onPress={() => {
                  hapticLight();
                  setBiometricEnabled(!biometricEnabled);
                }}
                showChevron={false}
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={(val) => {
                      hapticLight();
                      setBiometricEnabled(val);
                    }}
                    trackColor={{ true: '#10b981', false: '#374151' }}
                  />
                }
              />
              <View style={{ height: 1, backgroundColor: '#1f2937', marginHorizontal: 16 }} />
            </>
          )}
          <SettingRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={() => {
              hapticMedium();
              logout();
            }}
          />
        </View>

        {/* Purchases Section */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            PURCHASES
          </Text>
        </View>
        <View className="mx-4 rounded-2xl mb-3" style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
          {!isSubscribed && (
            <>
              <SettingRow
                icon="diamond-outline"
                iconColor="#10b981"
                label="Upgrade to Pro"
                sublabel="Unlock all premium features"
                onPress={() => router.push('/(protected)/paywall' as any)}
              />
              <View style={{ height: 1, backgroundColor: '#1f2937', marginHorizontal: 16 }} />
            </>
          )}
          <SettingRow
            icon="card-outline"
            label="Restore Purchases"
            onPress={handleRestorePurchases}
          />
        </View>

        {/* Legal Section */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            LEGAL
          </Text>
        </View>
        <View className="mx-4 rounded-2xl mb-3" style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}>
          <SettingRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => {
              Linking.openURL('https://ecomonitor-ai.com/privacy').catch(() => {
                Alert.alert('Privacy Policy', 'We respect your privacy and protect your data. Full policy available at ecomonitor-ai.com/privacy');
              });
            }}
          />
          <View style={{ height: 1, backgroundColor: '#1f2937', marginHorizontal: 16 }} />
          <SettingRow
            icon="reader-outline"
            label="Terms of Service"
            onPress={() => {
              Linking.openURL('https://ecomonitor-ai.com/terms').catch(() => {
                Alert.alert('Terms of Service', 'By using EcoMonitor AI you agree to our terms. Full terms available at ecomonitor-ai.com/terms');
              });
            }}
          />
        </View>

        {/* Danger Zone */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            DANGER ZONE
          </Text>
        </View>
        <View className="mx-4 rounded-2xl mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <SettingRow
            icon="trash-outline"
            iconColor="#ef4444"
            label="Delete Account"
            sublabel="Permanently remove all your data"
            onPress={confirmDelete}
            showChevron={false}
            destructive
          />
        </View>

        {/* App Info */}
        <View className="items-center py-8">
          <Text className="text-sm text-gray-500">EcoMonitor AI v1.0.0</Text>
          <Text className="text-xs text-gray-600 mt-1">Made with care for the planet</Text>
        </View>
      </ScrollView>

      <Modal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
        <Text className="mb-4 text-sm text-gray-400">
          Enter your password to confirm account deletion. This cannot be undone.
        </Text>
        <View className="mb-4">
          <Input
            placeholder="Your password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
          />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button title="Cancel" variant="outline" onPress={() => setShowDeleteModal(false)} />
          </View>
          <View className="flex-1">
            <Button
              title="Delete"
              variant="destructive"
              onPress={handleDeleteAccount}
              isLoading={isDeleting}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
