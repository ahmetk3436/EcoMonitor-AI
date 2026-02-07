import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { hapticLight, hapticSelection } from '../../lib/haptics';
import { shareAlert } from '../../lib/share';
import { recordDailyCheck, getStreakIcon, getStreakMessage } from '../../lib/streak';
import type { StreakData } from '../../lib/streak';
import Skeleton from '../../components/ui/Skeleton';

interface AlertItem {
  id: string;
  coordinate_id: string;
  latitude: number;
  longitude: number;
  change_type: string;
  confidence: number;
  detected_at: string;
  summary: string;
}

interface CoordItem {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
}

const CHANGE_ICONS: Record<string, string> = {
  construction: 'hammer',
  vegetation_loss: 'leaf',
  water_change: 'water',
  urban_expansion: 'business',
};

const CHANGE_COLORS: Record<string, string> = {
  construction: '#f59e0b',
  vegetation_loss: '#ef4444',
  water_change: '#3b82f6',
  urban_expansion: '#8b5cf6',
};

export default function HomeScreen() {
  const { user, isGuest, guestUsageCount } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [coordinates, setCoordinates] = useState<CoordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastCheckDate: null });

  const fetchData = async () => {
    try {
      const [alertsRes, coordsRes] = await Promise.all([
        api.get('/alerts', { params: { limit: 5 } }).catch(() => ({ data: { alerts: [] } })),
        api.get('/coordinates', { params: { limit: 5 } }).catch(() => ({ data: { coordinates: [] } })),
      ]);
      setAlerts(alertsRes.data?.alerts || []);
      setCoordinates(coordsRes.data?.coordinates || []);
    } catch {
      // silently handle errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      recordDailyCheck().then(setStreakData).catch(() => {});
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getConfidenceColor = (c: number) => {
    if (c > 0.8) return '#ef4444';
    if (c > 0.5) return '#f97316';
    return '#16a34a';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4">
          <Skeleton width="60%" height={32} borderRadius={8} />
          <Skeleton width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
        <View className="flex-row px-4 mb-6">
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, marginHorizontal: 8 }}>
              <Skeleton width="100%" height={100} borderRadius={16} />
            </View>
          ))}
        </View>
        <View className="px-4">
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <Skeleton width="100%" height={80} borderRadius={16} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-white">EcoMonitor AI</Text>
          <Text className="text-base text-gray-400 mt-1">
            {isGuest ? 'Environmental Intelligence Dashboard' : `Welcome, ${user?.email?.split('@')[0]}`}
          </Text>
        </View>

        {/* Guest Banner */}
        {isGuest && (
          <Pressable
            className="mx-4 mb-4 rounded-2xl p-4 flex-row items-center"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
            onPress={() => { hapticLight(); router.push('/(auth)/register'); }}
          >
            <Ionicons name="information-circle" size={24} color="#10b981" />
            <Text className="flex-1 text-emerald-400 ml-3 text-sm">
              {3 - guestUsageCount} free analyses remaining
            </Text>
            <Text className="text-emerald-400 font-semibold text-sm">Create Account</Text>
          </Pressable>
        )}

        {/* Streak Card */}
        <View
          className="mx-4 mb-4 rounded-2xl p-4 flex-row items-center justify-between"
          style={{
            backgroundColor: '#111827',
            borderWidth: 1,
            borderColor: '#1f2937',
          }}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={getStreakIcon(streakData.currentStreak) as any}
              size={32}
              color="#f97316"
            />
            <View className="ml-3">
              <Text className="text-2xl font-bold text-white">
                {streakData.currentStreak} {streakData.currentStreak === 1 ? 'day' : 'days'}
              </Text>
              <Text className="text-sm text-gray-400">
                {getStreakMessage(streakData.currentStreak)}
              </Text>
            </View>
          </View>
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)' }}>
            <Text className="text-orange-400 font-semibold text-xs">STREAK</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row px-4 mb-6">
          <View
            className="flex-1 mx-2 rounded-2xl p-4 items-center"
            style={{
              backgroundColor: '#111827',
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Ionicons name="location" size={28} color="#10b981" />
            <Text className="text-2xl font-bold text-white mt-2">{coordinates.length}</Text>
            <Text className="text-xs text-gray-400 mt-1">Locations</Text>
          </View>
          <View
            className="flex-1 mx-2 rounded-2xl p-4 items-center"
            style={{
              backgroundColor: '#111827',
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Ionicons name="notifications" size={28} color="#f97316" />
            <Text className="text-2xl font-bold text-white mt-2">{alerts.length}</Text>
            <Text className="text-xs text-gray-400 mt-1">Alerts</Text>
          </View>
          <View
            className="flex-1 mx-2 rounded-2xl p-4 items-center"
            style={{
              backgroundColor: '#111827',
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Ionicons name="analytics" size={28} color="#ef4444" />
            <Text className="text-2xl font-bold text-white mt-2">
              {alerts.filter((a) => a.confidence > 0.8).length}
            </Text>
            <Text className="text-xs text-gray-400 mt-1">Critical</Text>
          </View>
        </View>

        {/* Recent Alerts */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-white">Recent Alerts</Text>
            <Pressable onPress={() => { hapticSelection(); router.push('/(protected)/alerts' as any); }}>
              <Text className="text-emerald-400 text-sm font-medium">View All</Text>
            </Pressable>
          </View>
          {alerts.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center"
              style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}
            >
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text className="text-white font-semibold mt-3">No alerts - all clear</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Add locations on the map and run analysis to receive environmental alerts
              </Text>
            </View>
          ) : (
            alerts.slice(0, 3).map((alert) => (
              <View
                key={alert.id}
                className="rounded-2xl p-4 mb-3"
                style={{
                  backgroundColor: '#111827',
                  borderWidth: 1,
                  borderColor: '#1f2937',
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={(CHANGE_ICONS[alert.change_type] || 'alert-circle') as any}
                      size={20}
                      color={CHANGE_COLORS[alert.change_type] || '#6b7280'}
                    />
                    <Text className="ml-2 text-base font-semibold text-white">
                      {alert.change_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                  <Text
                    style={{ color: getConfidenceColor(alert.confidence) }}
                    className="text-sm font-bold"
                  >
                    {Math.round(alert.confidence * 100)}%
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs mb-2">
                  {new Date(alert.detected_at).toLocaleDateString()}
                </Text>
                <Text className="text-gray-300 text-sm" numberOfLines={2}>
                  {alert.summary}
                </Text>
                <Pressable
                  className="flex-row items-center mt-3"
                  onPress={() => {
                    hapticLight();
                    shareAlert({
                      id: alert.id,
                      coordinateId: alert.coordinate_id,
                      changeType: alert.change_type as any,
                      confidence: alert.confidence,
                      coordinates: { lat: alert.latitude, lng: alert.longitude, label: '' },
                      detectedAt: alert.detected_at,
                      summary: alert.summary,
                    });
                  }}
                >
                  <Ionicons name="share-outline" size={16} color="#6b7280" />
                  <Text className="text-gray-400 text-xs ml-1">Share</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Your Locations */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-white">Your Locations</Text>
            <Pressable onPress={() => { hapticSelection(); router.push('/(protected)/map' as any); }}>
              <Text className="text-emerald-400 text-sm font-medium">View All</Text>
            </Pressable>
          </View>
          {coordinates.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center"
              style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}
            >
              <Ionicons name="map-outline" size={48} color="#6b7280" />
              <Text className="text-white font-semibold mt-3">No locations yet</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Long press on the map to add your first monitoring location
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {coordinates.slice(0, 5).map((coord) => (
                <Pressable
                  key={coord.id}
                  className="rounded-2xl p-4 mr-3"
                  style={{
                    width: 160,
                    backgroundColor: '#111827',
                    borderWidth: 1,
                    borderColor: '#1f2937',
                  }}
                  onPress={() => { hapticSelection(); router.push('/(protected)/map' as any); }}
                >
                  <Ionicons name="location-outline" size={24} color="#10b981" />
                  <Text className="text-white font-semibold mt-2" numberOfLines={1}>
                    {coord.label}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {coord.latitude.toFixed(4)}, {coord.longitude.toFixed(4)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row px-4 mb-8">
          <Pressable
            className="flex-1 mx-2 rounded-2xl py-4 items-center flex-row justify-center"
            style={{ backgroundColor: '#10b981' }}
            onPress={() => { hapticLight(); router.push('/(protected)/map' as any); }}
          >
            <Ionicons name="map-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Add Location</Text>
          </Pressable>
          <Pressable
            className="flex-1 mx-2 rounded-2xl py-4 items-center flex-row justify-center"
            style={{ backgroundColor: '#10b981' }}
            onPress={() => { hapticLight(); router.push('/(protected)/alerts' as any); }}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View Alerts</Text>
          </Pressable>
        </View>

        {/* Sign Up CTA for guests */}
        {isGuest && (
          <Pressable
            className="mx-4 mb-8 rounded-xl bg-emerald-600 py-4 items-center"
            onPress={() => { hapticLight(); router.push('/(auth)/register'); }}
          >
            <Text className="text-base font-semibold text-white">Sign Up for Full Access</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
