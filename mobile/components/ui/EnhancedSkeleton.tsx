import React, { useRef, useEffect } from 'react';
import { View, ViewStyle, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  variant?: 'pulse' | 'shimmer' | 'wave';
  style?: ViewStyle;
  darkMode?: boolean;
}

export default function EnhancedSkeleton({
  width,
  height,
  borderRadius = 12,
  variant = 'shimmer',
  style,
  darkMode = true,
}: SkeletonProps) {
  const baseColor = darkMode ? '#1f2937' : '#e5e7eb';
  const highlightColor = darkMode ? '#374151' : '#f3f4f6';

  if (variant === 'pulse') {
    return <PulseSkeleton width={width} height={height} borderRadius={borderRadius} darkMode={darkMode} style={style} />;
  }

  if (variant === 'wave') {
    return <WaveSkeleton width={width} height={height} borderRadius={borderRadius} darkMode={darkMode} style={style} />;
  }

  const widthValue = typeof width === 'number' ? width : undefined;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['transparent', highlightColor, 'transparent'] as readonly [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flex: 1,
          width: '200%',
        }}
      />
    </View>
  );
}

function PulseSkeleton({ width, height, borderRadius, darkMode, style }: any) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity,
          width,
          height,
          borderRadius,
          backgroundColor: darkMode ? '#1f2937' : '#e5e7eb',
        },
        style,
      ]}
    />
  );
}

function WaveSkeleton({ width, height, borderRadius, darkMode, style }: any) {
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateY, {
        toValue: 50,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: darkMode ? '#1f2937' : '#e5e7eb',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          transform: [{ translateY }],
        }}
      />
    </View>
  );
}

// Card Skeleton Component for Bento Box layouts
export function CardSkeleton({ width, height }: { width: number | string; height: number }) {
  return (
    <View style={{ width, height }} className="bg-gray-900 rounded-3xl overflow-hidden">
      <EnhancedSkeleton width="100%" height={120} borderRadius={0} />
      <View className="p-4">
        <EnhancedSkeleton width="80%" height={16} borderRadius={8} />
        <View className="mt-2">
          <EnhancedSkeleton width="100%" height={12} borderRadius={6} />
          <EnhancedSkeleton width="100%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
          <EnhancedSkeleton width="60%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <View className="bg-gray-900 rounded-2xl p-4 items-center flex-1 mx-2">
      <EnhancedSkeleton width={40} height={40} borderRadius={20} />
      <EnhancedSkeleton width={60} height={24} borderRadius={8} style={{ marginTop: 12 }} />
      <EnhancedSkeleton width={80} height={14} borderRadius={6} style={{ marginTop: 6 }} />
    </View>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <View className="bg-gray-900 rounded-2xl p-4 flex-row items-center mb-3">
      <EnhancedSkeleton width={48} height={48} borderRadius={24} />
      <View className="flex-1 ml-3">
        <EnhancedSkeleton width="70%" height={16} borderRadius={8} />
        <EnhancedSkeleton width="50%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <EnhancedSkeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

