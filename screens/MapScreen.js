import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_LOCATION = { latitude: 31.72, longitude: 72.98 };

export default function MapScreen({ navigation }) {
  const { wholesaler, updateWholesaler } = useAuth();
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const webMapRef = useRef(null);

  // Determine initial position: saved shop location > device location
  useEffect(() => {
    const savedLoc = wholesaler?.shopLocation;
    if (
      savedLoc &&
      savedLoc.coordinates &&
      savedLoc.coordinates.length === 2 &&
      (savedLoc.coordinates[0] !== 0 || savedLoc.coordinates[1] !== 0)
    ) {
      const [lng, lat] = savedLoc.coordinates;
      setMarkerPosition({ latitude: lat, longitude: lng });
      setLoading(false);
      return;
    }

    // No saved location – use browser GPS
    if (!navigator.geolocation) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMarkerPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      () => {
        setPermissionDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const centerOnUser = () => {
    if (webMapRef.current) {
      webMapRef.current.flyTo([markerPosition.latitude, markerPosition.longitude], 16, {
        duration: 1.5,
      });
    }
  };

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

  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Location Permission Required</Text>
        <Text style={styles.deniedMessage}>Please allow location access in your browser settings.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const icon = useMemo(() => {
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="font-size:28px; background:transparent;">🏪</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <WebMapWithDraggableMarker
          position={markerPosition}
          onDragEnd={(newPos) => setMarkerPosition(newPos)}
          icon={icon}
          onMapReady={(map) => { webMapRef.current = map; }}
        />
      ) : (
        <View style={styles.centered}><Text>Map not available on this platform</Text></View>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drag pin to your shop</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnIcon}>📍</Text>
      </TouchableOpacity>

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
    </View>
  );
}

// Web map with draggable marker
function WebMapWithDraggableMarker({ position, onDragEnd, icon, onMapReady }) {
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const latlng = marker.getLatLng();
          onDragEnd({ latitude: latlng.lat, longitude: latlng.lng });
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        whenReady={(mapInstance) => {
          onMapReady(mapInstance.target);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker
          ref={markerRef}
          position={[position.latitude, position.longitude]}
          draggable={true}
          eventHandlers={eventHandlers}
          icon={icon}
        >
          <Popup>Drag to set your shop location</Popup>
        </Marker>
      </MapContainer>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#333' },
  deniedTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  deniedMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20 },
  backLink: { color: '#FF9800', fontWeight: '600', fontSize: 16, marginTop: 10 },
  header: {
    position: 'absolute', top: 50, left: 16, right: 16, zIndex: 2000,
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14, paddingHorizontal: 8, paddingVertical: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', elevation: 10,
  },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  backIcon: { fontSize: 28, color: '#FF9800', fontWeight: '300', lineHeight: 30 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  headerSpacer: { width: 44 },
  centerBtn: {
    position: 'absolute', bottom: 30, right: 20, zIndex: 2000,
    backgroundColor: 'white', borderRadius: 30, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', elevation: 5,
  },
  centerBtnIcon: { fontSize: 24 },
  saveButton: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: '#FF9800', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)', elevation: 5,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});