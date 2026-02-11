import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  Dimensions,
  type ModalProps as RNModalProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight } from '../../lib/haptics';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Modal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  ...props
}: ModalProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(0.8, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0, { duration: 150 });
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        hapticLight();
        onClose();
      }}
      statusBarTranslucent
      {...props}
    >
      {/* Backdrop with blur */}
      <AnimatedView
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
          animatedBackdropStyle,
        ]}
      >
        <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
          <Pressable
            className="flex-1"
            onPress={() => {
              hapticLight();
              onClose();
            }}
          />
        </BlurView>
      </AnimatedView>

      {/* Modal Content */}
      <View className="flex-1 items-center justify-center px-6">
        <AnimatedView
          className={cn(
            'w-full rounded-3xl bg-gray-900 p-6 shadow-2xl',
            sizeStyles[size]
          )}
          style={animatedContainerStyle}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                {title && (
                  <Text className="text-xl font-bold text-white">{title}</Text>
                )}
                {subtitle && (
                  <Text className="text-sm text-gray-400 mt-0.5">{subtitle}</Text>
                )}
              </View>
              {showCloseButton && (
                <Pressable
                  className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
                  onPress={() => {
                    hapticLight();
                    onClose();
                  }}
                >
                  <Ionicons name="close" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          {children}
        </AnimatedView>
      </View>
    </RNModal>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
