import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticError,
  hapticSelection,
} from '../../lib/haptics';
import { Coordinate, CreateCoordinateDto } from '../../types/coordinate';

export default function MapScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState<Coordinate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newPin, setNewPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    loadUserLocation();
    fetchCoordinates();
  }, []);

  const loadUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission denied',
        'Location permission is required to show your location',
      );
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const fetchCoordinates = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Coordinate[]>('/coordinates');
      setCoordinates(data);
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      hapticError();
      Alert.alert('Error', 'Failed to load coordinates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLongPress = (event: LongPressEvent) => {
    hapticMedium();
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setNewPin({ latitude, longitude });
    setEditLatitude(latitude.toString());
    setEditLongitude(longitude.toString());
    setSelectedCoordinate(null);
    setIsEditing(false);
    setEditName('');
    setEditDescription('');
    bottomSheetRef.current?.expand();
  };

  const handleAddCoordinate = async () => {
    if (!editName.trim()) {
      hapticError();
      Alert.alert('Error', 'Please enter a coordinate name');
      return;
    }

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      hapticError();
      Alert.alert('Error', 'Please enter valid latitude and longitude');
      return;
    }

    try {
      setIsSaving(true);
      hapticLight();

      const createDto: CreateCoordinateDto = {
        latitude: lat,
        longitude: lng,
        label: editName.trim(),
        description: editDescription.trim() || undefined,
      };

      const { data: savedCoordinate } = await api.post<Coordinate>(
        '/coordinates',
        createDto,
      );

      setCoordinates([...coordinates, savedCoordinate]);
      bottomSheetRef.current?.close();
      clearForm();
      setNewPin(null);
      hapticSuccess();
    } catch (error) {
      console.error('Failed to add coordinate:', error);
      hapticError();
      Alert.alert('Error', 'Failed to add coordinate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCoordinate = async () => {
    if (!selectedCoordinate || !editName.trim()) {
      hapticError();
      Alert.alert('Error', 'Please enter a coordinate name');
      return;
    }

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      hapticError();
      Alert.alert('Error', 'Please enter valid latitude and longitude');
      return;
    }

    try {
      setIsSaving(true);
      hapticLight();

      const { data: updatedCoordinate } = await api.put<Coordinate>(
        `/coordinates/${selectedCoordinate.id}`,
        {
          label: editName.trim(),
          description: editDescription.trim() || undefined,
          latitude: lat,
          longitude: lng,
        },
      );

      setCoordinates(
        coordinates.map((c) =>
          c.id === selectedCoordinate.id ? updatedCoordinate : c,
        ),
      );
      setSelectedCoordinate(updatedCoordinate);
      bottomSheetRef.current?.close();
      setIsEditing(false);
      clearForm();
      hapticSuccess();
    } catch (error) {
      console.error('Failed to update coordinate:', error);
      hapticError();
      Alert.alert('Error', 'Failed to update coordinate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoordinate = async (id: string) => {
    Alert.alert(
      'Delete Coordinate',
      'Are you sure you want to delete this coordinate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              hapticLight();
              await api.delete(`/coordinates/${id}`);
              setCoordinates(coordinates.filter((c) => c.id !== id));
              setSelectedCoordinate(null);
              hapticSuccess();
            } catch (error) {
              console.error('Failed to delete coordinate:', error);
              hapticError();
              Alert.alert(
                'Error',
                'Failed to delete coordinate. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const handleAnalyzeCoordinate = async (coordinate: Coordinate) => {
    try {
      setIsAnalyzing(true);
      hapticLight();

      await api.post(`/coordinates/${coordinate.id}/analyze`);

      hapticSuccess();
      Alert.alert(
        'Analysis Complete',
        `Environmental analysis for ${coordinate.label} has been completed successfully.`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      console.error('Failed to analyze coordinate:', error);
      hapticError();
      Alert.alert('Error', 'Failed to analyze coordinate. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearForm = () => {
    setEditName('');
    setEditDescription('');
    setEditLatitude('');
    setEditLongitude('');
  };

  const openAddSheet = () => {
    hapticSelection();
    clearForm();
    setIsEditing(false);
    setNewPin(null);
    bottomSheetRef.current?.expand();
  };

  const selectCoordinate = (coordinate: Coordinate) => {
    hapticSelection();
    setSelectedCoordinate(coordinate);
  };

  const closeOverlay = () => {
    hapticLight();
    setSelectedCoordinate(null);
  };

  const openEditSheet = (coordinate: Coordinate) => {
    hapticSelection();
    setEditName(coordinate.label);
    setEditDescription(coordinate.description || '');
    setEditLatitude(coordinate.latitude.toString());
    setEditLongitude(coordinate.longitude.toString());
    setIsEditing(true);
    bottomSheetRef.current?.expand();
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
        userInterfaceStyle="dark"
        region={region}
        onRegionChangeComplete={setRegion}
        onLongPress={handleLongPress}
        showsUserLocation
        showsMyLocationButton
      >
        {coordinates.map((coord) => (
          <Marker
            key={coord.id}
            coordinate={{
              latitude: coord.latitude,
              longitude: coord.longitude,
            }}
            title={coord.label}
            description={coord.description}
            onPress={() => selectCoordinate(coord)}
            pinColor="#10b981"
          />
        ))}

        {newPin && <Marker coordinate={newPin} pinColor="red" />}
      </MapView>

      {/* Add Button */}
      <Pressable onPress={openAddSheet} className="absolute top-20 right-5 z-10">
        <View className="bg-emerald-500 rounded-full p-3 shadow-lg shadow-emerald-500/30">
          <Ionicons name="add" size={24} color="#ffffff" />
        </View>
      </Pressable>

      {/* Selected Coordinate Overlay */}
      {selectedCoordinate && (
        <View
          className="absolute bottom-5 left-5 right-5 rounded-2xl p-4"
          style={{
            backgroundColor: '#111827',
            borderWidth: 1,
            borderColor: '#1f2937',
          }}
        >
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-bold text-white flex-1">
              {selectedCoordinate.label}
            </Text>
            <Pressable onPress={closeOverlay} className="ml-2">
              <Ionicons name="close-circle" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <Text className="text-sm text-gray-400 mb-3">
            {selectedCoordinate.description || 'No description'}
          </Text>

          <View className="flex-row gap-2 mb-4">
            <View className="bg-gray-800 rounded-lg px-3 py-1">
              <Text className="text-xs text-gray-400">
                Lat: {selectedCoordinate.latitude.toFixed(4)}
              </Text>
            </View>
            <View className="bg-gray-800 rounded-lg px-3 py-1">
              <Text className="text-xs text-gray-400">
                Lng: {selectedCoordinate.longitude.toFixed(4)}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            {/* Delete Button */}
            <Pressable
              onPress={() => handleDeleteCoordinate(selectedCoordinate.id)}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
            >
              <Ionicons name="trash" size={18} color="#ef4444" />
              <Text className="text-red-500 font-semibold ml-2">Delete</Text>
            </Pressable>

            {/* Analyze Button */}
            <Pressable
              onPress={() => handleAnalyzeCoordinate(selectedCoordinate)}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <>
                  <Ionicons name="analytics" size={18} color="#10b981" />
                  <Text className="text-emerald-500 font-semibold ml-2">
                    Analyze
                  </Text>
                </>
              )}
            </Pressable>

            {/* Edit Button */}
            <Pressable
              onPress={() => openEditSheet(selectedCoordinate)}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-gray-800"
            >
              <Ionicons name="create" size={18} color="#9ca3af" />
              <Text className="text-gray-400 font-semibold ml-2">Edit</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%']}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: '#111827' }}
        handleIndicatorStyle={{ backgroundColor: '#374151' }}
        keyboardBehavior="extend"
        android_keyboardInputMode="adjustResize"
        onClose={() => {
          setNewPin(null);
          clearForm();
        }}
      >
        <View className="flex-1 p-6">
          <Text className="text-xl font-bold text-white text-center mb-5">
            {isEditing ? 'Edit Coordinate' : 'Add Coordinate'}
          </Text>

          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Coordinate name"
            placeholderTextColor="#6b7280"
            maxLength={50}
            className="rounded-xl p-3 mb-4 text-white"
            style={{
              backgroundColor: '#1f2937',
              borderWidth: 1,
              borderColor: '#374151',
            }}
          />

          <TextInput
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Description (optional)"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={2}
            maxLength={200}
            className="rounded-xl p-3 mb-4 text-white"
            style={{
              backgroundColor: '#1f2937',
              borderWidth: 1,
              borderColor: '#374151',
            }}
          />

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Latitude</Text>
              <TextInput
                value={editLatitude}
                onChangeText={setEditLatitude}
                placeholder="0.0000"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className="rounded-xl p-3 text-white"
                style={{
                  backgroundColor: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Longitude</Text>
              <TextInput
                value={editLongitude}
                onChangeText={setEditLongitude}
                placeholder="0.0000"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className="rounded-xl p-3 text-white"
                style={{
                  backgroundColor: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
              />
            </View>
          </View>

          <Pressable
            onPress={isEditing ? handleEditCoordinate : handleAddCoordinate}
            disabled={isSaving}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl mb-3"
            >
              <View className="flex-row items-center justify-center py-4">
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#ffffff" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {isEditing ? 'Update Coordinate' : 'Save Coordinate'}
                    </Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticLight();
              bottomSheetRef.current?.close();
            }}
            className="rounded-xl items-center justify-center py-4"
            style={{ backgroundColor: '#1f2937' }}
          >
            <Text className="text-gray-400 font-semibold">Cancel</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
