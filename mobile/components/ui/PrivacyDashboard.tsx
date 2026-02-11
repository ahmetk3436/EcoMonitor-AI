import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';

interface DataPoint {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description?: string;
}

interface PrivacyDashboardProps {
  dataPoints: DataPoint[];
  onManageData?: () => void;
  onExportData?: () => void;
  onDeleteData?: () => void;
}

export default function PrivacyDashboard({
  dataPoints,
  onManageData,
  onExportData,
  onDeleteData,
}: PrivacyDashboardProps) {
  return (
    <ScrollView className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="px-6 pt-8 pb-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-3xl font-bold text-white">Privacy Dashboard</Text>
          <View className="px-3 py-1 rounded-full bg-emerald-500/20">
            <Text className="text-emerald-400 text-xs font-semibold">
              SECURE
            </Text>
          </View>
        </View>
        <Text className="text-gray-400 text-base">
          Your data is encrypted and never sold to third parties
        </Text>
      </View>

      {/* Privacy Score Card */}
      <View className="mx-4 mb-6">
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6"
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="shield-checkmark" size={32} color="#ffffff" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white text-2xl font-bold">
                Privacy Score: 95/100
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                Excellent - Your data is well protected
              </Text>
            </View>
          </View>

          <View className="flex-row mt-4">
            <View className="flex-1 bg-white/20 rounded-xl p-3 mr-2">
              <Text className="text-white text-xs text-center">
                Local Storage
              </Text>
              <Text className="text-white font-bold text-center text-sm mt-1">
                Encrypted
              </Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-3 ml-2">
              <Text className="text-white text-xs text-center">
                Cloud Backup
              </Text>
              <Text className="text-white font-bold text-center text-sm mt-1">
                Optional
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Data Collection Breakdown */}
      <View className="px-6 mb-6">
        <Text className="text-white font-semibold text-lg mb-4">
          Data We Collect
        </Text>
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
          {dataPoints.map((point, index) => (
            <View
              key={point.label}
              className={cn(
                'p-4 flex-row items-start',
                index !== dataPoints.length - 1 && 'border-b border-gray-800'
              )}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${point.color}20` }}
              >
                <Ionicons name={point.icon} size={20} color={point.color} />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-semibold">{point.label}</Text>
                  <Text className={cn('text-sm', point.color)}>{point.value}</Text>
                </View>
                {point.description && (
                  <Text className="text-gray-500 text-sm mt-1">
                    {point.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Data Usage */}
      <View className="px-6 mb-6">
        <Text className="text-white font-semibold text-lg mb-4">
          How We Use Your Data
        </Text>
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
          {[
            { icon: 'analytics-outline', text: 'Analyze environmental changes', color: '#8b5cf6' },
            { icon: 'location-outline', text: 'Provide location-based alerts', color: '#10b981' },
            { icon: 'cloud-upload-outline', text: 'Sync across your devices (optional)', color: '#3b82f6' },
            { icon: 'chatbubbles-outline', text: 'Provide customer support', color: '#f59e0b' },
          ].map((item, index) => (
            <View
              key={item.text}
              className={cn(
                'p-4 flex-row items-center',
                index !== 3 && 'border-b border-gray-800'
              )}
            >
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text className="text-gray-300 ml-3 flex-1">{item.text}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            </View>
          ))}
        </View>
      </View>

      {/* Third-Party Sharing */}
      <View className="px-6 mb-6">
        <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', borderWidth: 1 }}>
          <View className="flex-row items-start">
            <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold">
                We Never Sell Your Data
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                Your information is only used to provide our services. We do not sell, rent, or share your personal data with third parties for marketing purposes.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Data Management Actions */}
      <View className="px-6 mb-8">
        <Text className="text-white font-semibold text-lg mb-4">
          Your Data Rights
        </Text>
        <View className="space-y-3">
          <Pressable
            className="rounded-2xl p-4 flex-row items-center"
            style={{ backgroundColor: '#111827' }}
            onPress={onManageData}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#3b82f620' }}>
              <Ionicons name="settings-outline" size={20} color="#3b82f6" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold">Manage Data</Text>
              <Text className="text-gray-500 text-sm">Review and update your preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>

          <Pressable
            className="rounded-2xl p-4 flex-row items-center"
            style={{ backgroundColor: '#111827' }}
            onPress={onExportData}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#10b98120' }}>
              <Ionicons name="download-outline" size={20} color="#10b981" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold">Export Data</Text>
              <Text className="text-gray-500 text-sm">Download all your information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>

          <Pressable
            className="rounded-2xl p-4 flex-row items-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', borderWidth: 1 }}
            onPress={onDeleteData}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#ef444420' }}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-red-400 font-semibold">Delete All Data</Text>
              <Text className="text-gray-500 text-sm">Permanently remove your information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View className="items-center py-6">
        <Text className="text-gray-600 text-xs">
          Last updated: February 2026
        </Text>
        <Text className="text-gray-700 text-xs mt-1">
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
