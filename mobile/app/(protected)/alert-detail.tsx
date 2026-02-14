import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import { shareAlertDetail } from '../../lib/share';
import api from '../../lib/api';

interface AlertParams {
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
}

export default function AlertDetailScreen() {
  const params = useLocalSearchParams() as unknown as AlertParams;
  const router = useRouter();

  const {
    id,
    coordinateId,
    changeType,
    confidence,
    latitude,
    longitude,
    summary,
    detectedAt,
    severity,
    label
  } = params;

  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  const getChangeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'construction': 'hammer-outline',
      'vegetation_loss': 'leaf-outline',
      'water_change': 'water-outline',
      'urban_expansion': 'business-outline',
      'deforestation': 'cut-outline',
      'pollution': 'cloud-outline',
      'flooding': 'rainy-outline',
      'erosion': 'trending-down-outline',
      'wildfire_risk': 'flame-outline',
      'biodiversity_loss': 'bug-outline',
    };
    return icons[type] || 'earth-outline';
  };

  const getChangeColors = (type: string): string[] => {
    const colors: Record<string, string[]> = {
      'construction': ['#f59e0b', '#d97706'],
      'vegetation_loss': ['#ef4444', '#dc2626'],
      'water_change': ['#0ea5e9', '#0284c7'],
      'urban_expansion': ['#6366f1', '#4f46e5'],
      'deforestation': ['#b45309', '#92400e'],
      'pollution': ['#6b7280', '#4b5563'],
      'flooding': ['#0ea5e9', '#0284c7'],
      'erosion': ['#a16207', '#854d0e'],
      'wildfire_risk': ['#dc2626', '#b91c1c'],
      'biodiversity_loss': ['#15803d', '#166534'],
    };
    return colors[type] || ['#22c55e', '#16a34a'];
  };

  const getSeverityColor = (level: string): string => {
    const colors: Record<string, string> = {
      'critical': '#ef4444',
      'high': '#f97316',
      'medium': '#eab308',
      'low': '#22c55e'
    };
    return colors[level?.toLowerCase()] || '#6b7280';
  };

  const getSeverityBgColor = (level: string): string => {
    const colors: Record<string, string> = {
      'critical': '#fef2f2',
      'high': '#fff7ed',
      'medium': '#fefce8',
      'low': '#f0fdf4'
    };
    return colors[level?.toLowerCase()] || '#f3f4f6';
  };

  const getSeverityWidth = (level: string): string => {
    const widths: Record<string, string> = {
      'critical': '100%',
      'high': '75%',
      'medium': '50%',
      'low': '25%'
    };
    return widths[level?.toLowerCase()] || '50%';
  };

  const formatChangeType = (type: string): string => {
    return type
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown Change';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };

  const handleReanalyze = async (): Promise<void> => {
    hapticSelection();
    setIsReanalyzing(true);
    try {
      await api.post(`/coordinates/${coordinateId}/analyze`);
      hapticSuccess();
      Alert.alert('Analysis Started', 'New analysis has been initiated for this location. Check back in a few minutes for updated results.');
    } catch (error: any) {
      hapticError();
      Alert.alert('Error', error.response?.data?.message || 'Failed to start analysis. Please try again.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleShare = async (): Promise<void> => {
    hapticSelection();
    try {
      await shareAlertDetail({
        changeType: formatChangeType(changeType),
        confidence: confidence || '0',
        latitude: latitude || '0',
        longitude: longitude || '0',
        summary: summary || 'No summary available',
        severity: severity || 'medium',
        detectedAt: formatDate(detectedAt)
      });
      hapticSuccess();
    } catch (error) {
      hapticError();
    }
  };

  const severityColor = getSeverityColor(severity);
  const gradientColors = getChangeColors(changeType);

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Pressable
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          className="flex-row items-center"
        >
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
          <Text className="text-green-500 ml-1 text-base">Back</Text>
        </Pressable>

        <Text className="text-xl font-bold text-white">Alert Details</Text>

        <Pressable
          onPress={handleShare}
          className="p-2"
        >
          <Ionicons name="share-outline" size={24} color="#9ca3af" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View className="mx-4 mt-6 mb-4">
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6 items-center"
          >
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
              <Ionicons name={getChangeIcon(changeType) as any} size={48} color="white" />
            </View>
            <Text className="text-2xl font-bold text-white text-center">
              {formatChangeType(changeType)}
            </Text>
            <View className="flex-row items-center gap-3 mt-3">
              <View className="px-4 py-2 rounded-full bg-white/20">
                <Text className="text-white font-semibold">
                  {confidence || '0'}% Confidence
                </Text>
              </View>
              {severity && (
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: getSeverityBgColor(severity) }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: getSeverityColor(severity) }}
                  >
                    {severity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Location Card */}
        <View className="mx-4 mb-3">
          <View className="bg-[#111827] rounded-2xl border border-gray-800 p-4 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center mr-3">
              <Ionicons name="location-outline" size={20} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">Location</Text>
              <Text className="text-gray-400 text-sm mt-1">
                {latitude || '0'}, {longitude || '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Detection Date Card */}
        <View className="mx-4 mb-3">
          <View className="bg-[#111827] rounded-2xl border border-gray-800 p-4 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">Detected At</Text>
              <Text className="text-gray-400 text-sm mt-1">
                {formatDate(detectedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Severity Card */}
        <View className="mx-4 mb-3">
          <View className="bg-[#111827] rounded-2xl border border-gray-800 p-4 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center mr-3">
              <Ionicons name="warning-outline" size={20} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">Severity Level</Text>
              <View className="flex-row items-center mt-2">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: severityColor }}
                >
                  <Text className="text-white text-xs font-bold uppercase">
                    {severity || 'medium'}
                  </Text>
                </View>
                <View className="flex-1 h-2 rounded-full bg-gray-700 ml-3">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: getSeverityWidth(severity) as any,
                      backgroundColor: severityColor
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View className="mx-4 mb-6">
          <View className="bg-[#111827] rounded-2xl border border-gray-800 p-5">
            <Text className="text-lg font-bold text-white mb-3">Analysis Summary</Text>
            <View className="w-12 h-1 rounded-full bg-green-500 mb-4" />
            <Text className="text-gray-300 text-base leading-6">
              {summary || 'No detailed summary available for this alert. The analysis may still be processing or the data may be incomplete.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 pb-8 pt-4">
          <Pressable
            onPress={handleReanalyze}
            disabled={isReanalyzing}
            className="mb-3"
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl py-4 flex-row items-center justify-center"
            >
              {isReanalyzing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-base">Run New Analysis</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="rounded-2xl py-4 border-2 border-green-500 flex-row items-center justify-center"
          >
            <Ionicons name="share-outline" size={20} color="#22c55e" style={{ marginRight: 8 }} />
            <Text className="text-green-500 font-bold text-base">Share Alert</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
