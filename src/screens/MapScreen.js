import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Modal, Linking,
} from 'react-native';
import MapView, { Polygon, Polyline, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import ZTL_ZONES from '../data/ztlZones';
import {
  ROME_TRANSIT_LINES, ROME_STOPS,
  FLORENCE_TRANSIT_LINES, FLORENCE_STOPS,
} from '../data/transitData';
import PLACES from '../data/places';

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

// ── ZTL active-hours check (Italy local time) ────────────────────────────────
function getItalyTime() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(now);
  const dayStr = parts.find(p => p.type === 'weekday').value;
  const hour   = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minute  = parseInt(parts.find(p => p.type === 'minute').value, 10);
  const dayMap  = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[dayStr], mins: hour * 60 + minute };
}

function isZtlActive(hoursStr) {
  if (!hoursStr) return false;
  if (hoursStr.startsWith('All times')) return true;

  const { day, mins } = getItalyTime();
  const clean = hoursStr.replace(/\s*\(.*?\)\s*/g, '').trim();
  const rules = clean.split(',').map(r => r.trim());

  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

  for (const rule of rules) {
    const m = rule.match(/^(.+?)\s+(\d{1,2}):(\d{2})[-–](\d{1,2}):(\d{2})$/);
    if (!m) continue;
    const [, dayPart, sH, sM, eH, eM] = m;
    const start = parseInt(sH, 10) * 60 + parseInt(sM, 10);
    const end   = parseInt(eH, 10) * 60 + parseInt(eM, 10);

    let days = [];
    if (dayPart === 'Daily') {
      days = [0, 1, 2, 3, 4, 5, 6];
    } else {
      const range = dayPart.split(/[-–]/);
      if (range.length === 2 && dayMap[range[0]] !== undefined && dayMap[range[1]] !== undefined) {
        let d = dayMap[range[0]];
        const last = dayMap[range[1]];
        while (true) { days.push(d); if (d === last) break; d = (d + 1) % 7; }
      } else if (dayMap[range[0]] !== undefined) {
        days = [dayMap[range[0]]];
      }
    }

    if (end > start) {
      // Same-day range (e.g. 6:30–18:00)
      if (days.includes(day) && mins >= start && mins < end) return true;
    } else {
      // Cross-midnight (e.g. 23:00–03:00)
      if (days.includes(day) && mins >= start) return true;
      if (days.includes((day + 6) % 7) && mins < end) return true;
    }
  }
  return false;
}

// ── Deduplicate stops and flag interchanges ───────────────────────────────────
// Stops shared by multiple lines have the same coordinate. Collapse them into
// one marker entry and tag it isInterchange so we can render it differently.
function computeDisplayStops(stops) {
  const coordMap = {};
  stops.forEach(stop => {
    const key = `${stop.coordinate.latitude.toFixed(4)},${stop.coordinate.longitude.toFixed(4)}`;
    if (!coordMap[key]) coordMap[key] = [];
    coordMap[key].push(stop);
  });
  return Object.values(coordMap).map(group => ({
    ...group[0],
    isInterchange: group.length > 1,
    lines: group.map(s => ({ line: s.line, color: s.color })),
  }));
}

// ── Stop Detail Modal ─────────────────────────────────────────────────────────
function StopModal({ stop, onClose }) {
  if (!stop) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.header}>
            <View style={sm.badgeRow}>
              {(stop.lines || [{ line: stop.line, color: stop.color }]).map(({ line, color }, i) => (
                <View key={i} style={[sm.lineBadge, { backgroundColor: color }]}>
                  <Text style={sm.lineBadgeText}>{line}</Text>
                </View>
              ))}
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

// ── Places (Claude-curated) ───────────────────────────────────────────────────
const PLACE_CATS = [
  { key: 'cafe',       icon: '☕', label: 'Coffee' },
  { key: 'restaurant', icon: '🍽️', label: 'Restaurant' },
  { key: 'pizza',      icon: '🍕', label: 'Pizza' },
  { key: 'gelato',     icon: '🍦', label: 'Gelato' },
];

function PlaceModal({ place, icon, onClose }) {
  if (!place) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.header}>
            <Text style={{ fontSize: 28 }}>{icon}</Text>
            <Text style={sm.stopName}>{place.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={sm.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {place.neighborhood && (
            <View style={pm.neighborhoodBadge}>
              <Text style={pm.neighborhoodText}>📍 {place.neighborhood}</Text>
              {place.price && <Text style={pm.priceText}>{place.price}</Text>}
            </View>
          )}
          {place.description && (
            <Text style={pm.description}>{place.description}</Text>
          )}
          {place.specialty && (
            <View style={pm.specialtyBox}>
              <Text style={pm.specialtyLabel}>What to order</Text>
              <Text style={pm.specialtyText}>{place.specialty}</Text>
            </View>
          )}
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
  const [ztlFilter, setZtlFilter]    = useState('active'); // 'active' | 'day' | 'night' | 'all'
  const [showTransit, setShowTransit] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [showPlaces, setShowPlaces]     = useState(false);
  const [placeType, setPlaceType]       = useState('cafe');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);

  const city = CITIES.find(c => c.id === selectedCity);

  const places = showPlaces
    ? (PLACES[selectedCity]?.[placeType] ?? []).map((p, i) => ({ ...p, id: `${placeType}-${i}`, lat: p.latitude, lng: p.longitude }))
    : [];

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
        {/* ZTL Zones — filtered by city and day/night/active */}
        {showZTL && ZTL_ZONES
          .filter(zone => zone.city.toLowerCase() === selectedCity)
          .filter(zone => {
            if (ztlFilter === 'all') return true;
            if (ztlFilter === 'active') return isZtlActive(zone.hours);
            return zone.type === 'all' || zone.type === ztlFilter;
          })
          .map(zone => {
            const isNight = zone.type === 'night';
            const active = isZtlActive(zone.hours);
            return (
              <Polygon
                key={zone.id}
                coordinates={zone.boundary}
                fillColor={isNight
                  ? (active ? 'rgba(147, 51, 234, 0.28)' : 'rgba(147, 51, 234, 0.10)')
                  : (active ? 'rgba(233, 69, 96, 0.28)' : 'rgba(233, 69, 96, 0.10)')}
                strokeColor={isNight ? '#9333ea' : '#e94560'}
                strokeWidth={active ? 3 : 1.5}
              />
            );
          })}

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
        {showTransit && computeDisplayStops(city.stops).map(stop => (
          <Marker
            key={stop.id}
            coordinate={stop.coordinate}
            onPress={() => setSelectedStop(stop)}
          >
            {stop.isInterchange
              ? <View style={mk.interchange} />
              : <View style={[mk.dot, { backgroundColor: stop.color }]} />
            }
          </Marker>
        ))}

        {/* Places */}
        {showPlaces && places.map(p => {
          const catIcon = PLACE_CATS.find(c => c.key === placeType)?.icon ?? '📍';
          return (
            <Marker
              key={`place-${p.id}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              onPress={() => setSelectedPlace(p)}
            >
              <View style={mk.placeMarker}>
                <Text style={mk.placeIcon}>{catIcon}</Text>
              </View>
            </Marker>
          );
        })}
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
          <Text style={styles.layerBtnText}>{showZTL ? '🚫' : '○'} ZTL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerBtn, showTransit && styles.layerBtnTransit]}
          onPress={() => setShowTransit(v => !v)}
        >
          <Text style={styles.layerBtnText}>{showTransit ? '🚇' : '○'} Transit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerBtn, showPlaces && styles.layerBtnPlaces]}
          onPress={() => setShowPlaces(v => !v)}
        >
          <Text style={styles.layerBtnText}>{showPlaces ? '📍' : '○'} Places</Text>
        </TouchableOpacity>
      </View>

      {/* ZTL filter chips */}
      {showZTL && (
        <View style={styles.ztlRow}>
          {['active', 'day', 'night', 'all'].map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.ztlChip,
                ztlFilter === key && (key === 'active' ? styles.ztlChipActiveNow : styles.ztlChipActive),
              ]}
              onPress={() => setZtlFilter(key)}
            >
              <Text style={[styles.ztlChipText, ztlFilter === key && styles.ztlChipTextActive]}>
                {key === 'active' ? 'Active Now' : key === 'day' ? 'Day' : key === 'night' ? 'Night' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ZTL zone legend with hours */}
      {showZTL && (() => {
        const visible = ZTL_ZONES
          .filter(z => z.city.toLowerCase() === selectedCity)
          .filter(z => {
            if (ztlFilter === 'all') return true;
            if (ztlFilter === 'active') return isZtlActive(z.hours);
            return z.type === 'all' || z.type === ztlFilter;
          });
        if (!visible.length) return null;
        return (
          <View style={styles.ztlLegend}>
            {visible.map(z => {
              const isNight = z.type === 'night';
              const active  = isZtlActive(z.hours);
              const zoneName = z.name
                .replace('ZTL ', '')
                .replace('Diurna ', '')
                .replace('Notturna ', '');
              return (
                <View key={z.id} style={styles.ztlLegendItem}>
                  <View style={[styles.ztlLegendSwatch, { backgroundColor: isNight ? '#9333ea' : '#e94560', opacity: active ? 1 : 0.4 }]} />
                  <Text style={[styles.ztlLegendName, !active && { opacity: 0.5 }]}>
                    {zoneName}{isNight ? ' (night)' : ''}
                  </Text>
                  {active && <Text style={styles.ztlLegendActive}>ACTIVE</Text>}
                </View>
              );
            })}
            <View style={styles.ztlLegendDivider} />
            {visible.map(z => {
              const active = isZtlActive(z.hours);
              const zoneName = z.name
                .replace('ZTL ', '')
                .replace('Diurna ', '')
                .replace('Notturna ', '');
              return (
                <Text key={z.id + '-h'} style={[styles.ztlLegendHours, active && { color: '#fff' }]}>
                  {zoneName}: {z.hours}
                </Text>
              );
            })}
          </View>
        );
      })()}

      {/* Place category chips */}
      {showPlaces && (
        <View style={[styles.catRow, showZTL && { top: 140 }]}>
          {PLACE_CATS.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.catChip, placeType === c.key && styles.catChipActive]}
              onPress={() => setPlaceType(c.key)}
            >
              <Text style={styles.catChipIcon}>{c.icon}</Text>
              <Text style={[styles.catChipText, placeType === c.key && styles.catChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>ZTL Zone: {activeZone.name}</Text>
            <Text style={styles.warningSubtitle}>{activeZone.hours}</Text>
            {activeZone.note ? <Text style={styles.warningNote}>{activeZone.note}</Text> : null}
          </View>
        </View>
      )}

      {/* Stop detail modal */}
      <StopModal stop={selectedStop} onClose={() => setSelectedStop(null)} />

      {/* Place detail modal */}
      <PlaceModal
        place={selectedPlace}
        icon={PLACE_CATS.find(c => c.key === placeType)?.icon ?? '📍'}
        onClose={() => setSelectedPlace(null)}
      />
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
  layerBtnPlaces:  { borderColor: '#f0a030', backgroundColor: 'rgba(40,25,5,0.9)' },
  layerBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  ztlRow: {
    position: 'absolute', top: 100, left: 12, right: 12,
    flexDirection: 'row', gap: 6,
  },
  ztlChip: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: 'rgba(15,15,26,0.85)', borderWidth: 1, borderColor: '#333',
    alignItems: 'center',
  },
  ztlChipActive: { borderColor: '#e94560', backgroundColor: 'rgba(42,16,32,0.9)' },
  ztlChipActiveNow: { borderColor: '#22c55e', backgroundColor: 'rgba(10,40,20,0.9)' },
  ztlChipText: { color: '#888', fontSize: 12, fontWeight: '600' },
  ztlChipTextActive: { color: '#fff' },

  ztlLegend: {
    position: 'absolute', bottom: 120, left: 12,
    backgroundColor: 'rgba(15,15,26,0.92)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(233,69,96,0.25)',
  },
  ztlLegendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ztlLegendSwatch: { width: 10, height: 10, borderRadius: 2, marginRight: 8 },
  ztlLegendName: { color: '#fff', fontSize: 11, fontWeight: '600' },
  ztlLegendActive: { color: '#22c55e', fontSize: 9, fontWeight: '800', marginLeft: 6 },
  ztlLegendDivider: { height: 1, backgroundColor: '#333', marginVertical: 6 },
  ztlLegendHours: { color: '#aaa', fontSize: 10, marginBottom: 2 },

  catRow: {
    position: 'absolute', top: 100, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(15,15,26,0.85)', borderRadius: 16,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#333',
  },
  catChipActive: { borderColor: '#f0a030', backgroundColor: 'rgba(40,25,5,0.9)' },
  catChipIcon: { fontSize: 14 },
  catChipText: { color: '#888', fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: '#f0a030' },

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
  warningNote: { color: '#ccc', fontSize: 11, marginTop: 4, lineHeight: 16 },
});

const mk = StyleSheet.create({
  dot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#fff',
  },
  interchange: {
    width: 15, height: 15, borderRadius: 7.5,
    backgroundColor: '#fff',
    borderWidth: 3, borderColor: '#222',
  },
  placeMarker: {
    backgroundColor: 'rgba(15,15,26,0.85)', borderRadius: 14,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#f0a030',
  },
  placeIcon: { fontSize: 15 },
});

const sm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 5 },
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

const pm = StyleSheet.create({
  neighborhoodBadge: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0f0f1a', borderRadius: 8, padding: 10, marginBottom: 12,
  },
  neighborhoodText: { color: '#888', fontSize: 13 },
  priceText:        { color: '#e94560', fontSize: 15, fontWeight: '800' },
  description:      { color: '#ccc', fontSize: 14, lineHeight: 21, marginBottom: 12 },
  specialtyBox: {
    backgroundColor: '#0f0f1a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  specialtyLabel: { fontSize: 11, fontWeight: '700', color: '#e94560', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  specialtyText:  { color: '#fff', fontSize: 14, lineHeight: 20 },
});
