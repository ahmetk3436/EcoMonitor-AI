import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import {
  hapticLight,
  hapticSuccess,
  hapticError,
} from '../../lib/haptics';
import { Coordinate } from '../../types/coordinate';

export default function MapScreen() {
  const router = useRouter();

  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [newCoordinate, setNewCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const fetchCoordinates = async () => {
    try {
      const response = await api.get('/coordinates');
      setCoordinates(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      Alert.alert('Error', 'Failed to load locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, []);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setNewCoordinate({ latitude, longitude });
    setIsAddMode(true);
    setSelectedCoordinate(null);
    setLabel('');
    setDescription('');
    bottomSheetRef.current?.expand();
    hapticLight();
  };

  const handleMarkerPress = (coordinate: Coordinate) => {
    setSelectedCoordinate(coordinate);
    setIsAddMode(false);
    hapticLight();

    // Animate to marker
    mapRef.current?.animateToRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  const handleSaveCoordinate = async () => {
    if (!label.trim() || !newCoordinate) {
      hapticError();
      Alert.alert('Error', 'Please enter a location label.');
      return;
    }

    setIsSaving(true);
    hapticLight();

    try {
      await api.post('/coordinates', {
        label: label.trim(),
        description: description.trim(),
        latitude: newCoordinate.latitude,
        longitude: newCoordinate.longitude,
      });

      hapticSuccess();
      bottomSheetRef.current?.close();
      setLabel('');
      setDescription('');
      setNewCoordinate(null);
      fetchCoordinates();
    } catch (error) {
      hapticError();
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoordinate = (id: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            hapticLight();
            try {
              await api.delete(`/coordinates/${id}`);
              hapticSuccess();
              setSelectedCoordinate(null);
              fetchCoordinates();
            } catch (error) {
              hapticError();
              Alert.alert('Error', 'Failed to delete location. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAnalyzeCoordinate = async () => {
    if (!selectedCoordinate) return;

    setIsAnalyzing(true);
    hapticLight();

    try {
      await api.post(`/coordinates/${selectedCoordinate.id}/analyze`);
      hapticSuccess();
      Alert.alert(
        'Analysis Complete',
        `Environmental analysis for "${selectedCoordinate.label}" has been initiated. Results will be available in your dashboard shortly.`,
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error) {
      hapticError();
      Alert.alert('Error', 'Failed to analyze location. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-400 mt-3">Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        userInterfaceStyle="dark"
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handleMapPress}
        initialRegion={{
          latitude: 41.0082,
          longitude: 28.9784,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {coordinates.map((coordinate) => (
          <Marker
            key={coordinate.id}
            coordinate={{
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
            }}
            title={coordinate.label}
            description={coordinate.description}
            onPress={() => handleMarkerPress(coordinate)}
            pinColor="#10b981"
          />
        ))}
      </MapView>

      {/* Selected Coordinate Info Overlay */}
      {selectedCoordinate && (
        <View
          className="absolute bottom-5 left-5 right-5 rounded-2xl p-4"
          style={{ backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }}
        >
          <Pressable
            onPress={() => setSelectedCoordinate(null)}
            className="absolute top-3 right-3 p-2"
          >
            <Ionicons name="close-circle" size={24} color="#6b7280" />
          </Pressable>

          <Text className="text-lg font-bold text-white pr-8">
            {selectedCoordinate.label}
          </Text>

          <Text className="text-sm text-gray-400 mb-3 mt-1">
            {selectedCoordinate.description || 'No description provided'}
          </Text>

          <Text className="text-xs text-gray-500 mb-4">
            📍 {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
          </Text>

          <View className="flex-row gap-3">
            {/* Analyze Button */}
            <Pressable
              onPress={handleAnalyzeCoordinate}
              disabled={isAnalyzing}
              className="flex-1 overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center py-3"
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="analytics" size={18} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">Analyze</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Delete Button */}
            <Pressable
              onPress={() => handleDeleteCoordinate(selectedCoordinate.id)}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text className="text-red-500 font-semibold ml-2">Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Analyzing Overlay */}
      {isAnalyzing && (
        <View className="absolute inset-0 bg-gray-950/90 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-400 mt-3">Analyzing location...</Text>
        </View>
      )}

      {/* Add Location BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%']}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: '#111827' }}
        handleIndicatorStyle={{ backgroundColor: '#374151' }}
        onClose={() => {
          setIsAddMode(false);
          setLabel('');
          setDescription('');
          setNewCoordinate(null);
        }}
      >
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Text className="text-xl font-bold text-white text-center mb-5">
            Add New Location
          </Text>

          <TextInput
            placeholder="Location Label *"
            placeholderTextColor="#6b7280"
            value={label}
            onChangeText={setLabel}
            className="rounded-xl p-3 mb-4 text-white"
            style={{ backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' }}
          />

          <TextInput
            placeholder="Description (optional)"
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            className="rounded-xl p-3 mb-4 text-white"
            style={{
              backgroundColor: '#1f2937',
              borderWidth: 1,
              borderColor: '#374151',
              textAlignVertical: 'top',
              minHeight: 80,
            }}
          />

          <TextInput
            placeholder="Latitude"
            placeholderTextColor="#6b7280"
            value={newCoordinate?.latitude.toFixed(6).toString() || ''}
            editable={false}
            className="rounded-xl p-3 mb-4 text-gray-400"
            style={{ backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' }}
          />

          <TextInput
            placeholder="Longitude"
            placeholderTextColor="#6b7280"
            value={newCoordinate?.longitude.toFixed(6).toString() || ''}
            editable={false}
            className="rounded-xl p-3 mb-4 text-gray-400"
            style={{ backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' }}
          />

          <View className="flex-row gap-3 mt-4">
            {/* Save Button */}
            <Pressable
              onPress={handleSaveCoordinate}
              disabled={isSaving || !label.trim()}
              className="flex-1 overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={label.trim() ? ['#10b981', '#059669'] : ['#374151', '#374151']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">Save Location</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              onPress={() => bottomSheetRef.current?.close()}
              className="flex-1 py-4 rounded-xl items-center justify-center"
              style={{ backgroundColor: '#1f2937' }}
            >
              <Text className="text-gray-400 font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
