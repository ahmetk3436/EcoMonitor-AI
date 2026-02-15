import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../lib/api';
import { hapticSelection, hapticError } from '../../lib/haptics';
import type { AnalysisHistory, PaginatedHistory } from '../../types/history';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (pageNum: number, replace = false) => {
    try {
      setError(null);
      const { data } = await api.get<PaginatedHistory>('/history', {
        params: { page: pageNum, limit: 20 },
      });
      if (replace) {
        setHistory(data.data || []);
      } else {
        setHistory((prev) => [...prev, ...(data.data || [])]);
      }
      setHasMore(pageNum < data.total_pages);
    } catch (err: any) {
      hapticError();
      setError('Failed to load analysis history. Pull to refresh or try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchHistory(1, true);
    }, [fetchHistory])
  );

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setPage(1);
    fetchHistory(1, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setError(null);
    setPage(1);
    fetchHistory(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore && !error) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c > 0.8) return '#ef4444';
    if (c > 0.5) return '#f97316';
    return '#10b981';
  };

  const renderItem = ({ item }: { item: AnalysisHistory }) => (
    <Pressable
      className="rounded-2xl p-4 mb-3 mx-4"
      style={{
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1f2937',
      }}
      onPress={() => hapticSelection()}
    >
      <View className="flex-row items-center mb-2">
        <Ionicons name="time-outline" size={16} color="#6b7280" />
        <Text className="text-gray-400 text-xs ml-1">
          {new Date(item.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Text className="text-lg font-semibold text-white" numberOfLines={1}>
        {item.coordinate_label || 'Unknown Location'}
      </Text>
      <Text className="text-sm text-gray-400 mt-1 capitalize">
        {item.analysis_type} analysis
      </Text>
      <View className="flex-row mt-3 items-center">
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
          <Text style={{ color: getConfidenceColor(item.confidence_avg) }} className="text-xs font-semibold">
            {Math.round(item.confidence_avg * 100)}% confidence
          </Text>
        </View>
        <Text className="text-gray-400 text-xs ml-3">
          {item.change_count} {item.change_count === 1 ? 'change' : 'changes'} detected
        </Text>
      </View>
      {item.result_summary ? (
        <Text className="text-gray-500 text-xs mt-2" numberOfLines={2}>
          {item.result_summary}
        </Text>
      ) : null}
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: '#1f2937' }}>
          <Text className="text-3xl font-bold text-white">History</Text>
          <Text className="text-sm text-gray-400 mt-1">Your analysis history</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && history.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-white">Analysis History</Text>
          <Text className="text-gray-400 mt-1">Your past environmental analyses</Text>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="time-outline" size={64} color="#ef4444" />
          <Text className="text-lg font-semibold text-white mt-4">Failed to Load History</Text>
          <Text className="text-sm text-gray-400 mt-2 text-center">{error}</Text>
          <Pressable
            className="rounded-2xl px-8 py-3 mt-6"
            style={{ backgroundColor: '#10b981' }}
            onPress={handleRetry}
          >
            <Text className="text-white font-semibold text-base">Retry</Text>
          </Pressable>
          <Text className="text-xs text-gray-500 mt-4 text-center">
            Pull down to refresh or tap retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <View className="px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: '#1f2937' }}>
        <Text className="text-3xl font-bold text-white">History</Text>
        <Text className="text-sm text-gray-400 mt-1">Your analysis history</Text>
      </View>
      {/* Inline error banner for refresh failures when history exists */}
      {error && history.length > 0 && (
        <View className="mx-6 mb-4 mt-4 bg-red-900/30 border border-red-500/50 rounded-2xl p-4 flex-row items-center">
          <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
          <View className="flex-1 ml-3">
            <Text className="text-white font-medium">Refresh Failed</Text>
            <Text className="text-gray-400 text-sm">Pull down to try again</Text>
          </View>
          <Pressable
            className="bg-red-500/20 rounded-xl px-3 py-2"
            onPress={handleRetry}
          >
            <Text className="text-red-400 font-medium text-sm">Retry</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#10b981" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-8 mt-20">
            <Ionicons name="file-tray-outline" size={64} color="#374151" />
            <Text className="text-xl font-semibold text-white mt-6">
              No analysis history yet
            </Text>
            <Text className="text-base text-gray-400 mt-2 text-center">
              Analyze a location to see results here
            </Text>
            <Pressable
              className="mt-6 rounded-2xl px-8 py-3 flex-row items-center"
              style={{ backgroundColor: '#10b981' }}
              onPress={() => router.push('/(protected)/map' as any)}
            >
              <Ionicons name="map-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Go to Map</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}
