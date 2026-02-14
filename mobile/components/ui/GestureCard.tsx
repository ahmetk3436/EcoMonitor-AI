import React from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { hapticLight, hapticMedium } from '../../lib/haptics';
import { cn } from '../../lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GestureCardProps extends PressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  swipeLeftAction?: () => void;
  swipeRightAction?: () => void;
  showSwipeHint?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function GestureCard({
  onPress,
  onLongPress,
  swipeLeftAction,
  swipeRightAction,
  showSwipeHint = false,
  children,
  disabled = false,
  className,
  style,
  ...props
}: GestureCardProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.97);
    opacity.value = withTiming(0.9);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  };

  const handlePress = () => {
    if (disabled) return;
    hapticLight();
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    hapticMedium();
    onLongPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const reset = () => {
    'worklet';
    translateX.value = withSpring(0);
    rotate.value = withSpring(0);
  };

  return (
    <AnimatedPressable
      className={cn('overflow-hidden', className)}
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      {...props}
    >
      {children}

      {showSwipeHint && (swipeLeftAction || swipeRightAction) && (
        <Animated.View
          className="absolute inset-0 flex-row items-center justify-between px-6"
          style={{ opacity: 0.3 }}
        >
          <Animated.Text className="text-gray-500 text-xs">Swipe</Animated.Text>
          <Animated.Text className="text-gray-500 text-xs">Swipe</Animated.Text>
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

// Swipeable Action Card
export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  onSwipeLeft,
  onSwipeRight,
  style,
}: {
  children: React.ReactNode;
  leftAction?: { icon: string; color: string; label: string };
  rightAction?: { icon: string; color: string; label: string };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: any;
}) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const containerWidth = 400; // approximate

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, -translateX.value / 100)),
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, translateX.value / 100)),
  }));

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Left Action Background */}
      {leftAction && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 100,
              backgroundColor: leftAction.color,
              justifyContent: 'center',
              alignItems: 'center',
              borderTopLeftRadius: 24,
              borderBottomLeftRadius: 24,
            },
            leftActionStyle,
          ]}
        />
      )}

      {/* Right Action Background */}
      {rightAction && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 100,
              backgroundColor: rightAction.color,
              justifyContent: 'center',
              alignItems: 'center',
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
            },
            rightActionStyle,
          ]}
        />
      )}

      {/* Card Content */}
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </View>
  );
}

// Micro-Interaction Card
export function MicroInteractionCard({
  children,
  onPress,
  effect = 'scale',
  className,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  effect?: 'scale' | 'glow' | 'bounce';
  className?: string;
  style?: any;
}) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handlePressIn = () => {
    hapticLight();
    switch (effect) {
      case 'scale':
        scale.value = withSpring(0.95);
        break;
      case 'glow':
        shadowOpacity.value = withSpring(0.5);
        scale.value = withSpring(1.02);
        break;
      case 'bounce':
        translateY.value = withSpring(-4);
        scale.value = withSpring(1.05);
        break;
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    shadowOpacity.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    shadowOpacity: shadowOpacity.value,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  }));

  return (
    <AnimatedPressable
      className={cn('rounded-3xl overflow-hidden', className)}
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}
