import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import {
  initActivityDb,
  getActivityForDate,
  upsertActivity,
  appendPathPoints,
} from './activityDb';

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

function pathDistanceKm(points) {
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    km += haversineKm(points[i - 1], points[i]);
  }
  return km;
}

// ── State ────────────────────────────────────────────────────────────────────

let _tracking = false;
let _pedometerSub = null;
let _locationSub = null;
let _flushInterval = null;
let _onUpdate = null;

// Accumulated data for current session
let _sessionSteps = 0;       // steps counted in this subscription
let _baselineSteps = 0;      // steps already stored in DB when we started
let _pathBuffer = [];         // new GPS points not yet flushed
let _allPathPoints = [];      // full day path (flushed + buffer)
let _startTime = null;        // when tracking started this session
let _pedometerAvailable = null;

// ── Public API ───────────────────────────────────────────────────────────────

export function isTracking() {
  return _tracking;
}

export async function checkPedometerAvailable() {
  if (_pedometerAvailable === null) {
    _pedometerAvailable = await Pedometer.isAvailableAsync();
  }
  return _pedometerAvailable;
}

/** On iOS, query HealthKit for today's total steps without needing an active tracking session. */
export async function getTodaySteps() {
  if (Platform.OS !== 'ios') return null;
  const avail = await checkPedometerAvailable();
  if (!avail) return null;
  try {
    const { steps } = await Pedometer.getStepCountAsync(startOfToday(), new Date());
    return steps;
  } catch {
    return null;
  }
}

export async function startTracking(onUpdate) {
  if (_tracking) return;

  initActivityDb();
  _tracking = true;
  _onUpdate = onUpdate;
  _sessionSteps = 0;
  _pathBuffer = [];
  _startTime = Date.now();

  // Load existing day data as baseline
  const existing = getActivityForDate(todayStr());
  _baselineSteps = existing ? existing.steps : 0;
  _allPathPoints = existing && existing.path_json
    ? JSON.parse(existing.path_json)
    : [];

  // ── Pedometer ──
  const pedAvail = await checkPedometerAvailable();
  if (pedAvail) {
    if (Platform.OS === 'ios') {
      // Get today's total from HealthKit as the true baseline
      try {
        const { steps } = await Pedometer.getStepCountAsync(startOfToday(), new Date());
        _baselineSteps = steps;
      } catch {}
    }
    _pedometerSub = Pedometer.watchStepCount(({ steps }) => {
      _sessionSteps = steps; // incremental since subscription start
      _emitUpdate();
    });
  }

  // ── GPS ──
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    _locationSub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 10000 },
      (loc) => {
        const pt = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          ts: Math.floor(loc.timestamp / 1000),
        };
        _pathBuffer.push(pt);
        _allPathPoints.push(pt);
        _emitUpdate();
      }
    );
  }

  // ── Periodic flush ──
  _flushInterval = setInterval(() => _flush(), 30000);

  _emitUpdate();
}

export async function stopTracking() {
  if (!_tracking) return;

  if (_pedometerSub) { _pedometerSub.remove(); _pedometerSub = null; }
  if (_locationSub) { _locationSub.remove(); _locationSub = null; }
  if (_flushInterval) { clearInterval(_flushInterval); _flushInterval = null; }

  // Final flush
  _flush();

  _tracking = false;
  _onUpdate = null;
  _startTime = null;
}

export function getTrackingState() {
  const totalSteps = Platform.OS === 'ios'
    ? _baselineSteps + _sessionSteps  // iOS: HealthKit baseline covers pre-session
    : _baselineSteps + _sessionSteps; // Android: DB baseline + session delta

  const gpsDist = pathDistanceKm(_allPathPoints);
  const stepDist = totalSteps * 0.000762;
  const distanceKm = _allPathPoints.length > 1 ? gpsDist : stepDist;

  const activeMin = _startTime
    ? Math.floor((Date.now() - _startTime) / 60000)
    : 0;

  // Load stored active minutes from DB to add to current session
  const existing = getActivityForDate(todayStr());
  const storedMin = existing ? existing.active_min : 0;

  return {
    steps: totalSteps,
    distanceKm: Math.round(distanceKm * 100) / 100,
    activeMin: storedMin + activeMin,
    pathCoords: _allPathPoints.map((p) => ({ latitude: p.lat, longitude: p.lng })),
  };
}

// ── Internal ─────────────────────────────────────────────────────────────────

function _emitUpdate() {
  if (_onUpdate) _onUpdate(getTrackingState());
}

function _flush() {
  const state = getTrackingState();
  const dateStr = todayStr();

  // Persist path points
  if (_pathBuffer.length > 0) {
    appendPathPoints(dateStr, _pathBuffer);
    _pathBuffer = [];
  }

  // Update stats
  upsertActivity(
    dateStr,
    state.steps,
    state.distanceKm,
    state.activeMin,
    JSON.stringify(_allPathPoints)
  );
}
