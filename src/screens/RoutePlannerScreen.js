import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, FlatList, Image, Modal, TextInput,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import ROUTES from '../data/routes';
import DESTINATIONS from '../data/destinations';
import { findNearestStation } from '../data/transitData';
import { generateItinerary } from '../services/claudeApi';
import IMAGES from '../assets/imageMap';

// ── Build selectable POI list from destinations data ─────────────────────────
function getPOIsForCity(cityId) {
  const dest = DESTINATIONS.find(d => d.id === cityId);
  if (!dest) return [];
  const pois = [];
  (dest.museums || []).forEach(m => pois.push({ name: m.name, category: 'Museum', icon: '🏛️' }));
  (dest.churches || []).forEach(c => pois.push({ name: c.name, category: 'Church', icon: '⛪' }));
  (dest.neighborhoods || []).forEach(n => pois.push({ name: n.name, category: 'Neighbourhood', icon: '📍' }));
  // Add well-known landmarks not in museums/churches
  if (cityId === 'rome') {
    pois.push({ name: 'Trevi Fountain', category: 'Landmark', icon: '⛲' });
    pois.push({ name: 'Spanish Steps', category: 'Landmark', icon: '🪜' });
    pois.push({ name: 'Piazza Navona', category: 'Landmark', icon: '🏛️' });
    pois.push({ name: 'Castel Sant\'Angelo', category: 'Landmark', icon: '🏰' });
    pois.push({ name: 'Circus Maximus', category: 'Landmark', icon: '🏟️' });
  }
  if (cityId === 'florence') {
    pois.push({ name: 'Ponte Vecchio', category: 'Landmark', icon: '🌉' });
    pois.push({ name: 'Piazzale Michelangelo', category: 'Landmark', icon: '🌅' });
    pois.push({ name: 'Piazza della Signoria', category: 'Landmark', icon: '🏛️' });
    pois.push({ name: 'Mercato Centrale', category: 'Landmark', icon: '🍝' });
    pois.push({ name: 'Medici Chapels', category: 'Landmark', icon: '⛪' });
  }
  return pois;
}

// ── Colour palette (matches app dark theme) ──────────────────────────────────
const BG       = '#1a1a2e';
const CARD     = '#16213e';
const ACCENT   = '#e94560';
const TEXT      = '#eee';
const DIM       = '#888';
const SURFACE   = '#0f3460';

function imgSource(imageKey) {
  if (imageKey && IMAGES[imageKey]) return IMAGES[imageKey];
  return null;
}

// ── Interest chips for AI customisation ──────────────────────────────────────
const INTERESTS = [
  { key: 'art',          label: 'Art',           icon: '🎨' },
  { key: 'history',      label: 'History',       icon: '📜' },
  { key: 'food',         label: 'Food & Wine',   icon: '🍷' },
  { key: 'architecture', label: 'Architecture',  icon: '🏛️' },
  { key: 'views',        label: 'Views & Parks', icon: '🌅' },
  { key: 'offbeat',      label: 'Off the Path',  icon: '🗝️' },
  { key: 'shopping',     label: 'Shopping',      icon: '🛍️' },
  { key: 'churches',     label: 'Churches',      icon: '⛪' },
];

const DURATION_OPTIONS = [
  { key: 'half-day', label: 'Half Day' },
  { key: 'full-day', label: 'Full Day' },
];

// ── Stop timeline card ───────────────────────────────────────────────────────
function StopCard({ stop, index, total, city }) {
  const station = stop.nearestStation || null;
  const isLast = index === total - 1;
  const src = imgSource(stop.imageKey);

  return (
    <View style={sc.row}>
      {/* Timeline spine */}
      <View style={sc.spine}>
        <View style={[sc.dot, index === 0 && sc.dotFirst, isLast && sc.dotLast]}>
          <Text style={sc.dotText}>{index + 1}</Text>
        </View>
        {!isLast && <View style={sc.line} />}
      </View>

      {/* Content */}
      <View style={[sc.card, isLast && { marginBottom: 24 }]}>
        {src && (
          <Image source={src} style={sc.thumb} resizeMode="cover" />
        )}
        <Text style={sc.stopName}>{stop.name}</Text>

        {/* Time chips */}
        <View style={sc.chipRow}>
          {stop.walkMin > 0 && (
            <View style={sc.chip}>
              <Text style={sc.chipText}>🚶 {stop.walkMin} min walk</Text>
            </View>
          )}
          <View style={sc.chip}>
            <Text style={sc.chipText}>⏱ {stop.visitMin} min visit</Text>
          </View>
        </View>

        {/* Tip */}
        {stop.tip && <Text style={sc.tip}>{stop.tip}</Text>}

        {/* Transit hint */}
        {station && (
          <View style={sc.transit}>
            <Text style={sc.transitIcon}>🚇</Text>
            <Text style={sc.transitText}>
              {station.name} ({station.line}) — {station.walkMin} min walk
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Route detail view (map + timeline) ───────────────────────────────────────
function RouteDetailView({ route, city, onBack }) {
  const mapRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  // Build stops with transit info for AI-generated routes (they lack nearestStation)
  const stopsWithTransit = useMemo(() =>
    route.stops.map(s => ({
      ...s,
      coordinate: s.coordinate || { latitude: s.latitude, longitude: s.longitude },
      nearestStation: s.nearestStation || findNearestStation(
        s.coordinate || { latitude: s.latitude, longitude: s.longitude },
        city
      ),
    })),
    [route, city]
  );

  const coords = stopsWithTransit.map(s => s.coordinate);
  const totalWalk = stopsWithTransit.reduce((a, s) => a + (s.walkMin || 0), 0);
  const totalVisit = stopsWithTransit.reduce((a, s) => a + (s.visitMin || 0), 0);
  const region = {
    latitude: coords.reduce((a, c) => a + c.latitude, 0) / coords.length,
    longitude: coords.reduce((a, c) => a + c.longitude, 0) / coords.length,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View style={styles.flex}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={rd.map}
        initialRegion={region}
        showsUserLocation
      >
        {/* Route polyline */}
        <Polyline coordinates={coords} strokeColor={ACCENT} strokeWidth={3} lineDashPattern={[6, 4]} />

        {/* Stop markers */}
        {stopsWithTransit.map((stop, i) => (
          <Marker
            key={i}
            coordinate={stop.coordinate}
            title={`${i + 1}. ${stop.name}`}
            description={stop.tip}
          >
            <View style={rd.marker}>
              <Text style={rd.markerText}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Back button overlaid on map */}
      <TouchableOpacity style={rd.backBtn} onPress={onBack}>
        <Text style={rd.backText}>‹ Back</Text>
      </TouchableOpacity>

      {/* Scrollable timeline */}
      <ScrollView style={rd.timeline} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={rd.title}>{route.title}</Text>
        {route.description && <Text style={rd.desc}>{route.description}</Text>}

        <View style={rd.summaryRow}>
          <View style={rd.summaryChip}>
            <Text style={rd.summaryText}>🚶 {totalWalk} min walking</Text>
          </View>
          <View style={rd.summaryChip}>
            <Text style={rd.summaryText}>⏱ {totalVisit} min visiting</Text>
          </View>
          <View style={rd.summaryChip}>
            <Text style={rd.summaryText}>📍 {stopsWithTransit.length} stops</Text>
          </View>
        </View>

        {stopsWithTransit.map((stop, i) => (
          <StopCard key={i} stop={stop} index={i} total={stopsWithTransit.length} city={city} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── AI Customise modal ───────────────────────────────────────────────────────
function CustomiseModal({ visible, city, baseRoute, onClose, onResult }) {
  const [interests, setInterests] = useState([]);
  const [duration, setDuration] = useState('full-day');
  const [startingPoint, setStartingPoint] = useState('');
  const [selectedPOIs, setSelectedPOIs] = useState([]);
  const [loading, setLoading] = useState(false);

  const pois = useMemo(() => getPOIsForCity(city), [city]);

  function toggleInterest(key) {
    setInterests(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function togglePOI(name) {
    setSelectedPOIs(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  async function generate() {
    setLoading(true);
    try {
      const raw = await generateItinerary(
        city, duration, interests,
        startingPoint.trim() || null,
        baseRoute,
        selectedPOIs,
      );
      const parsed = JSON.parse(raw);
      if (!parsed.stops?.length) throw new Error('No stops returned');
      // Normalise coordinates
      parsed.stops = parsed.stops.map(s => ({
        ...s,
        coordinate: { latitude: s.latitude, longitude: s.longitude },
      }));
      parsed.id = 'ai-custom-' + Date.now();
      parsed.icon = '✨';
      onResult(parsed);
    } catch (e) {
      Alert.alert('Could not generate route', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cm.overlay}>
        <ScrollView style={cm.sheet} contentContainerStyle={{ paddingBottom: 36 }}>
          <View style={cm.header}>
            <Text style={cm.title}>
              {baseRoute ? 'Customise Route' : 'Create AI Route'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={cm.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {baseRoute && (
            <Text style={cm.base}>Based on: {baseRoute.title}</Text>
          )}

          {/* Starting point */}
          <Text style={cm.sectionLabel}>Starting Point</Text>
          <TextInput
            style={cm.textInput}
            value={startingPoint}
            onChangeText={setStartingPoint}
            placeholder="e.g. Hotel near Termini, Piazza del Popolo"
            placeholderTextColor="#555"
          />

          {/* Must-visit POIs */}
          <Text style={cm.sectionLabel}>Places to Visit</Text>
          <Text style={cm.hint}>Select the places you want included in your route</Text>
          <View style={cm.chipRow}>
            {pois.map(p => (
              <TouchableOpacity
                key={p.name}
                style={[cm.chip, selectedPOIs.includes(p.name) && cm.chipActive]}
                onPress={() => togglePOI(p.name)}
              >
                <Text style={[cm.chipText, selectedPOIs.includes(p.name) && cm.chipTextActive]}>
                  {p.icon} {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={cm.sectionLabel}>Duration</Text>
          <View style={cm.chipRow}>
            {DURATION_OPTIONS.map(d => (
              <TouchableOpacity
                key={d.key}
                style={[cm.chip, duration === d.key && cm.chipActive]}
                onPress={() => setDuration(d.key)}
              >
                <Text style={[cm.chipText, duration === d.key && cm.chipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={cm.sectionLabel}>Interests</Text>
          <Text style={cm.hint}>Optional — influences how the route fills gaps between your selected places</Text>
          <View style={cm.chipRow}>
            {INTERESTS.map(i => (
              <TouchableOpacity
                key={i.key}
                style={[cm.chip, interests.includes(i.key) && cm.chipActive]}
                onPress={() => toggleInterest(i.key)}
              >
                <Text style={[cm.chipText, interests.includes(i.key) && cm.chipTextActive]}>
                  {i.icon} {i.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[cm.generateBtn, loading && { opacity: 0.6 }]}
            onPress={generate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={cm.generateText}>
                ✨  Generate Itinerary
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function RoutePlannerScreen() {
  const [city, setCity] = useState('rome');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showCustomise, setShowCustomise] = useState(false);
  const [customiseBase, setCustomiseBase] = useState(null);

  const routes = ROUTES[city] || [];

  function openCustomise(baseRoute) {
    setCustomiseBase(baseRoute || null);
    setShowCustomise(true);
  }

  function handleAIResult(route) {
    setShowCustomise(false);
    setSelectedRoute(route);
  }

  // ── Route detail view ──
  if (selectedRoute) {
    return (
      <RouteDetailView
        route={selectedRoute}
        city={city}
        onBack={() => setSelectedRoute(null)}
      />
    );
  }

  // ── Route list view ──
  return (
    <View style={styles.container}>
      {/* City picker */}
      <View style={styles.cityRow}>
        {['rome', 'florence'].map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.cityBtn, city === c && styles.cityBtnActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.cityText, city === c && styles.cityTextActive]}>
              {c === 'rome' ? '🏛️ Rome' : '🌸 Florence'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create AI route button */}
      <TouchableOpacity style={styles.aiBtn} onPress={() => openCustomise(null)}>
        <Text style={styles.aiBtnText}>✨  Create Custom AI Route</Text>
      </TouchableOpacity>

      {/* Pre-built route cards */}
      <FlatList
        data={routes}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.routeCard}
            onPress={() => setSelectedRoute(item)}
            activeOpacity={0.8}
          >
            <View style={styles.routeHeader}>
              <Text style={styles.routeIcon}>{item.icon}</Text>
              <View style={styles.routeHeaderText}>
                <Text style={styles.routeTitle}>{item.title}</Text>
                <Text style={styles.routeSubtitle}>{item.subtitle}</Text>
              </View>
            </View>

            <Text style={styles.routeDesc}>{item.description}</Text>

            <View style={styles.routeMeta}>
              <Text style={styles.routeMetaText}>⏱ {item.duration}</Text>
              <Text style={styles.routeMetaText}>🚶 {item.distance}</Text>
              <Text style={styles.routeMetaText}>📍 {item.stops.length} stops</Text>
            </View>

            {/* Quick-view stop list */}
            <View style={styles.stopPreview}>
              {item.stops.map((s, i) => (
                <View key={i} style={styles.stopPreviewItem}>
                  <View style={styles.stopPreviewDot}>
                    <Text style={styles.stopPreviewNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stopPreviewName} numberOfLines={1}>{s.name}</Text>
                </View>
              ))}
            </View>

            {/* Customise button */}
            <TouchableOpacity
              style={styles.customiseBtn}
              onPress={() => openCustomise(item)}
            >
              <Text style={styles.customiseBtnText}>✨ Customise with AI</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <CustomiseModal
        visible={showCustomise}
        city={city}
        baseRoute={customiseBase}
        onClose={() => setShowCustomise(false)}
        onResult={handleAIResult}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 8 },

  // City picker
  cityRow: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  cityBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: CARD, alignItems: 'center',
  },
  cityBtnActive: { backgroundColor: ACCENT },
  cityText: { color: DIM, fontWeight: '600', fontSize: 15 },
  cityTextActive: { color: '#fff' },

  // AI create button
  aiBtn: {
    backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: ACCENT, borderStyle: 'dashed',
  },
  aiBtnText: { color: ACCENT, fontWeight: '700', fontSize: 15 },

  // Route cards
  routeCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 14,
  },
  routeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeIcon: { fontSize: 28, marginRight: 12 },
  routeHeaderText: { flex: 1 },
  routeTitle: { color: TEXT, fontSize: 17, fontWeight: '700' },
  routeSubtitle: { color: DIM, fontSize: 13, marginTop: 2 },
  routeDesc: { color: '#bbb', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  routeMeta: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  routeMetaText: { color: DIM, fontSize: 12 },

  // Stop previews
  stopPreview: { marginBottom: 12 },
  stopPreviewItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stopPreviewDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  stopPreviewNum: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stopPreviewName: { color: TEXT, fontSize: 13, flex: 1 },

  // Customise button
  customiseBtn: {
    backgroundColor: SURFACE, borderRadius: 8, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#334',
  },
  customiseBtnText: { color: ACCENT, fontWeight: '600', fontSize: 13 },
});

// ── StopCard styles ──────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 4 },
  spine: { alignItems: 'center', width: 36, marginRight: 8 },
  dot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  dotFirst: { backgroundColor: '#2ecc71' },
  dotLast: { backgroundColor: '#e74c3c' },
  dotText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  line: { flex: 1, width: 2, backgroundColor: '#334', marginVertical: -2 },

  card: {
    flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 14,
    marginBottom: 8,
  },
  thumb: { width: '100%', height: 100, borderRadius: 8, marginBottom: 10 },
  stopName: { color: TEXT, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: SURFACE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { color: DIM, fontSize: 12 },
  tip: { color: '#bbb', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  transit: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE,
    borderRadius: 8, padding: 8, marginTop: 4,
  },
  transitIcon: { fontSize: 14, marginRight: 6 },
  transitText: { color: '#aaa', fontSize: 12, flex: 1 },
});

// ── Route detail styles ──────────────────────────────────────────────────────
const rd = StyleSheet.create({
  map: { height: 260 },
  backBtn: {
    position: 'absolute', top: 50, left: 16, backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  timeline: { flex: 1, backgroundColor: BG, paddingHorizontal: 12, paddingTop: 14 },
  title: { color: TEXT, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  desc: { color: '#bbb', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  summaryChip: { backgroundColor: SURFACE, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  summaryText: { color: DIM, fontSize: 12 },
  marker: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  markerText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});

// ── Customise modal styles ───────────────────────────────────────────────────
const cm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { color: TEXT, fontSize: 18, fontWeight: '700' },
  close: { color: DIM, fontSize: 22, padding: 4 },
  base: { color: DIM, fontSize: 13, marginBottom: 14 },
  sectionLabel: { color: TEXT, fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  hint: { color: DIM, fontSize: 12, marginBottom: 8 },
  textInput: {
    backgroundColor: SURFACE, color: TEXT, fontSize: 14,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#334',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    backgroundColor: SURFACE, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#334',
  },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { color: DIM, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  generateBtn: {
    backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 18,
  },
  generateText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
