import React, { useEffect } from 'react';
import { View, Text, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getStreakIcon, getStreakMessage, type StreakData } from '../../lib/streak';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreakCardProps {
  streakData: StreakData;
  onPress?: () => void;
}

const streakGradients = {
  bronze: ['#cd7f32', '#b87333'],
  silver: ['#c0c0c0', '#a8a8a8'],
  gold: ['#ffd700', '#ffb700'],
  platinum: ['#e5e4e2', '#d4d3d1'],
  diamond: ['#b9f2ff', '#00d9ff'],
  cosmic: ['#8b5cf6', '#ec4899'],
  celestial: ['#fbbf24', '#f472b6', '#8b5cf6'],
};

const getStreakTier = (streak: number): keyof typeof streakGradients => {
  if (streak >= 50) return 'celestial';
  if (streak >= 30) return 'cosmic';
  if (streak >= 21) return 'diamond';
  if (streak >= 14) return 'platinum';
  if (streak >= 7) return 'gold';
  if (streak >= 3) return 'silver';
  return 'bronze';
};

export default function StreakCard({ streakData, onPress }: StreakCardProps) {
  const scaleValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  const streak = streakData.currentStreak;
  const tier = getStreakTier(streak);
  const gradient = streakGradients[tier];

  useEffect(() => {
    if (streak >= 7) {
      glowOpacity.value = withRepeat(
        withSequence(
          withSpring(0.6, { damping: 2 }),
          withSpring(0.3, { damping: 2 })
        ),
        -1,
        false
      );
    }
  }, [streak]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    scaleValue.value = withSpring(0.97, {}, () => {
      scaleValue.value = withSpring(1);
    });
    onPress?.();
  };

  const getTierBadge = () => {
    if (streak >= 50) return 'CELESTIAL';
    if (streak >= 30) return 'COSMIC';
    if (streak >= 21) return 'DIAMOND';
    if (streak >= 14) return 'PLATINUM';
    if (streak >= 7) return 'GOLD';
    if (streak >= 3) return 'SILVER';
    return 'BRONZE';
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedContainerStyle}>
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow Effect for high tiers */}
          {streak >= 7 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  filter: 'blur(40px)',
                },
                animatedGlowStyle,
              ]}
            />
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Animated.View style={animatedIconStyle}>
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Ionicons
                    name={getStreakIcon(streak) as any}
                    size={32}
                    color="#ffffff"
                  />
                </View>
              </Animated.View>

              <View className="ml-4 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-3xl font-bold text-white">
                    {streak}
                  </Text>
                  <Text className="text-lg text-white/80 ml-1">
                    {streak === 1 ? 'day' : 'days'}
                  </Text>
                </View>
                <Text className="text-sm text-white/70 mt-0.5">
                  {getStreakMessage(streak)}
                </Text>
              </View>
            </View>

            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            >
              <Text className="text-xs font-bold text-white tracking-wider">
                {getTierBadge()}
              </Text>
            </View>
          </View>

          {/* Progress bar to next tier */}
          {streak < 50 && (
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-white/60">Next Tier</Text>
                <Text className="text-xs font-semibold text-white">
                  {getNextTierTarget(streak)} days
                </Text>
              </View>
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${getTierProgress(streak)}%`,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function getNextTierTarget(streak: number): number {
  if (streak < 3) return 3;
  if (streak < 7) return 7;
  if (streak < 14) return 14;
  if (streak < 21) return 21;
  if (streak < 30) return 30;
  return 50;
}

function getTierProgress(streak: number): number {
  if (streak < 3) return (streak / 3) * 100;
  if (streak < 7) return ((streak - 3) / 4) * 100;
  if (streak < 14) return ((streak - 7) / 7) * 100;
  if (streak < 21) return ((streak - 14) / 7) * 100;
  if (streak < 30) return ((streak - 21) / 9) * 100;
  if (streak < 50) return ((streak - 30) / 20) * 100;
  return 100;
}
