import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  Dimensions,
  type ModalProps as RNModalProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight } from '../../lib/haptics';
import { cn } from '../../lib/cn';

interface EnhancedModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  showCloseButton?: boolean;
  swipeToDismiss?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINTS = {
  sm: SCREEN_HEIGHT * 0.4,
  md: SCREEN_HEIGHT * 0.6,
  lg: SCREEN_HEIGHT * 0.8,
  fullscreen: SCREEN_HEIGHT * 0.95,
};

const AnimatedView = Animated.createAnimatedComponent(View);

export default function EnhancedModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  swipeToDismiss = true,
  ...props
}: EnhancedModalProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sizeClasses = {
    sm: 'h-[40%]',
    md: 'h-[60%]',
    lg: 'h-[80%]',
    fullscreen: 'h-[95%]',
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      {...props}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
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
            backdropStyle,
          ]}
        >
          <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
            <Pressable
              className="flex-1"
              onPress={swipeToDismiss ? handleClose : undefined}
            />
          </BlurView>
        </AnimatedView>

        {/* Modal Content */}
        <AnimatedView
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl shadow-2xl',
            sizeClasses[size]
          )}
          style={animatedStyle}
        >
          {/* Handle for swipe indicator */}
          {swipeToDismiss && (
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1.5 bg-gray-700 rounded-full" />
            </View>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-800">
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
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={20} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <View className="flex-1 px-6 py-4">{children}</View>
        </AnimatedView>
      </GestureHandlerRootView>
    </RNModal>
  );
}
