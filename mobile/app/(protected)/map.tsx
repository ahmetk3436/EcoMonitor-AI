import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region, LongPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { hapticMedium, hapticSuccess } from '../../lib/haptics';
import { Coordinate, CreateCoordinateDto } from '../../types/coordinate';

export default function MapScreen() {
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState<Coordinate | null>(null);
  const [newPin, setNewPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadUserLocation();
    loadCoordinates();
  }, []);

  const loadUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission denied',
        'Location permission is required to show your location',
      );
      setLoading(false);
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

  const loadCoordinates = async () => {
    try {
      const { data } = await api.get<Coordinate[]>('/coordinates');
      setCoordinates(data);
    } catch {
      Alert.alert('Error', 'Failed to load saved locations');
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = (event: LongPressEvent) => {
    hapticMedium();
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setNewPin({ latitude, longitude });
    setSelectedCoordinate(null);
    bottomSheetRef.current?.expand();
  };

  const handleSavePin = async () => {
    if (!newPin || !label.trim()) {
      Alert.alert('Error', 'Please enter a label for the pin');
      return;
    }

    try {
      const createDto: CreateCoordinateDto = {
        latitude: newPin.latitude,
        longitude: newPin.longitude,
        label: label.trim(),
        description: description.trim() || undefined,
      };

      const { data: savedCoordinate } = await api.post<Coordinate>(
        '/coordinates',
        createDto,
      );
      setCoordinates((prev) => [...prev, savedCoordinate]);

      hapticSuccess();

      setNewPin(null);
      setLabel('');
      setDescription('');
      bottomSheetRef.current?.close();
    } catch {
      Alert.alert('Error', 'Failed to save pin');
    }
  };

  const handleDeletePin = async (id: string) => {
    try {
      await api.delete(`/coordinates/${id}`);
      setCoordinates((prev) => prev.filter((coord) => coord.id !== id));
      setSelectedCoordinate(null);
    } catch {
      Alert.alert('Error', 'Failed to delete pin');
    }
  };

  const handleMarkerPress = (coordinate: Coordinate) => {
    setSelectedCoordinate(coordinate);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
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
            onPress={() => handleMarkerPress(coord)}
          />
        ))}

        {newPin && <Marker coordinate={newPin} pinColor="red" />}
      </MapView>

      {selectedCoordinate && (
        <View style={styles.markerInfo}>
          <View style={styles.markerInfoContent}>
            <Text style={styles.markerLabel}>{selectedCoordinate.label}</Text>
            {selectedCoordinate.description && (
              <Text style={styles.markerDescription}>
                {selectedCoordinate.description}
              </Text>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePin(selectedCoordinate.id)}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedCoordinate(null)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        onClose={() => {
          setNewPin(null);
          setLabel('');
          setDescription('');
        }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Add Location Pin</Text>

          <TextInput
            style={styles.input}
            placeholder="Label *"
            value={label}
            onChangeText={setLabel}
            maxLength={50}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => bottomSheetRef.current?.close()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSavePin}
            >
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Pin</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  markerInfoContent: {
    flex: 1,
    marginRight: 12,
  },
  markerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  markerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
});
