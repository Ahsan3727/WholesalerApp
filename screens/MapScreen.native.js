import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MapScreen({ navigation }) {
  const { wholesaler, updateWholesaler } = useAuth();   // added updateWholesaler
  const [markerPosition, setMarkerPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);

  // Determine initial position: saved shop location > device location
  useEffect(() => {
    (async () => {
      // 1. Check for a saved shop location
      const savedLoc = wholesaler?.shopLocation;
      if (
        savedLoc &&
        savedLoc.coordinates &&
        savedLoc.coordinates.length === 2 &&
        (savedLoc.coordinates[0] !== 0 || savedLoc.coordinates[1] !== 0)
      ) {
        // GeoJSON stores [lng, lat]
        const [lng, lat] = savedLoc.coordinates;
        setMarkerPosition({ latitude: lat, longitude: lng });
        setLoading(false);
        return;
      }

      // 2. No saved location → use device GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setMarkerPosition(loc.coords);
      } catch (error) {
        console.error('Initial location error:', error);
        setPermissionDenied(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const centerOnUser = () => {
    if (mapRef.current && markerPosition) {
      mapRef.current.animateToRegion(
        {
          latitude: markerPosition.latitude,
          longitude: markerPosition.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  };

  // Save the MARKER POSITION (after possible dragging)
  const handleSaveLocation = async () => {
    if (!markerPosition) return;
    Alert.alert(
      'Set Shop Location',
      `Save this location? (${markerPosition.latitude.toFixed(6)}, ${markerPosition.longitude.toFixed(6)})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setSaving(true);
            try {
              await api.put('/wholesalers/location', {
                lat: markerPosition.latitude,
                lng: markerPosition.longitude,
                address: '',
              });
              // Update auth context immediately so next open shows saved location
              updateWholesaler({
                shopLocation: {
                  type: 'Point',
                  coordinates: [markerPosition.longitude, markerPosition.latitude],
                  address: '',
                },
                locationSet: true,
              });
              Alert.alert('Success', 'Shop location saved!', [
                { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
              ]);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not save location');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ---------- Permission denied state ----------
  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Location Permission Required</Text>
        <Text style={styles.deniedMessage}>Please enable location in your device settings.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionBtnText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !markerPosition) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.statusText}>Getting your location...</Text>
      </View>
    );
  }

  // ---------- Main view ----------
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: markerPosition.latitude,
          longitude: markerPosition.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={markerPosition}
          title="Drag me to your shop"
          description="Long press and drag to set exact location"
          draggable
          onDragEnd={(e) => {
            // Update the saved position to the dragged coordinates
            setMarkerPosition(e.nativeEvent.coordinate);
          }}
        >
          <View style={styles.markerBox}>
            <Text style={styles.markerIcon}>🏪</Text>
          </View>
        </Marker>
      </MapView>

      {/* Center button */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnIcon}>📍</Text>
      </TouchableOpacity>

      {/* Save button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveLocation}
        disabled={saving}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>🏪 Save as Shop Location</Text>
        )}
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drag pin to your shop</Text>
        <View style={{ width: 50 }} />
      </View>
    </View>
  );
}

// ---------- Styles (unchanged) ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  statusText: { marginTop: 12, fontSize: 16, color: '#666' },
  deniedTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  deniedMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 15 },
  permissionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { color: '#4CAF50', fontWeight: '600', fontSize: 16, marginTop: 10 },
  header: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.95)',
  },
  backBtn: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  markerBox: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  markerIcon: { fontSize: 28 },
  centerBtn: {
    position: 'absolute', bottom: 30, right: 20,
    backgroundColor: 'white', borderRadius: 30, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  centerBtnIcon: { fontSize: 24 },
  saveButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});