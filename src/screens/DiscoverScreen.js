import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { describeArtwork, describeStreet } from '../services/claudeApi';
import { setCurrentDestination, getCurrentDestination } from '../services/destinationContext';
import DESTINATIONS from '../data/destinations';

const DEPTH_OPTIONS = [
  { key: 'quick',    label: 'Quick',     icon: '⚡' },
  { key: 'standard', label: 'Standard',  icon: '📖' },
  { key: 'deep',     label: 'Deep Dive', icon: '🔬' },
];

// ── Destination Detail View ───────────────────────────────────────────────────
function DestinationDetail({ destination, isActive, onSetActive, onBack }) {
  const [section, setSection] = useState('overview');

  const SECTIONS = [
    { key: 'overview',       label: 'Overview'    },
    { key: 'neighborhoods',  label: 'Areas'       },
    { key: 'museums',        label: 'Museums'     },
    { key: 'churches',       label: 'Churches'    },
    { key: 'food',           label: 'Food'        },
    { key: 'practical',      label: 'Tips'        },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={dv.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Text style={dv.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={dv.title}>{destination.emoji} {destination.name}</Text>
        <TouchableOpacity
          style={[dv.setBtn, isActive && dv.setBtnActive]}
          onPress={onSetActive}
        >
          <Text style={[dv.setBtnText, isActive && dv.setBtnTextActive]}>
            {isActive ? '📍 Active' : 'Set Active'}
          </Text>
        </TouchableOpacity>
      </View>

      {isActive && (
        <View style={dv.activeBanner}>
          <Text style={dv.activeBannerText}>
            📍 Claude is using {destination.name} as context for camera features
          </Text>
        </View>
      )}

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dv.tabScroll}>
        {SECTIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[dv.tab, section === s.key && dv.tabActive]}
            onPress={() => setSection(s.key)}
          >
            <Text style={[dv.tabText, section === s.key && dv.tabTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {section === 'overview' && (
          <>
            <Text style={dv.tagline}>{destination.tagline}</Text>
            <Text style={dv.body}>{destination.overview}</Text>
            <View style={dv.divider} />
            <Text style={dv.sectionTitle}>History</Text>
            <Text style={dv.body}>{destination.history}</Text>
          </>
        )}

        {section === 'practical' && destination.practical.map((tip, i) => (
          <View key={i} style={dv.tipCard}>
            <Text style={dv.tipIcon}>{tip.icon}</Text>
            <Text style={dv.tipText}>{tip.tip}</Text>
          </View>
        ))}

        {section === 'neighborhoods' && destination.neighborhoods.map((n, i) => (
          <View key={i} style={dv.card}>
            <Text style={dv.cardTitle}>{n.name}</Text>
            <Text style={dv.cardBody}>{n.description}</Text>
          </View>
        ))}

        {section === 'museums' && destination.museums.map((m, i) => (
          <View key={i} style={dv.card}>
            <Text style={dv.cardTitle}>{m.name}</Text>
            <Text style={dv.cardBody}>{m.description}</Text>
            {m.tip && (
              <View style={dv.cardTip}>
                <Text style={dv.cardTipText}>💡 {m.tip}</Text>
              </View>
            )}
          </View>
        ))}

        {section === 'churches' && destination.churches.map((c, i) => (
          <View key={i} style={dv.card}>
            <Text style={dv.cardTitle}>{c.name}</Text>
            <Text style={dv.cardBody}>{c.description}</Text>
          </View>
        ))}

        {section === 'food' && destination.food.map((f, i) => (
          <View key={i} style={dv.card}>
            <Text style={dv.cardTitle}>{f.name}</Text>
            <Text style={dv.cardBody}>{f.description}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Guide List View ───────────────────────────────────────────────────────────
function GuideView() {
  const [selected, setSelected] = useState(null);
  const [activeId, setActiveId] = useState(getCurrentDestination()?.id ?? null);

  function handleSetActive(destination) {
    if (activeId === destination.id) {
      setCurrentDestination(null);
      setActiveId(null);
    } else {
      setCurrentDestination(destination);
      setActiveId(destination.id);
    }
  }

  if (selected) {
    return (
      <DestinationDetail
        destination={selected}
        isActive={activeId === selected.id}
        onSetActive={() => handleSetActive(selected)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <View style={styles.flex}>
      {activeId && (
        <View style={dv.activeBanner}>
          <Text style={dv.activeBannerText}>
            📍 {DESTINATIONS.find(d => d.id === activeId)?.name} is active — Claude knows your location
          </Text>
        </View>
      )}
      <FlatList
        data={DESTINATIONS}
        keyExtractor={d => d.id}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[dv.destCard, activeId === item.id && dv.destCardActive]}
            onPress={() => setSelected(item)}
            activeOpacity={0.8}
          >
            <Text style={dv.destEmoji}>{item.emoji}</Text>
            <View style={dv.destInfo}>
              <Text style={dv.destName}>{item.name}</Text>
              <Text style={dv.destRegion}>{item.region}</Text>
              <Text style={dv.destTagline}>{item.tagline}</Text>
            </View>
            <View style={dv.destRight}>
              {activeId === item.id && <Text style={dv.activePin}>📍</Text>}
              <Text style={dv.destArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ── Camera + Museum/Street Views ──────────────────────────────────────────────
export default function DiscoverScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode]         = useState('guide'); // 'guide' | 'museum' | 'street'
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [depth, setDepth]       = useState('standard');
  const [speaking, setSpeaking] = useState(false);
  const cameraRef = useRef(null);

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setCameraActive(false);
      const text = mode === 'museum'
        ? await describeArtwork(photo.base64, depth)
        : await describeStreet(photo.base64);
      setResult(text);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleSpeech() {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(result, {
        language: 'en', rate: 0.9,
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  }

  if (!permission?.granted && mode !== 'guide') {
    return (
      <View style={styles.container}>
        <View style={styles.modeToggle}>
          {[
            { key: 'guide',  label: '🗺️  Guide'    },
            { key: 'museum', label: '🏛️  Museum'   },
            { key: 'street', label: '🔍  Explorer' },
          ].map(({ key, label }) => (
            <TouchableOpacity key={key} style={[styles.modeBtn, mode === key && styles.modeBtnActive]} onPress={() => setMode(key)}>
              <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.centered}>
          <Text style={styles.permText}>Camera access is needed.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
            <Text style={styles.actionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCameraActive(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={loading}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={{ width: 80 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        {[
          { key: 'guide',  label: '🗺️  Guide'    },
          { key: 'museum', label: '🏛️  Museum'   },
          { key: 'street', label: '🔍  Explorer' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => { setMode(key); setResult(null); }}
          >
            <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Guide tab */}
      {mode === 'guide' && <GuideView />}

      {/* Museum / Street tabs */}
      {(mode === 'museum' || mode === 'street') && (
        <>
          {mode === 'museum' && !result && (
            <View style={styles.depthRow}>
              {DEPTH_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.depthBtn, depth === opt.key && styles.depthBtnActive]}
                  onPress={() => setDepth(opt.key)}
                >
                  <Text style={styles.depthIcon}>{opt.icon}</Text>
                  <Text style={[styles.depthLabel, depth === opt.key && styles.depthLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>
                {mode === 'museum' ? 'Analysing artwork…' : 'Identifying landmark…'}
              </Text>
            </View>
          ) : result ? (
            <ScrollView style={styles.flex}>
              <Text style={styles.resultLabel}>{mode === 'museum' ? 'Guide' : 'Discovery'}</Text>
              <Text style={styles.resultText}>{result}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.listenBtn} onPress={toggleSpeech}>
                  <Text style={styles.actionBtnText}>{speaking ? '⏹  Stop' : '🔊  Listen'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setResult(null); setCameraActive(true); }}>
                  <Text style={styles.actionBtnText}>New Photo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.hint}>
                {mode === 'museum'
                  ? 'Photograph an artwork or exhibit for an AI-narrated explanation.'
                  : 'Point at any building or landmark to discover its history.'}
              </Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setCameraActive(true)}>
                <Text style={styles.camIcon}>{mode === 'museum' ? '🏛️' : '🔍'}</Text>
                <Text style={styles.actionBtnText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#1e1e35', borderRadius: 12, padding: 4, marginBottom: 14 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  depthRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  depthBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e1e35', borderWidth: 1, borderColor: '#333' },
  depthBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1a25' },
  depthIcon: { fontSize: 20, marginBottom: 4 },
  depthLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  depthLabelActive: { color: '#e94560' },
  permText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  hint: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  camIcon: { fontSize: 32 },
  actionBtn: { backgroundColor: '#e94560', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center', gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listenBtn: { backgroundColor: '#16213e', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e94560' },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 20 },
  resultLabel: { fontSize: 11, fontWeight: '700', color: '#e94560', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 26 },
  loadingText: { color: '#aaa', fontSize: 16 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#000' },
  captureButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelBtn: { width: 80, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },
});

// Destination detail styles
const dv = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  back: { color: '#e94560', fontSize: 16, fontWeight: '600', width: 60 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  setBtn: { backgroundColor: '#1e1e35', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  setBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  setBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },
  setBtnTextActive: { color: '#e94560' },
  activeBanner: { backgroundColor: '#2a1020', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e94560' },
  activeBannerText: { color: '#e94560', fontSize: 13, textAlign: 'center' },
  tabScroll: { marginBottom: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, marginRight: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a2e' },
  tabActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#e94560' },
  tagline: { fontSize: 16, color: '#e94560', fontStyle: 'italic', marginBottom: 12 },
  body: { fontSize: 15, color: '#ccc', lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#2a2a50', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a50' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 6 },
  cardBody: { fontSize: 14, color: '#aaa', lineHeight: 21 },
  cardTip: { backgroundColor: '#1e2a1e', borderRadius: 8, padding: 10, marginTop: 8 },
  cardTipText: { fontSize: 13, color: '#6fcf97', lineHeight: 19 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2a2a50' },
  tipIcon: { fontSize: 20, width: 24 },
  tipText: { flex: 1, fontSize: 14, color: '#ccc', lineHeight: 21 },
  destCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2a50' },
  destCardActive: { borderColor: '#e94560', backgroundColor: '#1f1220' },
  destEmoji: { fontSize: 40, marginRight: 14 },
  destInfo: { flex: 1 },
  destName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  destRegion: { fontSize: 13, color: '#888', marginTop: 2 },
  destTagline: { fontSize: 13, color: '#e94560', marginTop: 4, fontStyle: 'italic' },
  destRight: { alignItems: 'center', gap: 4 },
  activePin: { fontSize: 16 },
  destArrow: { fontSize: 24, color: '#555' },
});
