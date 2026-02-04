import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import api from '../../lib/api';
import { hapticSuccess } from '../../lib/haptics';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { SatelliteAlert, ChangeType, AnalyzeResponse } from '../../types/satellite';

const CHANGE_ICONS: Record<ChangeType, keyof typeof Ionicons.glyphMap> = {
  construction: 'hammer',
  vegetation_loss: 'leaf',
  water_change: 'water',
  urban_expansion: 'business',
};

const getConfidenceColor = (confidence: number) => {
  if (confidence > 80) return '#dc2626';
  if (confidence > 50) return '#f97316';
  return '#16a34a';
};

export default function AlertsScreen() {
  const { isSubscribed } = useSubscription();
  const [alerts, setAlerts] = useState<SatelliteAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const { data } = await api.get<SatelliteAlert[]>('/satellite/alerts');
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleAnalyze = async (coordinateId: string) => {
    if (!isSubscribed) {
      router.push('/(protected)/paywall');
      return;
    }
    setAnalyzingId(coordinateId);
    try {
      const { data } = await api.post<AnalyzeResponse>(
        `/coordinates/${coordinateId}/analyze`,
      );
      if (data.success) {
        hapticSuccess();
        fetchAlerts();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const renderAlertItem = ({ item }: { item: SatelliteAlert }) => (
    <View className="bg-white rounded-xl p-4 mb-3 mx-4 border border-gray-200">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Ionicons
            name={CHANGE_ICONS[item.changeType] ?? 'alert-circle'}
            size={24}
            color="#4b5563"
          />
          <Text className="ml-2 text-lg font-semibold text-gray-900">
            {item.changeType.replace('_', ' ')}
          </Text>
        </View>
        <Text
          style={{ color: getConfidenceColor(item.confidence) }}
          className="text-lg font-bold"
        >
          {item.confidence}%
        </Text>
      </View>

      <View className="flex-row items-center mb-1">
        <Ionicons name="location-outline" size={16} color="#6b7280" />
        <Text className="text-gray-600 ml-1">{item.coordinates.label}</Text>
      </View>

      <Text className="text-gray-400 text-sm mb-2">
        Detected: {new Date(item.detectedAt).toLocaleDateString()}
      </Text>

      <Text className="text-gray-700 mb-4">{item.summary}</Text>

      <TouchableOpacity
        className="bg-blue-600 py-2.5 rounded-lg flex-row items-center justify-center"
        style={analyzingId === item.coordinateId ? { opacity: 0.7 } : undefined}
        onPress={() => handleAnalyze(item.coordinateId)}
        disabled={analyzingId === item.coordinateId}
      >
        {analyzingId === item.coordinateId ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="analytics-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Analyze</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-400 text-lg mt-4">No alerts found</Text>
          </View>
        }
      />
    </View>
  );
}
