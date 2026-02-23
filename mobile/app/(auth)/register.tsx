import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    try { 
      await register(email, password);
      router.replace('/(protected)/home');
    }
    catch (err: any) { setError(err.response?.data?.message || 'Registration failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-950" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="flex-1 justify-center px-8">
        <Text className="mb-2 text-3xl font-bold text-white">Create account</Text>
        <Text className="mb-8 text-base text-gray-400">Start monitoring your environment</Text>
        {error ? (<View className="mb-4 rounded-lg bg-red-900/30 p-3"><Text className="text-sm text-red-400">{error}</Text></View>) : null}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-300 mb-1.5">Email</Text>
          <View className="flex-row items-center rounded-2xl border-2 border-gray-800 bg-gray-900 overflow-hidden">
            <TextInput
              className="flex-1 text-base text-white px-4 py-3.5"
              placeholder="you@example.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>
        </View>
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-300 mb-1.5">Password</Text>
          <View className="flex-row items-center rounded-2xl border-2 border-gray-800 bg-gray-900 overflow-hidden">
            <TextInput
              className="flex-1 text-base text-white px-4 py-3.5"
              placeholder="Min. 8 characters"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>
        </View>
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-300 mb-1.5">Confirm Password</Text>
          <View className="flex-row items-center rounded-2xl border-2 border-gray-800 bg-gray-900 overflow-hidden">
            <TextInput
              className="flex-1 text-base text-white px-4 py-3.5"
              placeholder="Repeat your password"
              placeholderTextColor="#6b7280"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>
        </View>
        <Pressable
          className="items-center justify-center rounded-2xl px-8 py-4 bg-emerald-600 active:bg-emerald-700"
          onPress={handleRegister}
          disabled={isLoading}
          style={isLoading ? { opacity: 0.5 } : undefined}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-lg font-semibold text-white">Create Account</Text>
          )}
        </Pressable>
        <View className="mt-6 flex-row items-center justify-center">
          <Text className="text-gray-400">Already have an account? </Text>
          <Link href="/(auth)/login" asChild><Text className="font-semibold text-emerald-400">Sign In</Text></Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}