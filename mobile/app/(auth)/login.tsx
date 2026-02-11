import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AppleSignInButton from '../../components/ui/AppleSignInButton';

export default function LoginScreen() {
  const { login, continueAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-8">
          {/* Logo/Header */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center">
                <Text style={{ fontSize: 32 }}>🌍</Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-white">Welcome back</Text>
            <Text className="text-base text-gray-400 mt-1">
              Monitor your environment
            </Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View
              className="mb-4 rounded-2xl p-4 border-2 flex-row items-center"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
              }}
            >
              <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center mr-3">
                <Text className="text-red-400">!</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-red-400">{error}</Text>
              </View>
            </View>
          ) : null}

          {/* Input Fields */}
          <View className="mb-4">
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              leftIcon="mail-outline"
              autoComplete="email"
            />
          </View>

          <View className="mb-6">
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              textContentType="password"
              leftIcon="lock-closed-outline"
              autoComplete="password"
            />
          </View>

          {/* Sign In Button with Gradient */}
          <Pressable
            className="rounded-2xl py-4 items-center overflow-hidden"
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full flex-row items-center justify-center py-4"
            >
              {isLoading ? (
                <Text className="text-base font-semibold text-white">
                  Signing in...
                </Text>
              ) : (
                <Text className="text-base font-semibold text-white">Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Apple Sign In */}
          <AppleSignInButton onError={(msg) => setError(msg)} isLoading={isLoading} />

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="h-px flex-1 bg-gray-800" />
            <Text className="mx-4 text-sm text-gray-600">New here?</Text>
            <View className="h-px flex-1 bg-gray-800" />
          </View>

          {/* Sign Up Link */}
          <Pressable
            className="rounded-2xl py-4 items-center border-2 border-gray-800"
            onPress={() => router.push('/(auth)/register')}
          >
            <Text className="text-base font-semibold text-purple-400">
              Create an Account
            </Text>
          </Pressable>

          {/* Guest Mode */}
          <Pressable
            className="mt-4 items-center py-3"
            onPress={handleGuestMode}
          >
            <Text className="text-sm text-gray-500">Try Without Account</Text>
          </Pressable>

          {/* Footer Text */}
          <Text className="text-xs text-gray-600 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
