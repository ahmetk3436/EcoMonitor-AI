import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { hapticLight } from '../lib/haptics';
import { cn } from '../lib/cn';

const ONBOARDING_KEY = 'onboarding_complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(page);
  };

  const completeOnboarding = async (route: '/(auth)/register' | '/(auth)/login') => {
    hapticLight();
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    router.replace(route);
  };

  const goToNext = () => {
    hapticLight();
    if (activeIndex < 2) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Screen 1: Welcome */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <Ionicons name="earth" size={120} color="#10b981" />
          <Text className="text-3xl font-bold text-white mt-8 text-center">
            EcoMonitor AI
          </Text>
          <Text className="text-base text-gray-400 mt-4 text-center leading-6">
            Monitor environmental changes from space with AI-powered satellite analysis
          </Text>
        </View>

        {/* Screen 2: Features */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <Ionicons name="globe-outline" size={100} color="#10b981" />
          <Text className="text-2xl font-bold text-white mt-6 text-center">
            Real-Time Detection
          </Text>
          <View className="mt-8 w-full">
            {[
              { icon: 'leaf' as const, text: 'Vegetation loss tracking' },
              { icon: 'water' as const, text: 'Water body monitoring' },
              { icon: 'business' as const, text: 'Urban expansion alerts' },
              { icon: 'hammer' as const, text: 'Construction detection' },
            ].map((feature) => (
              <View key={feature.text} className="flex-row items-center mt-4 px-4">
                <Ionicons name={feature.icon} size={24} color="#34d399" />
                <Text className="text-base text-gray-300 ml-3">{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Screen 3: CTA */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <Ionicons name="shield-checkmark" size={100} color="#10b981" />
          <Text className="text-2xl font-bold text-white mt-6 text-center">
            Start Monitoring
          </Text>
          <Text className="text-base text-gray-400 mt-3 text-center leading-6">
            Track environmental changes and protect the planet with AI-powered insights
          </Text>

          <Pressable
            className="w-full bg-emerald-600 rounded-2xl py-4 mt-10 items-center"
            onPress={() => completeOnboarding('/(auth)/register')}
          >
            <Text className="text-base font-semibold text-white">Try Free</Text>
          </Pressable>

          <Pressable
            className="w-full border border-gray-700 rounded-2xl py-4 mt-4 items-center"
            onPress={() => completeOnboarding('/(auth)/login')}
          >
            <Text className="text-base font-semibold text-gray-300">Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Page Dots + Next Button */}
      <View className="pb-8 items-center">
        <View className="flex-row justify-center mb-6">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full mx-1.5',
                i === activeIndex ? 'bg-emerald-500' : 'bg-gray-700'
              )}
            />
          ))}
        </View>
        {activeIndex < 2 && (
          <Pressable onPress={goToNext} className="px-8 py-3">
            <Text className="text-emerald-400 font-semibold text-base">Next</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
