import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticLight, hapticSelection } from '../../lib/haptics';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { shareAlert, shareAnalysisSummary } from '../../lib/share';
import Skeleton from '../../components/ui/Skeleton';
import type { SatelliteAlert, ChangeType } from '../../types/satellite';

const CHANGE_ICONS: Record<ChangeType, keyof typeof Ionicons.glyphMap> = {
  construction: 'hammer',
  vegetation_loss: 'leaf',
  water_change: 'water',
  urban_expansion: 'business',
  deforestation: 'leaf',
  pollution: 'cloud',
  flooding: 'rainy',
  erosion: 'layers',
  wildfire_risk: 'flame',
  biodiversity_loss: 'paw',
};

const CHANGE_BORDER_COLORS: Record<string, string> = {
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

const CHANGE_BG_COLORS: Record<string, string> = {
  urban_expansion: '#eef2ff',
  vegetation_loss: '#fef2f2',
  water_change: '#f0f9ff',
  construction: '#fffbeb',
  deforestation: '#fef3c7',
  pollution: '#f3f4f6',
  flooding: '#f0f9ff',
  erosion: '#fef9c3',
  wildfire_risk: '#fef2f2',
  biodiversity_loss: '#f0fdf4',
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

const getSeverityBorderColor = (severity: string): string => {
  const borderColors: Record<string, string> = {
    critical: '#fecaca',
    high: '#fed7aa',
    medium: '#fef08a',
    low: '#bbf7d0',
  };
  return borderColors[severity] || '#e5e7eb';
};

const getConfidenceColor = (confidence: number) => {
  if (confidence > 0.8) return '#ef4444';
  if (confidence > 0.5) return '#f97316';
  return '#10b981';
};

export default function AlertsScreen() {
  const { isSubscribed } = useSubscription();
  const { isGuest, canUseFeature, incrementGuestUsage } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<SatelliteAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);

  const fetchAlerts = async () => {
    try {
      setError(null);
      const { data } = await api.get('/alerts');
      setAlerts(data?.alerts || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load alerts. Please try again.';
      setError(msg);
      hapticError();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleAnalyze = async (coordinateId: string) => {
    // Guest check
    if (isGuest && !canUseFeature()) {
      Alert.alert(
        'Free Limit Reached',
        'Create an account to continue analyzing locations',
        [
          { text: 'Sign Up', onPress: () => router.push('/(auth)/register') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!isSubscribed && !isGuest) {
      router.push('/(protected)/paywall' as any);
      return;
    }

    hapticSelection();
    setAnalyzingId(coordinateId);

    // Initialize streaming progress
    setAnalysisProgress(['Connecting to satellite data...']);

    // Schedule progress updates
    const timer1 = setTimeout(() => {
      setAnalysisProgress(prev => [...prev, 'Analyzing land use patterns...']);
    }, 800);

    const timer2 = setTimeout(() => {
      setAnalysisProgress(prev => [...prev, 'Detecting environmental changes...']);
    }, 1600);

    const timer3 = setTimeout(() => {
      setAnalysisProgress(prev => [...prev, 'Calculating confidence scores...']);
    }, 2400);

    try {
      await api.post(`/coordinates/${coordinateId}/analyze`);
      if (isGuest) {
        await incrementGuestUsage();
      }

      // Clear timers and show completion
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setAnalysisProgress(prev => [...prev, 'Analysis complete!']);
      hapticSuccess();

      // Clear progress after delay, then fetch updated alerts
      setTimeout(async () => {
        setAnalysisProgress([]);
        setAnalyzingId(null);
        await fetchAlerts();

        if (!isSubscribed && !isGuest) {
          Alert.alert(
            'Analysis Complete!',
            `You found ${alerts.length} environmental changes! Upgrade to Pro for unlimited analyses, CSV exports, and priority alerts.`,
            [
              {
                text: 'Upgrade Now',
                onPress: () => {
                  hapticSelection();
                  router.push('/(protected)/paywall' as any);
                },
              },
              {
                text: 'Share Results',
                onPress: () => shareAnalysisSummary('Location', alerts.length, 75),
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => hapticLight(),
              },
            ]
          );
        } else {
          Alert.alert('Analysis Complete', 'Share your findings?', [
            {
              text: 'Share',
              onPress: () => shareAnalysisSummary('Location', alerts.length, 75),
            },
            { text: 'Later', style: 'cancel' },
          ]);
        }
      }, 1000);

    } catch (err: any) {
      // Clear all pending timers on error
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      // Clear progress state
      setAnalysisProgress([]);
      setAnalyzingId(null);

      hapticError();
      const errorMessage = err.response?.data?.message || 'Analysis failed. Please try again.';
      if (errorMessage.includes('not configured')) {
        Alert.alert(
          'Service Unavailable',
          'AI analysis service is not configured. Please contact support.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('not found')) {
        Alert.alert('Not Found', 'Coordinate not found or you don\'t have access to it.');
      } else {
        Alert.alert('Analysis Failed', errorMessage);
      }
    }
  };

  const renderAlertItem = ({ item }: { item: SatelliteAlert }) => {
    const changeLabel = item.changeType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const confidencePercent = Math.round(item.confidence * 100);
    const borderColor = CHANGE_BORDER_COLORS[item.changeType] || '#374151';

    return (
      <View
        className="rounded-2xl p-4 mb-3 mx-4"
        style={{
          backgroundColor: '#111827',
          borderWidth: 1,
          borderColor: '#1f2937',
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Ionicons
              name={CHANGE_ICONS[item.changeType] ?? 'alert-circle'}
              size={24}
              color={borderColor}
            />
            <Text className="ml-2 text-lg font-semibold text-white">
              {changeLabel}
            </Text>
          </View>
          <Text
            style={{ color: getConfidenceColor(item.confidence) }}
            className="text-lg font-bold"
          >
            {confidencePercent}%
          </Text>
        </View>

        <View className="flex-row items-center mb-1">
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text className="text-gray-400 ml-1">{item.coordinates?.label || 'Unknown'}</Text>
        </View>

        <Text className="text-gray-500 text-sm mb-2">
          Detected: {new Date(item.detectedAt).toLocaleDateString()}
        </Text>

        {/* Badges Row */}
        <View className="flex-row items-center flex-wrap gap-2 mb-3">
          <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: CHANGE_BG_COLORS[item.changeType] || '#f3f4f6' }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: borderColor }}
            >
              {confidencePercent}% confidence
            </Text>
          </View>
          {item.severity && (
            <View
              className="px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: getSeverityBgColor(item.severity),
                borderColor: getSeverityBorderColor(item.severity),
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: getSeverityColor(item.severity) }}
              >
                {item.severity.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-gray-300 mb-4">{item.summary}</Text>

        <View className="flex-row">
          <Pressable
            className="flex-1 py-2.5 rounded-xl flex-row items-center justify-center mr-2"
            style={{
              backgroundColor: '#10b981',
              opacity: analyzingId === item.coordinateId ? 0.7 : 1,
            }}
            onPress={() => handleAnalyze(item.coordinateId)}
            disabled={analyzingId === item.coordinateId}
          >
            {analyzingId === item.coordinateId ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Analyze</Text>
              </>
            )}
          </Pressable>
          <Pressable
            className="flex-row items-center justify-center rounded-xl py-2.5 px-4"
            style={{ backgroundColor: '#1f2937' }}
            onPress={() => {
              hapticLight();
              shareAlert(item);
            }}
          >
            <Ionicons name="share-outline" size={18} color="#9ca3af" />
            <Text className="text-gray-400 font-medium ml-2">Share</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: '#1f2937' }}>
          <Text className="text-3xl font-bold text-white">Alerts</Text>
          <Text className="text-sm text-gray-400 mt-1">Environmental change detection</Text>
        </View>
        <View className="px-4 pt-4">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <Skeleton width="100%" height={160} borderRadius={16} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: '#1f2937' }}>
          <Text className="text-3xl font-bold text-white">Alerts</Text>
          <Text className="text-sm text-gray-400 mt-1">Environmental change detection</Text>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="cloud-offline-outline" size={64} color="#ef4444" />
          <Text className="text-lg font-semibold text-white mt-4">Failed to load alerts</Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">{error}</Text>
          <Pressable
            className="rounded-2xl px-8 py-3 mt-6"
            style={{ backgroundColor: '#10b981' }}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchAlerts();
            }}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <View className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: '#1f2937' }}>
        <Text className="text-3xl font-bold text-white">Alerts</Text>
        <Text className="text-sm text-gray-400 mt-1">Environmental change detection</Text>
      </View>
      <View className="flex-1 relative">
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#10b981"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center px-8 mt-20">
              <Ionicons name="earth-outline" size={80} color="#374151" />
              <Text className="text-xl font-semibold text-white mt-6">No Alerts Yet</Text>
              <Text className="text-base text-gray-400 mt-2 text-center">
                Add locations on the map and run satellite analysis to receive environmental change alerts
              </Text>
              <Pressable
                className="rounded-2xl px-8 py-3 mt-6 flex-row items-center"
                style={{ backgroundColor: '#10b981' }}
                onPress={() => router.push('/(protected)/map' as any)}
              >
                <Ionicons name="map-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Go to Map</Text>
              </Pressable>
            </View>
          }
        />

        {/* Analysis Progress Modal Overlay */}
        {analysisProgress.length > 0 && (
          <View
            className="absolute inset-0 z-50 justify-center items-center px-8"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <View
              className="bg-gray-900 rounded-2xl p-6 w-full border border-gray-800"
              style={{
                maxWidth: 340,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Modal Header with ActivityIndicator */}
              <View className="items-center mb-5">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
                >
                  <ActivityIndicator size="large" color="#10b981" />
                </View>
                <Text className="text-lg font-bold text-white">AI Analysis Running</Text>
                <Text className="text-sm text-gray-500 mt-1">Processing environmental data</Text>
              </View>

              {/* Progress Steps List */}
              <View className="rounded-xl p-4" style={{ backgroundColor: 'rgba(31,41,55,0.5)' }}>
                {analysisProgress.map((step, index) => {
                  const isLast = index === analysisProgress.length - 1;

                  return (
                    <View
                      key={index}
                      className="flex-row items-center py-2"
                      style={{ opacity: isLast ? 1 : 0.8 }}
                    >
                      {/* Status Icon */}
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor: isLast
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        {isLast ? (
                          <ActivityIndicator size="small" color="#f59e0b" />
                        ) : (
                          <Ionicons name="checkmark" size={12} color="#10b981" />
                        )}
                      </View>

                      {/* Step Text */}
                      <Text
                        className="text-sm flex-1"
                        style={{
                          color: isLast ? '#f59e0b' : '#d1d5db',
                          fontWeight: isLast ? '600' : '400',
                        }}
                      >
                        {step}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Animated Dots Indicator */}
              <View className="flex-row justify-center mt-4">
                {[0, 1, 2].map((dot) => (
                  <View
                    key={dot}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    style={{
                      opacity: 0.3 + (dot * 0.3),
                      marginHorizontal: 2,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
