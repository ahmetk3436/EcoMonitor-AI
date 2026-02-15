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
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { hapticLight, hapticSelection, hapticError } from '../../lib/haptics';
import { shareAlert } from '../../lib/share';
import { recordDailyCheck, getStreakIcon, getStreakMessage } from '../../lib/streak';
import type { StreakData } from '../../lib/streak';
import { StatsCardSkeleton, ListItemSkeleton } from '../../components/ui/EnhancedSkeleton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AlertItem {
  id: string;
  coordinate_id: string;
  latitude: number;
  longitude: number;
  change_type: string;
  confidence: number;
  detected_at: string;
  summary: string;
  severity?: string;
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
  deforestation: 'cut',
  pollution: 'cloud',
  flooding: 'rainy',
  erosion: 'trending-down',
  wildfire_risk: 'flame',
  biodiversity_loss: 'bug',
};

const CHANGE_COLORS: Record<string, string> = {
  construction: '#f59e0b',
  vegetation_loss: '#ef4444',
  water_change: '#3b82f6',
  urban_expansion: '#8b5cf6',
  deforestation: '#b45309',
  pollution: '#6b7280',
  flooding: '#0ea5e9',
  erosion: '#a16207',
  wildfire_risk: '#dc2626',
  biodiversity_loss: '#15803d',
};

const getSeverityColor = (severity: string): string => {
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };
  return severityColors[severity] || '#6b7280';
};

const getSeverityBgColor = (severity: string): string => {
  const bgColors: Record<string, string> = {
    critical: '#fef2f2',
    high: '#fff7ed',
    medium: '#fefce8',
    low: '#f0fdf4',
  };
  return bgColors[severity] || '#f3f4f6';
};

const getScoreColor = (score: number): string => {
  if (score > 75) return '#10b981';
  if (score > 40) return '#f59e0b';
  return '#ef4444';
};

const getScoreLabel = (score: number): string => {
  if (score > 75) return 'Excellent';
  if (score > 40) return 'Good';
  return 'Building';
};

// Animated stat card component
function AnimatedStatCard({
  icon,
  value,
  label,
  color,
  onPress,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95);
    hapticLight();
    onPress();
    setTimeout(() => {
      scale.value = withSpring(1);
    }, 100);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={animatedStyle}
      className="flex-1 mx-2"
    >
      <View
        className="rounded-2xl p-4 items-center border-2 border-gray-800"
        style={{ backgroundColor: '#111827' }}
      >
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <Text className="text-2xl font-bold text-white mt-3">{value}</Text>
        <Text className="text-xs text-gray-400 mt-1">{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

// Gradient streak card
function GradientStreakCard({ streakData, onPress }: { streakData: StreakData; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getStreakGradient = (streak: number) => {
    if (streak >= 30) return ['#fbbf24', '#f97316'] as const;
    if (streak >= 14) return ['#a855f7', '#8b5cf6'] as const;
    if (streak >= 7) return ['#fbbf24', '#d97706'] as const;
    if (streak >= 3) return ['#e5e7eb', '#9ca3af'] as const;
    return ['#10b981', '#059669'] as const;
  };

  const colors = getStreakGradient(streakData.currentStreak);

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(0.97);
        hapticLight();
        onPress();
        setTimeout(() => {
          scale.value = withSpring(1);
        }, 100);
      }}
      style={animatedStyle}
      className="mx-4 mb-4 overflow-hidden rounded-2xl"
    >
      <LinearGradient
        colors={colors as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Ionicons
              name={getStreakIcon(streakData.currentStreak) as any}
              size={28}
              color="#ffffff"
            />
          </View>
          <View className="ml-3">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-white">
                {streakData.currentStreak}
              </Text>
              <Text className="text-white/80 text-sm ml-1">
                {streakData.currentStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <Text className="text-white/70 text-xs mt-0.5">
              {getStreakMessage(streakData.currentStreak)}
            </Text>
          </View>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
        >
          <Text className="text-white font-bold text-xs tracking-wider">STREAK</Text>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const { user, isGuest, guestUsageCount } = useAuth();
  const { isSubscribed } = useSubscription();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [coordinates, setCoordinates] = useState<CoordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastCheckDate: null });
  const [impactScore, setImpactScore] = useState(0);

  const fetchData = async () => {
    try {
      setError(null);
      const [alertsRes, coordsRes] = await Promise.all([
        api.get('/alerts', { params: { limit: 5 } }),
        api.get('/coordinates', { params: { limit: 5 } }),
      ]);
      const alertsData = alertsRes.data?.alerts || [];
      const coordsData = coordsRes.data?.coordinates || [];
      setAlerts(alertsData);
      setCoordinates(coordsData);

      // Calculate impact score after streak data is available
      let currentStreak = streakData.currentStreak;
      try {
        const freshStreak = await recordDailyCheck();
        setStreakData(freshStreak);
        currentStreak = freshStreak.currentStreak;
      } catch {
        // Keep existing streak data
      }

      // Calculate Environmental Impact Score
      try {
        const locationPoints = coordsData.length * 10;
        const alertPoints = alertsData.length * 5;
        const criticalBonus = alertsData.filter((a: AlertItem) => a.confidence > 0.8).length * 15;
        const streakBonus = currentStreak * 2;
        const calculatedScore = Math.min(100, locationPoints + alertPoints + criticalBonus + streakBonus);
        setImpactScore(calculatedScore);
      } catch (calcError) {
        console.error('Score calculation error:', calcError);
        setImpactScore(0);
      }
    } catch (err: any) {
      hapticError();
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchData();
  };

  const getConfidenceColor = (c: number) => {
    if (c > 0.8) return '#ef4444';
    if (c > 0.5) return '#f97316';
    return '#10b981';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4">
          <View className="h-8 w-48 bg-gray-800 rounded-lg mb-2" />
          <View className="h-4 w-64 bg-gray-800 rounded" />
        </View>
        <View className="px-4 mb-6">
          <View className="h-24 bg-gray-900 rounded-2xl" />
        </View>
        <View className="flex-row px-4 mb-6">
          {[0, 1, 2].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </View>
        <View className="px-6">
          <View className="h-5 w-32 bg-gray-800 rounded-lg mb-3" />
          {[0, 1, 2].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-white">EcoMonitor AI</Text>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="cloud-offline-outline" size={64} color="#ef4444" />
          <Text className="text-lg font-semibold text-white mt-4">Connection Error</Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">{error}</Text>
          <Pressable
            className="rounded-2xl px-8 py-3 mt-6"
            style={{ backgroundColor: '#10b981' }}
            onPress={handleRetry}
          >
            <Text className="text-white font-semibold text-base">Retry</Text>
          </Pressable>
          <Text className="text-xs text-gray-500 mt-4 text-center">
            Check your internet connection and try again
          </Text>
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
        {/* Header with gradient text effect */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-white">EcoMonitor AI</Text>
          <Text className="text-base text-gray-400 mt-1">
            {isGuest ? 'Environmental Intelligence Dashboard' : `Welcome, ${user?.email?.split('@')[0]}`}
          </Text>
        </View>

        {/* Guest Banner with gradient border */}
        {isGuest && (
          <Pressable
            className="mx-4 mb-4 rounded-2xl p-4 flex-row items-center border-2"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
            onPress={() => { hapticLight(); router.push('/(auth)/register'); }}
          >
            <Ionicons name="information-circle" size={24} color="#10b981" />
            <Text className="flex-1 text-emerald-400 ml-3 text-sm">
              {3 - guestUsageCount} free analyses remaining
            </Text>
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#10b981' }}
            >
              <Text className="text-white font-semibold text-xs">Create Account</Text>
            </View>
          </Pressable>
        )}

        {/* Streak Card with gradient */}
        <GradientStreakCard
          streakData={streakData}
          onPress={() => {
            hapticSelection();
            // Navigate to streak details or gamification screen
          }}
        />

        {/* Pro Tip Banner for non-subscribed users */}
        {!isSubscribed && !isGuest && (
          <Pressable
            className="mx-4 mb-4 rounded-2xl p-4 overflow-hidden active:opacity-90"
            onPress={() => {
              hapticLight();
              router.push('/(protected)/paywall' as any);
            }}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed'] as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute inset-0"
            />
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                <Ionicons name="diamond" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-bold text-base">Unlock Pro Features</Text>
                <Text className="text-white/70 text-xs mt-0.5">Unlimited analyses, exports & priority alerts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </Pressable>
        )}

        {/* Environmental Impact Score Card */}
        <View className="mx-4 mb-4 rounded-2xl p-4 border-2 border-gray-800" style={{ backgroundColor: '#111827' }}>
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-2">
                <Ionicons name="trophy" size={16} color="#fbbf24" />
              </View>
              <Text className="text-base font-bold text-white">Environmental Impact Score</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-3xl font-bold text-white">{impactScore}</Text>
              <Text className="text-gray-400 text-lg ml-1">/100</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-3 rounded-full bg-gray-800 overflow-hidden mb-2">
            <View
              className="h-full rounded-full"
              style={{
                width: `${impactScore}%`,
                backgroundColor: getScoreColor(impactScore),
              }}
            />
          </View>

          {/* Score Label */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-gray-500">Your Impact Level</Text>
            <Text
              className="text-xs font-semibold"
              style={{ color: getScoreColor(impactScore) }}
            >
              {getScoreLabel(impactScore)}
            </Text>
          </View>

          {/* Score Breakdown */}
          <View className="bg-gray-900/50 rounded-xl p-3 mb-2">
            <Text className="text-xs text-gray-400 mb-2 font-medium">Score Breakdown</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-500">Locations Monitored</Text>
              <Text className="text-xs text-emerald-400">+{coordinates.length * 10} pts</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-500">Alerts Detected</Text>
              <Text className="text-xs text-amber-400">+{alerts.length * 5} pts</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-gray-500">Critical Findings</Text>
              <Text className="text-xs text-red-400">+{alerts.filter((a: AlertItem) => a.confidence > 0.8).length * 15} pts</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">Daily Streak Bonus</Text>
              <Text className="text-xs text-purple-400">+{streakData.currentStreak * 2} pts</Text>
            </View>
          </View>

          {/* Motivational Text */}
          <Text className="text-xs text-gray-500 leading-4">
            Monitor more locations and maintain your daily streak to increase your environmental impact score.
          </Text>
        </View>

        {/* Stats Row with animated cards */}
        <View className="flex-row px-4 mb-6">
          <AnimatedStatCard
            icon="location"
            value={coordinates.length}
            label="Locations"
            color="#10b981"
            onPress={() => {
              hapticSelection();
              router.push('/(protected)/map' as any);
            }}
          />
          <AnimatedStatCard
            icon="notifications"
            value={alerts.length}
            label="Alerts"
            color="#f97316"
            onPress={() => {
              hapticSelection();
              router.push('/(protected)/alerts' as any);
            }}
          />
          <AnimatedStatCard
            icon="analytics"
            value={alerts.filter((a) => a.confidence > 0.8).length}
            label="Critical"
            color="#ef4444"
            onPress={() => {
              hapticSelection();
              router.push('/(protected)/alerts' as any);
            }}
          />
        </View>

        {/* Recent Alerts */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-white">Recent Alerts</Text>
            <Pressable onPress={() => { hapticSelection(); router.push('/(protected)/alerts' as any); }}>
              <Text className="text-purple-400 text-sm font-medium">View All</Text>
            </Pressable>
          </View>
          {alerts.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center border-2 border-gray-800"
              style={{ backgroundColor: '#111827' }}
            >
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text className="text-white font-semibold mt-3">No alerts - all clear</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Add locations on the map and run analysis to receive environmental alerts
              </Text>
            </View>
          ) : (
            alerts.slice(0, 3).map((alert) => (
              <Pressable
                key={alert.id}
                className="rounded-2xl p-4 mb-3 border-2 border-gray-800"
                style={{ backgroundColor: '#111827' }}
                onPress={() => {
                  hapticSelection();
                  // Navigate to alert details
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${CHANGE_COLORS[alert.change_type]}20` }}
                    >
                      <Ionicons
                        name={(CHANGE_ICONS[alert.change_type] || 'alert-circle') as any}
                        size={18}
                        color={CHANGE_COLORS[alert.change_type] || '#6b7280'}
                      />
                    </View>
                    <Text className="ml-2 text-base font-semibold text-white">
                      {alert.change_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${getConfidenceColor(alert.confidence)}20` }}
                    >
                      <Text
                        style={{ color: getConfidenceColor(alert.confidence) }}
                        className="text-xs font-bold"
                      >
                        {Math.round(alert.confidence * 100)}%
                      </Text>
                    </View>
                    {alert.severity && (
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: getSeverityBgColor(alert.severity) }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: getSeverityColor(alert.severity) }}
                        >
                          {alert.severity.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text className="text-gray-500 text-xs mb-2">
                  {new Date(alert.detected_at).toLocaleDateString()}
                </Text>
                <Text className="text-gray-300 text-sm" numberOfLines={2}>
                  {alert.summary}
                </Text>
                <View className="flex-row items-center mt-3 justify-between">
                  <Pressable
                    className="flex-row items-center px-3 py-1.5 rounded-full border border-gray-700"
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
                        severity: (alert.severity as any) || 'medium',
                      });
                    }}
                  >
                    <Ionicons name="share-outline" size={14} color="#9ca3af" />
                    <Text className="text-gray-400 text-xs ml-1">Share</Text>
                  </Pressable>
                  <Pressable
                    className="flex-row items-center px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: '#8b5cf650' }}
                    onPress={() => {
                      hapticSelection();
                      router.push({
                        pathname: '/(protected)/alert-detail' as any,
                        params: {
                          id: alert.id,
                          coordinateId: alert.coordinate_id,
                          changeType: alert.change_type,
                          confidence: String(Math.round(alert.confidence * 100)),
                          latitude: String(alert.latitude),
                          longitude: String(alert.longitude),
                          summary: alert.summary,
                          detectedAt: alert.detected_at,
                          severity: (alert as any).severity || 'medium',
                          label: ''
                        }
                      });
                    }}
                  >
                    <Ionicons name="arrow-forward" size={14} color="#8b5cf6" />
                    <Text className="text-purple-400 text-xs ml-1 font-medium">Details</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Your Locations */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-white">Your Locations</Text>
            <Pressable onPress={() => { hapticSelection(); router.push('/(protected)/map' as any); }}>
              <Text className="text-purple-400 text-sm font-medium">View All</Text>
            </Pressable>
          </View>
          {coordinates.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center border-2 border-gray-800"
              style={{ backgroundColor: '#111827' }}
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
                  className="rounded-2xl p-4 mr-3 border-2 border-gray-800"
                  style={{
                    width: 160,
                    backgroundColor: '#111827',
                  }}
                  onPress={() => { hapticSelection(); router.push('/(protected)/map' as any); }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#10b98120' }}
                  >
                    <Ionicons name="location-outline" size={20} color="#10b981" />
                  </View>
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

        {/* Quick Actions with gradient */}
        <View className="flex-row px-4 mb-8">
          <Pressable
            className="flex-1 mx-2 rounded-2xl py-4 items-center flex-row justify-center overflow-hidden"
            onPress={() => { hapticLight(); router.push('/(protected)/map' as any); }}
          >
            <LinearGradient
              colors={['#10b981', '#059669'] as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
            >
              <Ionicons name="map-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Location</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            className="flex-1 mx-2 rounded-2xl py-4 items-center flex-row justify-center overflow-hidden"
            onPress={() => { hapticLight(); router.push('/(protected)/alerts' as any); }}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed'] as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
            >
              <Ionicons name="notifications-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">View Alerts</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Sign Up CTA for guests */}
        {isGuest && (
          <Pressable
            className="mx-4 mb-8 rounded-2xl py-4 items-center overflow-hidden"
            onPress={() => { hapticLight(); router.push('/(auth)/register'); }}
          >
            <LinearGradient
              colors={['#8b5cf6', '#ec4899'] as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full flex-row items-center justify-center py-4 rounded-2xl"
            >
              <Text className="text-base font-bold text-white">Sign Up for Full Access</Text>
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
