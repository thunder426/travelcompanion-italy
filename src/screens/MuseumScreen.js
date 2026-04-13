import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { describeArtwork } from '../services/claudeApi';

const DEPTH_OPTIONS = [
  { key: 'quick', label: 'Quick', icon: '⚡' },
  { key: 'standard', label: 'Standard', icon: '📖' },
  { key: 'deep', label: 'Deep Dive', icon: '🔬' },
];

export default function MuseumScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [depth, setDepth] = useState('standard');
  const [speaking, setSpeaking] = useState(false);
  const cameraRef = useRef(null);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access is needed for the museum guide.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setCameraActive(false);
      const description = await describeArtwork(photo.base64, depth);
      setResult(description);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
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
        language: 'en',
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  }

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setCameraActive(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
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
      <Text style={styles.title}>Museum Guide</Text>
      <Text style={styles.subtitle}>Photograph an artwork or exhibit for an AI-narrated explanation.</Text>

      <View style={styles.depthSelector}>
        {DEPTH_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.depthButton, depth === opt.key && styles.depthButtonActive]}
            onPress={() => setDepth(opt.key)}
          >
            <Text style={styles.depthIcon}>{opt.icon}</Text>
            <Text style={[styles.depthLabel, depth === opt.key && styles.depthLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Analysing artwork...</Text>
        </View>
      ) : result ? (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Guide</Text>
          <Text style={styles.resultText}>{result}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.speakButton} onPress={toggleSpeech}>
              <Text style={styles.buttonText}>{speaking ? '⏹ Stop' : '🔊 Listen'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => { setResult(null); setCameraActive(true); }}>
              <Text style={styles.buttonText}>New Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <TouchableOpacity style={styles.cameraButton} onPress={() => setCameraActive(true)}>
          <Text style={styles.cameraIcon}>🏛️</Text>
          <Text style={styles.buttonText}>Open Camera</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#aaa', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permissionText: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  depthSelector: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  depthButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e1e35', borderWidth: 1, borderColor: '#333' },
  depthButtonActive: { borderColor: '#e94560', backgroundColor: '#2a1a25' },
  depthIcon: { fontSize: 20, marginBottom: 4 },
  depthLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  depthLabelActive: { color: '#e94560' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#000' },
  captureButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelButton: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, width: 80, alignItems: 'center' },
  cameraButton: { backgroundColor: '#e94560', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', gap: 8 },
  cameraIcon: { fontSize: 36 },
  button: { backgroundColor: '#e94560', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  speakButton: { backgroundColor: '#16213e', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#e94560' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { alignItems: 'center', gap: 16 },
  loadingText: { color: '#aaa', fontSize: 16 },
  resultContainer: { width: '100%' },
  resultLabel: { fontSize: 13, fontWeight: '700', color: '#e94560', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 24 },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
});
