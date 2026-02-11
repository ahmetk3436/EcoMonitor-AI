import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticWarning, hapticLight } from '../../lib/haptics';
import EnhancedModal from './EnhancedModal';
import Button from './Button';

interface BlockButtonProps {
  userId: string;
  userName?: string;
  onBlocked?: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

// Block button (Apple Guideline 1.2 — immediate content hiding)
export default function EnhancedBlockButton({
  userId,
  userName = 'this user',
  onBlocked,
}: BlockButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const pendingBlockId = useSharedValue<string | null>(null);

  const blockReasons = [
    { id: 'harassment', icon: 'person-outline', label: 'Harassment', color: '#ef4444' },
    { id: 'spam', icon: 'trash-outline', label: 'Spam', color: '#eab308' },
    { id: 'inappropriate', icon: 'eye-off-outline', label: 'Inappropriate Content', color: '#f97316' },
    { id: 'personal', icon: 'heart-dislike-outline', label: 'Personal Preference', color: '#8b5cf6' },
    { id: 'other', icon: 'ellipsis-horizontal-circle-outline', label: 'Other', color: '#6b7280' },
  ];

  const handleBlock = async () => {
    if (!selectedReason) {
      hapticError();
      Alert.alert('Reason Required', 'Please select a reason for blocking this user.');
      return;
    }

    setIsBlocking(true);
    try {
      await api.post('/blocks', {
        blocked_id: userId,
        reason: selectedReason,
      });

      // Show undo UI
      setShowUndo(true);
      pendingBlockId.value = userId;

      const timeout = setTimeout(async () => {
        hapticSuccess();
        onBlocked?.();
        setShowUndo(false);
        setShowModal(false);
        Alert.alert(
          'User Blocked',
          `${userName} has been blocked. Their content is now hidden.`,
          [{ text: 'OK', onPress: () => hapticLight() }]
        );
      }, 5000);

      setUndoTimeout(timeout);
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUndo = () => {
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setShowUndo(false);
    hapticLight();
    Alert.alert('Block Cancelled', 'The user was not blocked.');
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: showUndo ? withSpring(1) : withTiming(0) }],
  }));

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1 p-2"
        onPress={() => {
          hapticWarning();
          setShowModal(true);
        }}
      >
        <Ionicons name="ban-outline" size={16} color="#ef4444" />
        <Text className="text-sm text-red-500">Block</Text>
      </Pressable>

      {/* Undo Toast */}
      <AnimatedView
        style={[
          {
            position: 'absolute',
            bottom: 100,
            left: 16,
            right: 16,
            backgroundColor: '#111827',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#ef4444',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            zIndex: 1000,
          },
          scaleStyle,
        ]}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#ef444420' }}>
            <Ionicons name="person-outline" size={20} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">User Blocked</Text>
            <Text className="text-gray-400 text-sm">They won't see your content</Text>
          </View>
          <Pressable
            className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: '#10b981' }}
            onPress={handleUndo}
          >
            <Text className="text-white font-semibold text-sm">Undo</Text>
          </Pressable>
        </View>
      </AnimatedView>

      <EnhancedModal
        visible={showModal && !showUndo}
        onClose={() => setShowModal(false)}
        title="Block User"
        subtitle={`Blocking ${userName} will:`}
        size="md"
      >
        <View className="space-y-4">
          {/* What happens when blocked */}
          <View className="space-y-3">
            {[
              { icon: 'eye-off-outline', text: 'Hide their content from your feed' },
              { icon: 'chatbubbles-outline', text: 'Prevent them from messaging you' },
              { icon: 'people-outline', text: 'Remove them from your connections' },
            ].map((item, index) => (
              <View key={index} className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center">
                  <Ionicons name={item.icon as any} size={16} color="#9ca3af" />
                </View>
                <Text className="text-gray-300 ml-3">{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Reason Selection */}
          <View>
            <Text className="text-white font-semibold mb-3">Why are you blocking?</Text>
            <View className="grid grid-cols-2 gap-2">
              {blockReasons.map((reason) => (
                <Pressable
                  key={reason.id}
                  className={cn(
                    'rounded-xl p-3 border-2 items-center',
                    selectedReason === reason.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-800 bg-gray-900'
                  )}
                  onPress={() => {
                    hapticLight();
                    setSelectedReason(reason.id);
                  }}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={24}
                    color={selectedReason === reason.id ? '#8b5cf6' : reason.color}
                  />
                  <Text className={cn(
                    'text-xs font-medium mt-1 text-center',
                    selectedReason === reason.id ? 'text-white' : 'text-gray-400'
                  )}>
                    {reason.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Warning Message */}
          <View className="rounded-xl p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', borderWidth: 1 }}>
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#ef4444" />
              <Text className="text-gray-400 text-xs ml-2 flex-1">
                You can unblock this user anytime from Settings. They won't be notified that you blocked them.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 pt-2">
            <View className="flex-1">
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  hapticLight();
                  setShowModal(false);
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Block"
                variant="destructive"
                onPress={handleBlock}
                isLoading={isBlocking}
              />
            </View>
          </View>
        </View>
      </EnhancedModal>
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
