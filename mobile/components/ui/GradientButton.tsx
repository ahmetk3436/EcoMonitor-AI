import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  Animated,
  type PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';
import { hapticLight } from '../../lib/haptics';

interface GradientButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  shimmer?: boolean;
}

const gradientStyles = {
  primary: ['#10b981', '#059669'] as const,
  secondary: ['#6b7280', '#4b5563'] as const,
  accent: ['#8b5cf6', '#7c3aed'] as const,
  success: ['#10b981', '#059669'] as const,
  warning: ['#f59e0b', '#d97706'] as const,
};

const sizeStyles = {
  sm: 'px-4 py-2.5',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
  xl: 'px-10 py-5',
};

const sizeTextStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const borderRadiusStyles = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export default function GradientButton({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  shimmer = false,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: GradientButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    hapticLight();
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  const isDisabled = disabled || isLoading;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        className={cn('items-center justify-center overflow-hidden', sizeStyles[size])}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <LinearGradient
          colors={[...gradientStyles[variant]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: borderRadiusStyles[size],
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className={cn('font-bold text-white', sizeTextStyles[size])}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
