import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Polygon, Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import ZTL_ZONES from '../data/ztlZones';

function isInsidePolygon(point, polygon) {
  const { latitude: lat, longitude: lng } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [activeZone, setActiveZone] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPermissionError(true); return; }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc.coords);
      checkZones(loc.coords);

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
        (newLoc) => { setLocation(newLoc.coords); checkZones(newLoc.coords); }
      );
    })();
  }, []);

  function checkZones(coords) {
    const found = ZTL_ZONES.find((zone) => isInsidePolygon(coords, zone.boundary));
    setActiveZone(found || null);
    if (found) {
      Alert.alert('⚠️ ZTL Zone', `You are entering ${found.name}. Restricted zone — check active hours.`);
    }
  }

  if (permissionError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Location permission is required for ZTL warnings.</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        {ZTL_ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.boundary}
            fillColor="rgba(233, 69, 96, 0.2)"
            strokeColor="#e94560"
            strokeWidth={2}
          />
        ))}
      </MapView>

      {activeZone && (
        <View style={styles.warning}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View>
            <Text style={styles.warningTitle}>ZTL Zone: {activeZone.name}</Text>
            <Text style={styles.warningSubtitle}>{activeZone.hours}</Text>
          </View>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendColor} />
          <Text style={styles.legendText}>ZTL Restricted Zone</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#e94560', fontSize: 16, textAlign: 'center' },
  loadingText: { color: '#aaa', fontSize: 16, marginTop: 12 },
  warning: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#1a0a0f',
    borderWidth: 1,
    borderColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: { fontSize: 28 },
  warningTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  warningSubtitle: { color: '#aaa', fontSize: 13, marginTop: 2 },
  legend: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(15,15,26,0.85)',
    borderRadius: 8,
    padding: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendColor: { width: 16, height: 16, backgroundColor: 'rgba(233,69,96,0.4)', borderWidth: 1, borderColor: '#e94560', borderRadius: 3 },
  legendText: { color: '#fff', fontSize: 12 },
});
