import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Modal, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  initActivityDb,
  getActivityForDate,
  getRecentActivity,
} from '../services/activityDb';
import {
  startTracking,
  stopTracking,
  isTracking,
  checkPedometerAvailable,
  getTodaySteps,
  getTrackingState,
} from '../services/activityTracker';
import { getCurrentDestination } from '../services/destinationContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function weekdayShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

function regionFromCoords(coords) {
  if (!coords || coords.length === 0) return null;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }
  const latDelta = Math.max((maxLat - minLat) * 1.4, 0.005);
  const lngDelta = Math.max((maxLng - minLng) * 1.4, 0.005);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const cardRef = useRef(null);

  const [tracking, setTracking] = useState(isTracking());
  const [steps, setSteps] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [activeMin, setActiveMin] = useState(0);
  const [pathCoords, setPathCoords] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [pedAvail, setPedAvail] = useState(null);
  const [shareModal, setShareModal] = useState(false);
  const [mapSnapshot, setMapSnapshot] = useState(null);
  const [sharing, setSharing] = useState(false);

  // ── Init & load ──
  useEffect(() => {
    initActivityDb();
    checkPedometerAvailable().then(setPedAvail);
    loadFromDb();
    // On iOS fetch today's steps from HealthKit even without tracking
    if (Platform.OS === 'ios') {
      getTodaySteps().then((s) => { if (s !== null && !isTracking()) setSteps(s); });
    }
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFromDb();
      if (isTracking()) {
        const state = getTrackingState();
        applyState(state);
      }
    }, [])
  );

  function loadFromDb() {
    const today = getActivityForDate(todayStr());
    if (today && !isTracking()) {
      setSteps(today.steps);
      setDistanceKm(today.distance_km);
      setActiveMin(today.active_min);
      if (today.path_json) {
        try {
          const pts = JSON.parse(today.path_json);
          setPathCoords(pts.map((p) => ({ latitude: p.lat, longitude: p.lng })));
        } catch {}
      }
    }
    setWeekData(getRecentActivity(7));
  }

  function applyState(state) {
    setSteps(state.steps);
    setDistanceKm(state.distanceKm);
    setActiveMin(state.activeMin);
    setPathCoords(state.pathCoords);
  }

  // ── Tracking toggle ──
  async function handleToggleTracking() {
    if (tracking) {
      await stopTracking();
      setTracking(false);
      loadFromDb();
    } else {
      await startTracking((state) => applyState(state));
      setTracking(true);
    }
  }

  // ── Share card ──
  async function handleOpenShare() {
    // Capture map snapshot first
    if (mapRef.current && pathCoords.length > 0) {
      try {
        const uri = await mapRef.current.takeSnapshot({ format: 'png', quality: 0.8, result: 'file' });
        setMapSnapshot(uri);
      } catch {
        setMapSnapshot(null);
      }
    }
    setShareModal(true);
  }

  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your activity' });
    } catch {}
    setSharing(false);
  }

  // ── Derived data ──
  const region = regionFromCoords(pathCoords);
  const destination = getCurrentDestination();
  const maxWeekSteps = weekData.reduce((m, d) => Math.max(m, d.steps), 1);

  // Fill week data to always show 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const found = weekData.find((w) => w.date === ds);
    last7.push({ date: ds, steps: found ? found.steps : 0 });
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Date header ── */}
        <Text style={s.dateText}>{formatDateLong(todayStr())}</Text>

        {/* ── Stat cards ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statIcon}>👣</Text>
            <Text style={s.statValue}>{steps.toLocaleString()}</Text>
            <Text style={s.statLabel}>Steps</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>📏</Text>
            <Text style={s.statValue}>{distanceKm.toFixed(1)}</Text>
            <Text style={s.statLabel}>km</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statIcon}>⏱️</Text>
            <Text style={s.statValue}>{activeMin}</Text>
            <Text style={s.statLabel}>min</Text>
          </View>
        </View>

        {/* ── Pedometer notice ── */}
        {pedAvail === false && (
          <Text style={s.notice}>Step counting requires a physical device</Text>
        )}

        {/* ── Tracking button ── */}
        <TouchableOpacity
          style={[s.trackBtn, tracking && s.trackBtnActive]}
          onPress={handleToggleTracking}
          activeOpacity={0.7}
        >
          <Text style={s.trackBtnIcon}>{tracking ? '⏸' : '▶'}</Text>
          <Text style={s.trackBtnText}>
            {tracking ? 'Tracking...' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
        {tracking && (
          <Text style={s.trackNotice}>Tracking pauses when app is in background</Text>
        )}

        {/* ── Path map ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Today's Route</Text>
        </View>
        {pathCoords.length > 1 && region ? (
          <View style={s.mapContainer}>
            <MapView
              ref={mapRef}
              style={s.map}
              initialRegion={region}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Polyline
                coordinates={pathCoords}
                strokeColor="#e94560"
                strokeWidth={3}
              />
              <Marker coordinate={pathCoords[0]} pinColor="green" />
              <Marker coordinate={pathCoords[pathCoords.length - 1]} pinColor="red" />
            </MapView>
          </View>
        ) : (
          <View style={s.mapEmpty}>
            <Text style={s.mapEmptyIcon}>🗺️</Text>
            <Text style={s.mapEmptyText}>
              {tracking
                ? 'Walk around to see your path'
                : 'Start tracking to record your route'}
            </Text>
          </View>
        )}

        {/* ── Week history ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>This Week</Text>
        </View>
        <View style={s.weekCard}>
          <View style={s.weekBars}>
            {last7.map((d) => {
              const pct = maxWeekSteps > 0 ? (d.steps / maxWeekSteps) * 100 : 0;
              const isToday = d.date === todayStr();
              return (
                <View key={d.date} style={s.weekBarCol}>
                  <Text style={s.weekBarValue}>
                    {d.steps > 0 ? formatNumber(d.steps) : ''}
                  </Text>
                  <View style={s.weekBarTrack}>
                    <View
                      style={[
                        s.weekBarFill,
                        { height: `${Math.max(pct, 4)}%` },
                        isToday && s.weekBarToday,
                      ]}
                    />
                  </View>
                  <Text style={[s.weekBarDay, isToday && s.weekBarDayToday]}>
                    {weekdayShort(d.date)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Share button ── */}
        <TouchableOpacity style={s.shareBtn} onPress={handleOpenShare} activeOpacity={0.7}>
          <Text style={s.shareBtnText}>Share Today's Activity</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Share card modal ── */}
      <Modal visible={shareModal} animationType="slide" transparent onRequestClose={() => setShareModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Share Card</Text>
              <TouchableOpacity onPress={() => setShareModal(false)}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* The capturable card */}
              <View ref={cardRef} style={s.card} collapsable={false}>
                <Text style={s.cardApp}>Travel Companion</Text>
                {destination && (
                  <Text style={s.cardCity}>
                    📍 {destination.name}, {destination.region}
                  </Text>
                )}
                <Text style={s.cardDate}>{formatDateLong(todayStr())}</Text>

                <Text style={s.cardSteps}>{steps.toLocaleString()}</Text>
                <Text style={s.cardStepsLabel}>steps today</Text>

                <View style={s.cardRow}>
                  <View style={s.cardStat}>
                    <Text style={s.cardStatValue}>{distanceKm.toFixed(1)} km</Text>
                    <Text style={s.cardStatLabel}>walked</Text>
                  </View>
                  <View style={s.cardDivider} />
                  <View style={s.cardStat}>
                    <Text style={s.cardStatValue}>{activeMin} min</Text>
                    <Text style={s.cardStatLabel}>active</Text>
                  </View>
                </View>

                {mapSnapshot && (
                  <Image source={{ uri: mapSnapshot }} style={s.cardMap} resizeMode="cover" />
                )}

                <Text style={s.cardFooter}>--- Travel Companion ---</Text>
              </View>

              <TouchableOpacity
                style={[s.shareBtn, { marginTop: 16, marginHorizontal: 0 }]}
                onPress={handleShare}
                disabled={sharing}
                activeOpacity={0.7}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.shareBtnText}>Share</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { padding: 16, paddingBottom: 40 },

  // Date
  dateText: { fontSize: 14, color: '#888', fontWeight: '600', textAlign: 'center', marginBottom: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a50',
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#e94560' },
  statLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  // Pedometer notice
  notice: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  // Tracking button
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#e94560', borderRadius: 14, paddingVertical: 16, marginTop: 16,
  },
  trackBtnActive: { backgroundColor: '#2ecc71' },
  trackBtnIcon: { fontSize: 16, color: '#fff' },
  trackBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  trackNotice: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 6 },

  // Sections
  sectionHeader: { marginTop: 24, marginBottom: 10 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Map
  mapContainer: {
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a50',
  },
  map: { height: 200 },
  mapEmpty: {
    height: 160, backgroundColor: '#1a1a2e', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2a2a50',
  },
  mapEmptyIcon: { fontSize: 36, marginBottom: 8 },
  mapEmptyText: { fontSize: 14, color: '#555', textAlign: 'center' },

  // Week bars
  weekCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  weekBars: { flexDirection: 'row', justifyContent: 'space-between', height: 140 },
  weekBarCol: { alignItems: 'center', flex: 1 },
  weekBarValue: { fontSize: 10, color: '#888', fontWeight: '600', marginBottom: 4, height: 14 },
  weekBarTrack: {
    flex: 1, width: 20, backgroundColor: '#0f0f1a', borderRadius: 10,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  weekBarFill: { backgroundColor: '#e9456050', borderRadius: 10 },
  weekBarToday: { backgroundColor: '#e94560' },
  weekBarDay: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 6 },
  weekBarDayToday: { color: '#e94560' },

  // Share button
  shareBtn: {
    backgroundColor: '#1a1a2e', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
    borderWidth: 1, borderColor: '#e94560',
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#e94560' },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, maxHeight: '90%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sheetClose: { fontSize: 18, color: '#888' },

  // Shareable card
  card: {
    backgroundColor: '#0f0f1a', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a50',
  },
  cardApp: { fontSize: 14, fontWeight: '700', color: '#e94560', letterSpacing: 1, textTransform: 'uppercase' },
  cardCity: { fontSize: 15, color: '#fff', fontWeight: '600', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 20 },
  cardSteps: { fontSize: 56, fontWeight: '800', color: '#e94560' },
  cardStepsLabel: { fontSize: 14, color: '#888', fontWeight: '600', marginTop: -2 },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    gap: 20,
  },
  cardStat: { alignItems: 'center' },
  cardStatValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardStatLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  cardDivider: { width: 1, height: 30, backgroundColor: '#2a2a50' },
  cardMap: { width: '100%', height: 140, borderRadius: 10, marginTop: 20 },
  cardFooter: { fontSize: 11, color: '#555', marginTop: 16, letterSpacing: 2 },
});
