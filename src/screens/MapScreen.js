import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import MapView, { Polygon, Polyline, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import ZTL_ZONES from '../data/ztlZones';
import {
  ROME_TRANSIT_LINES, ROME_STOPS,
  FLORENCE_TRANSIT_LINES, FLORENCE_STOPS,
} from '../data/transitData';

const CITIES = [
  {
    id: 'rome',
    name: 'Rome',
    region: { latitude: 41.9009, longitude: 12.4961, latitudeDelta: 0.06, longitudeDelta: 0.06 },
    transitLines: ROME_TRANSIT_LINES,
    stops: ROME_STOPS,
  },
  {
    id: 'florence',
    name: 'Florence',
    region: { latitude: 43.7696, longitude: 11.2558, latitudeDelta: 0.04, longitudeDelta: 0.04 },
    transitLines: FLORENCE_TRANSIT_LINES,
    stops: FLORENCE_STOPS,
  },
];

function isInsidePolygon(point, polygon) {
  const { latitude: lat, longitude: lng } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;
    if (yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ── Stop Detail Modal ─────────────────────────────────────────────────────────
function StopModal({ stop, onClose }) {
  if (!stop) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.header}>
            <View style={[sm.lineBadge, { backgroundColor: stop.color }]}>
              <Text style={sm.lineBadgeText}>{stop.line}</Text>
            </View>
            <Text style={sm.stopName}>{stop.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={sm.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {stop.note && <Text style={sm.note}>{stop.note}</Text>}
          <Text style={sm.attractionsLabel}>Nearby attractions</Text>
          {stop.attractions.map((a, i) => (
            <View key={i} style={sm.attractionRow}>
              <Text style={sm.attractionDot}>•</Text>
              <Text style={sm.attractionText}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ── Main Map Screen ───────────────────────────────────────────────────────────
export default function MapScreen() {
  const [location, setLocation]       = useState(null);
  const [permError, setPermError]     = useState(false);
  const [activeZone, setActiveZone]   = useState(null);
  const [selectedCity, setSelectedCity] = useState('rome');
  const [showZTL, setShowZTL]         = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const mapRef = useRef(null);

  const city = CITIES.find(c => c.id === selectedCity);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPermError(true); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc.coords);
      checkZones(loc.coords);
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 30 },
        (l) => { setLocation(l.coords); checkZones(l.coords); }
      );
    })();
  }, []);

  function checkZones(coords) {
    const found = ZTL_ZONES.find(z => isInsidePolygon(coords, z.boundary));
    setActiveZone(found || null);
  }

  function flyToCity(cityId) {
    setSelectedCity(cityId);
    const c = CITIES.find(c => c.id === cityId);
    mapRef.current?.animateToRegion(c.region, 600);
  }

  if (permError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Location permission required for ZTL warnings.</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={city.region}
        showsUserLocation
      >
        {/* ZTL Zones */}
        {showZTL && ZTL_ZONES.map(zone => (
          <Polygon
            key={zone.id}
            coordinates={zone.boundary}
            fillColor="rgba(233, 69, 96, 0.18)"
            strokeColor="#e94560"
            strokeWidth={2}
          />
        ))}

        {/* Transit Lines */}
        {showTransit && city.transitLines.map(line => (
          <Polyline
            key={line.id}
            coordinates={line.stations.map(s => s.coordinate)}
            strokeColor={line.color}
            strokeWidth={4}
            lineDashPattern={line.type === 'bus' ? [8, 4] : undefined}
          />
        ))}

        {/* Transit Stops */}
        {showTransit && city.stops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={stop.coordinate}
            onPress={() => setSelectedStop(stop)}
          >
            <View style={[mk.pin, { backgroundColor: stop.color }]}>
              <Text style={mk.pinText}>{stop.line}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* City selector */}
      <View style={styles.cityRow}>
        {CITIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.cityBtn, selectedCity === c.id && styles.cityBtnActive]}
            onPress={() => flyToCity(c.id)}
          >
            <Text style={[styles.cityBtnText, selectedCity === c.id && styles.cityBtnTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Layer toggles */}
      <View style={styles.layerRow}>
        <TouchableOpacity
          style={[styles.layerBtn, showZTL && styles.layerBtnZTL]}
          onPress={() => setShowZTL(v => !v)}
        >
          <Text style={styles.layerBtnText}>{showZTL ? '🚫' : '○'} ZTL Zones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerBtn, showTransit && styles.layerBtnTransit]}
          onPress={() => setShowTransit(v => !v)}
        >
          <Text style={styles.layerBtnText}>{showTransit ? '🚇' : '○'} Transit</Text>
        </TouchableOpacity>
      </View>

      {/* Transit legend */}
      {showTransit && (
        <View style={styles.legend}>
          {city.transitLines.map(line => (
            <View key={line.id} style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: line.color }]} />
              <Text style={styles.legendText}>{line.shortName} {line.name.split('—')[0].split('–')[0].trim()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ZTL warning banner */}
      {activeZone && (
        <View style={styles.warning}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View>
            <Text style={styles.warningTitle}>ZTL Zone: {activeZone.name}</Text>
            <Text style={styles.warningSubtitle}>{activeZone.hours}</Text>
          </View>
        </View>
      )}

      {/* Stop detail modal */}
      <StopModal stop={selectedStop} onClose={() => setSelectedStop(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#e94560', fontSize: 16, textAlign: 'center' },
  loadingText: { color: '#aaa', fontSize: 16, marginTop: 12 },

  cityRow: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  cityBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 20,
    backgroundColor: 'rgba(15,15,26,0.85)', borderWidth: 1, borderColor: '#333',
    alignItems: 'center',
  },
  cityBtnActive: { borderColor: '#e94560', backgroundColor: 'rgba(42,16,32,0.95)' },
  cityBtnText: { color: '#888', fontSize: 14, fontWeight: '700' },
  cityBtnTextActive: { color: '#e94560' },

  layerRow: {
    position: 'absolute', top: 60, left: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  layerBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 16,
    backgroundColor: 'rgba(15,15,26,0.85)', borderWidth: 1, borderColor: '#333',
    alignItems: 'center',
  },
  layerBtnZTL: { borderColor: '#e94560', backgroundColor: 'rgba(42,16,32,0.9)' },
  layerBtnTransit: { borderColor: '#4a9', backgroundColor: 'rgba(10,30,20,0.9)' },
  layerBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  legend: {
    position: 'absolute', bottom: 120, right: 12,
    backgroundColor: 'rgba(15,15,26,0.9)', borderRadius: 10, padding: 10, gap: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendLine: { width: 20, height: 4, borderRadius: 2 },
  legendText: { color: '#fff', fontSize: 11 },

  warning: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#1a0a0f', borderWidth: 1, borderColor: '#e94560',
    borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  warningIcon: { fontSize: 26 },
  warningTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  warningSubtitle: { color: '#aaa', fontSize: 12, marginTop: 2 },
});

const mk = StyleSheet.create({
  pin: {
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#fff',
  },
  pinText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

const sm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  lineBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lineBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stopName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  close: { fontSize: 18, color: '#888' },
  note: { fontSize: 14, color: '#aaa', marginBottom: 12, lineHeight: 20, backgroundColor: '#0f0f1a', padding: 10, borderRadius: 8 },
  attractionsLabel: { fontSize: 12, fontWeight: '700', color: '#e94560', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  attractionRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  attractionDot: { color: '#e94560', fontSize: 16, lineHeight: 20 },
  attractionText: { flex: 1, color: '#fff', fontSize: 14, lineHeight: 20 },
});
