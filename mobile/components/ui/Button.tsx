import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { cn } from '../../lib/cn';
import { hapticLight } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  shimmer?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-purple-600 active:bg-purple-700',
  secondary: 'bg-gray-700 active:bg-gray-800',
  outline: 'border-2 border-purple-600 bg-transparent active:bg-purple-900/20',
  destructive: 'bg-red-600 active:bg-red-700',
  success: 'bg-emerald-600 active:bg-emerald-700',
  gradient: '',
};

const variantTextStyles = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-purple-400',
  destructive: 'text-white',
  success: 'text-white',
  gradient: 'text-white',
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

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  shimmer = false,
  fullWidth = false,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const scale = useSharedValue(1);
  const shimmerPosition = useSharedValue(-100);

  const handlePressIn = (e: any) => {
    if (!isDisabled) {
      runOnJS(hapticLight)();
      scale.value = withSpring(0.96);
      onPressIn?.(e);
    }
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1);
    onPressOut?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value }],
  }));

  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        className={cn(
          'items-center justify-center overflow-hidden rounded-2xl',
          sizeStyles[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50'
        )}
        style={[
          animatedStyle,
          { backgroundColor: isDisabled ? '#4b5563' : undefined },
        ]}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: isDisabled ? undefined : '#8b5cf6',
            opacity: isDisabled ? 0.5 : 1,
          }}
        />
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: isDisabled ? undefined : '#ec4899',
            opacity: isDisabled ? 0.3 : 0.5,
          }}
        />
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text
            className={cn(
              'font-bold',
              sizeTextStyles[size]
            )}
            style={{ position: 'relative', zIndex: 1 }}
          >
            {title}
          </Text>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      className={cn(
        'items-center justify-center rounded-2xl',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50'
      )}
      style={[
        animatedStyle,
        { borderRadius: borderRadiusStyles[size] },
      ]}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#8b5cf6' : '#ffffff'}
          size="small"
        />
      ) : (
        <Text
          className={cn(
            'font-semibold',
            variantTextStyles[variant],
            sizeTextStyles[size]
          )}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}
