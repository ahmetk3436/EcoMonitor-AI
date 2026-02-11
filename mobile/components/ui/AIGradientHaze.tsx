import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface AIGradientHazeProps {
  children: React.ReactNode;
  colors?: readonly [string, string, string];
  style?: ViewStyle;
  intensity?: 'subtle' | 'medium' | 'intense';
  animated?: boolean;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function AIGradientHaze({
  children,
  colors = ['#8b5cf6', '#ec4899', '#f472b6'],
  style,
  intensity = 'medium',
  animated = true,
}: AIGradientHazeProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  React.useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000 }),
        -1,
        false
      );
      scale.value = withRepeat(
        withTiming(1.1, { duration: 4000 }),
        -1,
        true
      );
      opacity.value = withRepeat(
        withTiming(0.5, { duration: 4000 }),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const intensitySizes = {
    subtle: { width: 200, height: 200 },
    medium: { width: 300, height: 300 },
    intense: { width: 400, height: 400 },
  };

  return (
    <View style={style} className="relative overflow-hidden">
      {children}

      {/* Top-right gradient orb */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -100,
            right: -100,
            width: intensitySizes[intensity].width,
            height: intensitySizes[intensity].height,
            borderRadius: intensitySizes[intensity].width / 2,
            filter: 'blur(60px)',
          },
          animatedStyle,
        ]}
      >
        <AnimatedLinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Bottom-left gradient orb */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: intensitySizes.subtle.width,
            height: intensitySizes.subtle.height,
            borderRadius: intensitySizes.subtle.width / 2,
            filter: 'blur(50px)',
            opacity: 0.6,
          },
        ]}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// Preset gradient combinations for different vibes
export const gradientPresets = {
  cosmic: ['#8b5cf6', '#ec4899', '#f472b6'] as const,
  ocean: ['#06b6d4', '#3b82f6', '#8b5cf6'] as const,
  sunset: ['#f97316', '#ec4899', '#8b5cf6'] as const,
  forest: ['#10b981', '#06b6d4', '#3b82f6'] as const,
  aurora: ['#22c55e', '#10b981', '#06b6d4'] as const,
  neon: ['#f472b6', '#8b5cf6', '#6366f1'] as const,
  gold: ['#fbbf24', '#f97316', '#ef4444'] as const,
  mono: ['#6b7280', '#374151', '#1f2937'] as const,
};

// AI Processing Overlay
export function AIProcessingOverlay({
  visible,
  message = 'AI is analyzing...',
  progress = 0,
}: {
  visible: boolean;
  message?: string;
  progress?: number;
}) {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [visible]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/80 items-center justify-center z-50">
      {/* Animated gradient background */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: 200,
              filter: 'blur(80px)',
            },
            animatedPulseStyle,
          ]}
        >
          <LinearGradient
            colors={gradientPresets.cosmic}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>

      {/* Loading ring */}
      <View className="items-center justify-center relative">
        <Animated.View style={animatedRingStyle}>
          <View
            className="w-24 h-24 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500"
            style={{
              borderWidth: 4,
              borderColor: 'transparent',
              borderTopColor: '#8b5cf6',
              borderRightColor: '#ec4899',
            }}
          />
        </Animated.View>

        {/* Inner glow */}
        <View
          className="absolute w-16 h-16 rounded-full bg-purple-500/30"
          style={{
            shadowColor: '#8b5cf6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 10,
          }}
        />

        <Text className="mt-6 text-white font-semibold text-lg">{message}</Text>

        {progress > 0 && (
          <View className="mt-4 w-48">
            <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2 text-center">
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
