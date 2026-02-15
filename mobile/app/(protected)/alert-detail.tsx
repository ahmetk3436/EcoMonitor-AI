import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import { shareAlert } from '../../lib/share';
import api from '../../lib/api';

// Color mapping for change types
const CHANGE_COLORS: Record<string, string[]> = {
  'deforestation': ['#DC2626', '#991B1B'],
  'urban_expansion': ['#8B5CF6', '#6D28D9'],
  'water_body_change': ['#0EA5E9', '#0284C7'],
  'vegetation_loss': ['#F59E0B', '#D97706'],
  'agricultural_change': ['#84CC16', '#65A30D'],
  'flooding': ['#06B6D4', '#0891B2'],
  'drought': ['#F97316', '#EA580C'],
  'wildfire_damage': ['#EF4444', '#B91C1C'],
  'mining_activity': ['#A855F7', '#7C3AED'],
  'coastal_erosion': ['#14B8A6', '#0D9488'],
};

// Icon mapping for change types
const CHANGE_ICONS: Record<string, string> = {
  'deforestation': 'tree-outline',
  'urban_expansion': 'business-outline',
  'water_body_change': 'water-outline',
  'vegetation_loss': 'leaf-outline',
  'agricultural_change': 'grid-outline',
  'flooding': 'rainy-outline',
  'drought': 'sunny-outline',
  'wildfire_damage': 'flame-outline',
  'mining_activity': 'construct-outline',
  'coastal_erosion': 'beach-outline',
};

// Severity color mapping
const SEVERITY_COLORS: Record<string, string> = {
  'critical': '#EF4444',
  'high': '#F97316',
  'medium': '#EAB308',
  'low': '#22C55E',
};

// Severity descriptions
const SEVERITY_DESCRIPTIONS: Record<string, string> = {
  'critical': 'Immediate attention required',
  'high': 'Significant impact detected',
  'medium': 'Moderate changes observed',
  'low': 'Minor changes detected',
};

export default function AlertDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    coordinateId: string;
    changeType: string;
    confidence: string;
    latitude: string;
    longitude: string;
    summary: string;
    detectedAt: string;
    severity: string;
    label: string;
  }>();

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Extract params with defaults
  const {
    id = '',
    coordinateId = '',
    changeType = 'unknown',
    confidence = '0',
    latitude = '0',
    longitude = '0',
    summary = 'No analysis summary available.',
    detectedAt = new Date().toISOString(),
    severity = 'medium',
    label = '',
  } = params;

  // Helper functions
  const getChangeColors = (type: string): readonly [string, string] => {
    const colors = CHANGE_COLORS[type];
    if (colors && colors.length >= 2) return [colors[0], colors[1]] as const;
    return ['#6B7280', '#4B5563'] as const;
  };

  const getChangeIcon = (type: string): string => {
    return CHANGE_ICONS[type] || 'earth-outline';
  };

  const formatChangeType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSeverityColor = (sev: string): string => {
    return SEVERITY_COLORS[sev.toLowerCase()] || '#6B7280';
  };

  const getSeverityDescription = (sev: string): string => {
    return SEVERITY_DESCRIPTIONS[sev.toLowerCase()] || 'Change detected';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return 'Unknown date';
    }
  };

  const formatCoordinate = (value: string): string => {
    try {
      return parseFloat(value).toFixed(6);
    } catch {
      return '0.000000';
    }
  };

  // Action handlers
  const handleRunAnalysis = async (): Promise<void> => {
    hapticSelection();
    setIsAnalyzing(true);

    try {
      await api.post(`/coordinates/${coordinateId}/analyze`);
      hapticSuccess();
      Alert.alert(
        'Analysis Started',
        'New analysis has been initiated. You will be notified when results are ready.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      hapticError();
      Alert.alert(
        'Analysis Failed',
        error.message || 'Unable to start analysis. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async (): Promise<void> => {
    hapticSelection();

    await shareAlert({
      id,
      changeType,
      confidence,
      latitude,
      longitude,
      summary,
      severity,
      detectedAt,
    });
  };

  const severityColor = getSeverityColor(severity);

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Pressable
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-800"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text className="text-lg font-semibold text-white">Alert Details</Text>

        <Pressable
          onPress={handleShare}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-800"
        >
          <Ionicons name="share-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-4 pt-6">
          {/* Hero Card */}
          <LinearGradient
            colors={getChangeColors(changeType)}
            start={[0, 0]}
            end={[1, 1]}
            className="rounded-3xl p-6 items-center mb-6"
          >
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
              <Ionicons name={getChangeIcon(changeType) as any} size={48} color="#FFFFFF" />
            </View>

            <Text className="text-2xl font-bold text-white text-center mb-3">
              {formatChangeType(changeType)}
            </Text>

            <View className="rounded-full px-4 py-2 bg-white/20">
              <Text className="text-sm font-semibold text-white">
                {confidence}% Confidence
              </Text>
            </View>
          </LinearGradient>

          {/* Location Card */}
          <View className="rounded-2xl bg-[#111827] border border-gray-800 p-4 mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                <Ionicons name="location-outline" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-400 mb-1">Location</Text>
                <Text className="text-base text-white font-medium">
                  {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
                </Text>
              </View>
            </View>
          </View>

          {/* Detection Date Card */}
          <View className="rounded-2xl bg-[#111827] border border-gray-800 p-4 mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-400 mb-1">Detected At</Text>
                <Text className="text-base text-white font-medium">
                  {formatDate(detectedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Severity Card */}
          <View className="rounded-2xl bg-[#111827] border border-gray-800 p-4 mb-3">
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: severityColor + '20' }}
              >
                <Ionicons name="warning-outline" size={20} color={severityColor} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-400 mb-1">Severity Level</Text>
                <View className="flex-row items-center">
                  <View
                    className="px-3 py-1 rounded-full mr-2"
                    style={{ backgroundColor: severityColor + '20' }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: severityColor }}
                    >
                      {severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-400">
                    {getSeverityDescription(severity)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Summary Section */}
          <View className="rounded-2xl bg-[#111827] border border-gray-800 p-4 mb-6">
            <Text className="text-lg font-bold text-white mb-3">Analysis Summary</Text>
            <View className="h-px bg-gray-800 mb-3" />
            <Text className="text-base text-gray-300 leading-6">{summary}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gray-950/95 border-t border-gray-800">
        <Pressable
          onPress={handleRunAnalysis}
          className="mb-3"
          disabled={isAnalyzing}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={[0, 0]}
            end={[1, 0]}
            className="rounded-2xl py-4 px-6 flex-row items-center justify-center"
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
            )}
            <Text className="text-base font-semibold text-white ml-2">
              {isAnalyzing ? 'Analyzing...' : 'Run New Analysis'}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleShare}
          className="rounded-2xl py-4 px-6 border border-gray-700 flex-row items-center justify-center"
        >
          <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
          <Text className="text-base font-semibold text-gray-300 ml-2">Share Alert</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
