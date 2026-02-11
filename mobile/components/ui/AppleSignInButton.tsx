import React, { useState } from 'react';
import { Platform, View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { hapticError, hapticLight } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppleSignInButtonProps {
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export default function AppleSignInButton({ onError, isLoading: externalLoading = false }: AppleSignInButtonProps) {
  const { loginWithApple } = useAuth();
  const [internalLoading, setInternalLoading] = useState(false);
  const scale = useSharedValue(1);
  const isLoading = externalLoading || internalLoading;

  const handleAppleSignIn = async () => {
    if (isLoading) return;

    try {
      setInternalLoading(true);
      scale.value = withSpring(0.97);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      await loginWithApple(
        credential.identityToken,
        credential.authorizationCode || '',
        fullName,
        credential.email || undefined
      );

      scale.value = withSpring(1);
      hapticLight();
    } catch (err: any) {
      scale.value = withSpring(1);
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return; // User cancelled
      }
      hapticError();
      onError?.(err.message || 'Apple Sign In failed');
    } finally {
      setInternalLoading(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // iOS - Native Apple Sign In
  if (Platform.OS === 'ios') {
    return (
      <View className="mt-4">
        <View className="mb-4 flex-row items-center">
          <View className="h-px flex-1 bg-gray-800" />
          <Text className="mx-4 text-sm text-gray-600">or</Text>
          <View className="h-px flex-1 bg-gray-800" />
        </View>

        <AnimatedPressable
          className="flex-row items-center justify-center rounded-2xl bg-black py-4 border-2 border-gray-800"
          onPress={handleAppleSignIn}
          disabled={isLoading}
          style={animatedStyle}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text className="mr-2 text-lg text-white">{'\uF8FF'}</Text>
              <Text className="text-base font-semibold text-white">
                Sign in with Apple
              </Text>
            </>
          )}
        </AnimatedPressable>
      </View>
    );
  }

  // Android - Fallback email/password CTA
  return (
    <View className="mt-4">
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-gray-800" />
        <Text className="mx-4 text-sm text-gray-600">or</Text>
        <View className="h-px flex-1 bg-gray-800" />
      </View>

      <Pressable
        className="flex-row items-center justify-center rounded-2xl bg-gray-900 border-2 border-gray-800 py-4"
        onPress={() => {
          hapticLight();
          // Navigate to email signup
        }}
      >
        <Ionicons name="mail-outline" size={20} color="#9ca3af" />
        <Text className="text-base font-semibold text-white ml-2">
          Continue with Email
        </Text>
      </Pressable>
    </View>
  );
}
