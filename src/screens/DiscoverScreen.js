import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { describeArtwork, describeStreet } from '../services/claudeApi';

const DEPTH_OPTIONS = [
  { key: 'quick',    label: 'Quick',     icon: '⚡' },
  { key: 'standard', label: 'Standard',  icon: '📖' },
  { key: 'deep',     label: 'Deep Dive', icon: '🔬' },
];

export default function DiscoverScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode]         = useState('museum'); // 'museum' | 'street'
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

  function reset() { setResult(null); setCameraActive(true); }

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Camera access is needed to identify artworks and landmarks.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.actionBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
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
          { key: 'museum', label: '🏛️  Museum' },
          { key: 'street', label: '🔍  Explorer' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => { setMode(key); setResult(null); }}
          >
            <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Depth selector — museum only */}
      {mode === 'museum' && !result && (
        <View style={styles.depthRow}>
          {DEPTH_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.depthBtn, depth === opt.key && styles.depthBtnActive]}
              onPress={() => setDepth(opt.key)}
            >
              <Text style={styles.depthIcon}>{opt.icon}</Text>
              <Text style={[styles.depthLabel, depth === opt.key && styles.depthLabelActive]}>
                {opt.label}
              </Text>
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
            <TouchableOpacity style={styles.actionBtn} onPress={reset}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },

  modeToggle: {
    flexDirection: 'row', backgroundColor: '#1e1e35',
    borderRadius: 12, padding: 4, marginBottom: 14,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },

  depthRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  depthBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#1e1e35', borderWidth: 1, borderColor: '#333',
  },
  depthBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1a25' },
  depthIcon: { fontSize: 20, marginBottom: 4 },
  depthLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  depthLabelActive: { color: '#e94560' },

  permText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  hint: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  camIcon: { fontSize: 32 },

  actionBtn: {
    backgroundColor: '#e94560', paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 14, alignItems: 'center', gap: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listenBtn: {
    backgroundColor: '#16213e', paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e94560',
  },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 20 },

  resultLabel: {
    fontSize: 11, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 26 },
  loadingText: { color: '#aaa', fontSize: 16 },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#000',
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelBtn: { width: 80, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },
});
