import React, { useState } from 'react';
import { Alert, Pressable, Text, View, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticLight } from '../../lib/haptics';
import EnhancedModal from './EnhancedModal';
import Button from './Button';

interface ReportButtonProps {
  contentType: 'user' | 'post' | 'comment';
  contentId: string;
}

const reportCategories = [
  { id: 'harassment', icon: 'person-outline', label: 'Harassment', color: '#ef4444' },
  { id: 'hate_speech', icon: 'heart-dislike-outline', label: 'Hate Speech', color: '#f97316' },
  { id: 'spam', icon: 'trash-outline', label: 'Spam or Scam', color: '#eab308' },
  { id: 'misinformation', icon: 'warning-outline', label: 'Misinformation', color: '#3b82f6' },
  { id: 'violence', icon: 'flash-outline', label: 'Violence or Threats', color: '#8b5cf6' },
  { id: 'privacy', icon: 'eye-off-outline', label: 'Privacy Violation', color: '#ec4899' },
  { id: 'impersonation', icon: 'person-remove-outline', label: 'Impersonation', color: '#14b8a6' },
  { id: 'other', icon: 'ellipsis-horizontal-circle-outline', label: 'Other', color: '#6b7280' },
];

const severityLevels = [
  { id: 'low', label: 'Low', description: 'Minor issue, not urgent', color: '#10b981' },
  { id: 'medium', label: 'Medium', description: 'Needs attention', color: '#f59e0b' },
  { id: 'high', label: 'High', description: 'Serious violation', color: '#ef4444' },
];

// Report button (Apple Guideline 1.2 — every piece of UGC must have one)
export default function EnhancedReportButton({
  contentType,
  contentId,
}: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('medium');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a category for your report.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reports', {
        content_type: contentType,
        content_id: contentId,
        category: selectedCategory,
        severity: selectedSeverity,
        description,
      });
      hapticSuccess();
      setShowModal(false);
      resetForm();
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review this within 24 hours.',
        [{ text: 'OK', onPress: () => hapticLight() }]
      );
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedSeverity('medium');
    setDescription('');
    setStep(1);
  };

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1 p-2"
        onPress={() => {
          hapticLight();
          setShowModal(true);
          resetForm();
        }}
      >
        <Ionicons name="flag-outline" size={16} color="#ef4444" />
        <Text className="text-sm text-red-500">Report</Text>
      </Pressable>

      <EnhancedModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={step === 1 ? 'Report Content' : 'Provide Details'}
        size="lg"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Progress Steps */}
          <View className="flex-row items-center mb-6">
            <View className={cn(
              'w-8 h-8 rounded-full items-center justify-center',
              step >= 1 ? 'bg-purple-600' : 'bg-gray-700'
            )}>
              <Text className={cn('text-sm font-bold', step >= 1 ? 'text-white' : 'text-gray-400')}>1</Text>
            </View>
            <View className={cn(
              'flex-1 h-1 mx-2',
              step >= 2 ? 'bg-purple-600' : 'bg-gray-700'
            )} />
            <View className={cn(
              'w-8 h-8 rounded-full items-center justify-center',
              step >= 2 ? 'bg-purple-600' : 'bg-gray-700'
            )}>
              <Text className={cn('text-sm font-bold', step >= 2 ? 'text-white' : 'text-gray-400')}>2</Text>
            </View>
          </View>

          {step === 1 ? (
            <>
              <Text className="text-gray-400 mb-4">
                Select the category that best describes the issue with this {contentType}.
              </Text>

              <View className="grid grid-cols-2 gap-3">
                {reportCategories.map((category) => (
                  <Pressable
                    key={category.id}
                    className={cn(
                      'rounded-2xl p-4 border-2 items-center',
                      selectedCategory === category.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-800 bg-gray-900'
                    )}
                    onPress={() => {
                      hapticLight();
                      setSelectedCategory(category.id);
                    }}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={28}
                      color={selectedCategory === category.id ? '#8b5cf6' : category.color}
                    />
                    <Text className={cn(
                      'text-sm font-medium mt-2 text-center',
                      selectedCategory === category.id ? 'text-white' : 'text-gray-300'
                    )}>
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row gap-3 mt-6">
                <View className="flex-1">
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setShowModal(false)}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Next"
                    variant="primary"
                    onPress={() => {
                      if (selectedCategory) {
                        hapticLight();
                        setStep(2);
                      } else {
                        hapticError();
                        Alert.alert('Select a category', 'Please select a category to continue.');
                      }
                    }}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text className="text-gray-400 mb-4">
                Tell us more about this report (optional but helpful).
              </Text>

              {/* Severity Selection */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-3">How severe is this?</Text>
                <View className="flex-row gap-2">
                  {severityLevels.map((level) => (
                    <Pressable
                      key={level.id}
                      className={cn(
                        'flex-1 rounded-xl p-3 border-2',
                        selectedSeverity === level.id
                          ? 'border-current'
                          : 'border-gray-800 bg-gray-900'
                      )}
                      style={selectedSeverity === level.id ? { borderColor: level.color } : {}}
                      onPress={() => {
                        hapticLight();
                        setSelectedSeverity(level.id);
                      }}
                    >
                      <Text className={cn(
                        'text-sm font-bold text-center',
                        selectedSeverity === level.id ? 'text-white' : 'text-gray-400'
                      )}>
                        {level.label}
                      </Text>
                      <Text className="text-xs text-gray-500 text-center mt-1">
                        {level.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">Additional Details</Text>
                <TextInput
                  className="rounded-2xl bg-gray-900 border-2 border-gray-800 p-4 text-white min-h-[100px]"
                  placeholder="Describe what happened..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={4}
                  onChangeText={setDescription}
                  value={description}
                />
              </View>

              {/* Review Section */}
              <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6', borderWidth: 1 }}>
                <Text className="text-white font-semibold mb-2">Report Summary</Text>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="flag" size={16} color="#8b5cf6" />
                  <Text className="text-gray-300 ml-2">
                    Category: {reportCategories.find(c => c.id === selectedCategory)?.label}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={16} color="#f59e0b" />
                  <Text className="text-gray-300 ml-2">
                    Severity: {severityLevels.find(s => s.id === selectedSeverity)?.label}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button
                    title="Back"
                    variant="outline"
                    onPress={() => {
                      hapticLight();
                      setStep(1);
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Submit Report"
                    variant="destructive"
                    onPress={handleReport}
                    isLoading={isSubmitting}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </EnhancedModal>
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
