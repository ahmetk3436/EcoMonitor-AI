import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { cn } from '../../lib/cn';
import { hapticLight, hapticSelection } from '../../lib/haptics';

interface EnhancedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: boolean;
  characterCount?: boolean;
  maxLength?: number;
  showPasswordToggle?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  helperText?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function EnhancedInput({
  label,
  error,
  success,
  characterCount,
  maxLength,
  showPasswordToggle,
  leftIcon,
  helperText,
  className,
  value,
  ...props
}: EnhancedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const shakeOffset = useSharedValue(0);
  const borderScale = useSharedValue(1);

  const triggerShake = () => {
    'worklet';
    shakeOffset.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withSpring(5, { damping: 10, stiffness: 400 }),
      withSpring(-5, { damping: 10, stiffness: 400 }),
      withSpring(5, { damping: 10, stiffness: 400 }),
      withSpring(0, { damping: 10, stiffness: 400 })
    );
  };

  const triggerError = () => {
    runOnJS(hapticLight)();
    triggerShake();
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: borderScale.value }],
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderScale.value = withSpring(1.02);
    props.onFocus?.(undefined as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderScale.value = withSpring(1);
    props.onBlur?.(undefined as any);
  };

  const borderColor = error
    ? '#ef4444'
    : success
    ? '#10b981'
    : isFocused
    ? '#8b5cf6'
    : '#374151';

  const characterCountText = maxLength && value && (
    <Text className="text-xs text-gray-500">
      {value?.toString().length}/{maxLength}
    </Text>
  );

  return (
    <AnimatedView style={animatedContainerStyle} className="w-full">
      {label && (
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-sm font-semibold text-gray-300">{label}</Text>
          {characterCountText}
        </View>
      )}

      <AnimatedView
        className={cn(
          'flex-row items-center rounded-2xl bg-gray-900 overflow-hidden',
          'border-2 transition-colors duration-200',
          error && 'border-red-500',
          success && !error && 'border-emerald-500',
          !error && !success && isFocused && 'border-purple-500',
          !error && !success && !isFocused && 'border-gray-800',
          className
        )}
        style={[
          { borderColor },
          animatedBorderStyle,
        ]}
      >
        {leftIcon && (
          <View className="pl-4">
            <Ionicons
              name={leftIcon}
              size={20}
              color={error ? '#ef4444' : isFocused ? '#8b5cf6' : '#6b7280'}
            />
          </View>
        )}

        <TextInput
          className={cn(
            'flex-1 text-base text-white px-4 py-3.5',
            leftIcon && 'pl-3'
          )}
          placeholderTextColor="#6b7280"
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={showPasswordToggle && !showPassword}
          {...props}
        />

        {showPasswordToggle && (
          <Pressable
            className="pr-4"
            onPress={() => {
              hapticSelection();
              setShowPassword(!showPassword);
            }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6b7280"
            />
          </Pressable>
        )}

        {success && !error && (
          <View className="pr-4">
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
        )}
      </AnimatedView>

      {helperText && !error && (
        <Text className="mt-1.5 text-xs text-gray-500">{helperText}</Text>
      )}

      {error && (
        <View className="flex-row items-center mt-1.5">
          <Ionicons name="alert-circle" size={14} color="#ef4444" />
          <Text className="ml-1 text-sm text-red-400">{error}</Text>
        </View>
      )}
    </AnimatedView>
  );
}
