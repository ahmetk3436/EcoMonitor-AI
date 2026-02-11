import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Modal from './Modal';
import { hapticLight, hapticMedium } from '../../lib/haptics';

interface PaywallFeature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  included?: boolean;
  highlight?: boolean;
}

interface PaywallTier {
  id: string;
  name: string;
  price: string;
  period: string;
  originalPrice?: string;
  savings?: string;
  badge?: string;
  gradient: readonly [string, string];
  features: PaywallFeature[];
  popular?: boolean;
}

interface ContextualPaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: (tierId: string) => void;
  onRestore: () => void;
  context?: {
    feature?: string;
    value?: string;
    message?: string;
  };
}

const freeFeatures: PaywallFeature[] = [
  {
    icon: 'location-outline',
    title: '3 Location Monitors',
    description: 'Track up to 3 locations',
    included: true,
  },
  {
    icon: 'notifications-outline',
    title: 'Basic Alerts',
    description: 'Get notified of changes',
    included: true,
  },
  {
    icon: 'eye-off-outline',
    title: 'Limited History',
    description: '7 days of data retention',
    included: true,
  },
  {
    icon: 'analytics-outline',
    title: 'Advanced AI Analysis',
    description: 'Detailed change detection',
    included: false,
  },
  {
    icon: 'earth-outline',
    title: 'Unlimited Locations',
    description: 'Monitor anywhere',
    included: false,
  },
  {
    icon: 'flash-outline',
    title: 'Real-time Alerts',
    description: 'Instant notifications',
    included: false,
  },
];

const premiumTiers: PaywallTier[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    gradient: ['#6b7280', '#4b5563'],
    features: freeFeatures.map((f) => ({ ...f, included: true })),
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$39.99',
    period: '/year',
    originalPrice: '$59.88',
    savings: 'Save 33%',
    badge: 'BEST VALUE',
    popular: true,
    gradient: ['#8b5cf6', '#7c3aed'],
    features: freeFeatures.map((f) => ({ ...f, included: true })),
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$99.99',
    period: 'once',
    savings: 'Best long-term value',
    badge: 'UNLIMITED',
    gradient: ['#fbbf24', '#f97316'],
    features: freeFeatures.map((f) => ({ ...f, included: true, highlight: true })),
  },
];

export default function ContextualPaywall({
  visible,
  onClose,
  onPurchase,
  onRestore,
  context,
}: ContextualPaywallProps) {
  const [selectedTier, setSelectedTier] = useState('yearly');
  const pulseValue = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const handlePurchase = (tierId: string) => {
    hapticMedium();
    onPurchase(tierId);
  };

  const selectedTierData = premiumTiers.find((t) => t.id === selectedTier);

  return (
    <Modal visible={visible} onClose={onClose} title="">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Context Header */}
        {context && (
          <View className="mb-6">
            <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6', borderWidth: 1 }}>
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#8b5cf650' }}>
                  <Ionicons name="lock-closed" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">{context.message || `Unlock ${context.feature || 'Premium Features'}`}</Text>
                  <Text className="text-gray-400 text-sm mt-1">{context.value || 'Upgrade to continue using this feature'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Title */}
        <View className="items-center mb-6">
          <Animated.View style={animatedStyle}>
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
              <Ionicons name="diamond" size={32} color="#8b5cf6" />
            </View>
          </Animated.View>
          <Text className="text-2xl font-bold text-white mt-4">Upgrade to Pro</Text>
          <Text className="text-gray-400 text-center mt-2">
            Unlock unlimited environmental monitoring
          </Text>
        </View>

        {/* Tier Selection */}
        <View className="space-y-3 mb-6">
          {premiumTiers.map((tier) => (
            <Pressable
              key={tier.id}
              className={cn(
                'rounded-2xl p-4 border-2 relative overflow-hidden',
                selectedTier === tier.id ? 'border-purple-500' : 'border-gray-800'
              )}
              onPress={() => {
                hapticLight();
                setSelectedTier(tier.id);
              }}
            >
              {tier.popular && (
                <View className="absolute top-0 right-0 px-3 py-1 bg-purple-600 rounded-bl-xl">
                  <Text className="text-white text-xs font-bold">{tier.badge}</Text>
                </View>
              )}

              <LinearGradient
                colors={selectedTier === tier.id ? [...tier.gradient] : ['transparent', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', inset: 0, borderRadius: 16, opacity: selectedTier === tier.id ? 0.2 : 0 }}
              />

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">{tier.name}</Text>
                  <View className="flex-row items-baseline mt-1">
                    <Text className="text-white text-2xl font-bold">{tier.price}</Text>
                    <Text className="text-gray-400 text-sm ml-1">{tier.period}</Text>
                    {tier.originalPrice && (
                      <Text className="text-gray-600 text-sm ml-2 line-through">{tier.originalPrice}</Text>
                    )}
                  </View>
                  {tier.savings && (
                    <Text className="text-emerald-400 text-xs mt-1">{tier.savings}</Text>
                  )}
                </View>

                <View
                  className={cn(
                    'w-6 h-6 rounded-full items-center justify-center border-2',
                    selectedTier === tier.id ? 'border-purple-500 bg-purple-500' : 'border-gray-700'
                  )}
                >
                  {selectedTier === tier.id && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Features Comparison */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-3">What's Included</Text>
          <View className="space-y-3">
            {selectedTierData?.features.map((feature, index) => (
              <View key={index} className="flex-row items-center">
                <View className={cn(
                  'w-6 h-6 rounded-full items-center justify-center',
                  feature.highlight ? 'bg-gradient-to-r from-purple-500 to-pink-500' : feature.included ? 'bg-emerald-500/20' : 'bg-gray-800'
                )}>
                  <Ionicons
                    name={feature.included ? 'checkmark' : 'close'}
                    size={14}
                    color={feature.included ? (feature.highlight ? '#ffffff' : '#10b981') : '#6b7280'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={cn(
                    'text-sm font-medium',
                    feature.included ? 'text-white' : 'text-gray-500'
                  )}>
                    {feature.title}
                  </Text>
                  <Text className="text-gray-500 text-xs">{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase Button */}
        <Pressable
          className="rounded-2xl py-4 items-center overflow-hidden"
          onPress={() => handlePurchase(selectedTier)}
        >
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 }}
          >
            <Text className="text-white font-bold text-base">
              Subscribe {selectedTierData?.name === 'Yearly' ? '(Save 33%)' : ''}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Restore & Terms */}
        <View className="mt-4 items-center">
          <Pressable onPress={onRestore}>
            <Text className="text-purple-400 text-sm">Restore Purchases</Text>
          </Pressable>
          <Text className="text-gray-600 text-xs mt-2 text-center">
            Cancel anytime. Subscription auto-renews unless disabled 24h before.
          </Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
