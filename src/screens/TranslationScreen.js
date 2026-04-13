import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { translateImage, translateText } from '../services/claudeApi';

// Available language pairs
const PAIRS = [
  { from: 'en', to: 'it', label: 'EN → IT' },
  { from: 'it', to: 'en', label: 'IT → EN' },
  { from: 'zh', to: 'it', label: 'ZH → IT' },
  { from: 'it', to: 'zh', label: 'IT → ZH' },
];

const PLACEHOLDERS = {
  en: 'Type in English…',
  it: 'Scrivi in italiano…',
  zh: '输入中文…',
};

// Debounce helper
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

export default function TranslationScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('text'); // 'camera' | 'text'
  const [pairIndex, setPairIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const cameraRef = useRef(null);

  const pair = PAIRS[pairIndex];

  // Live translation — fires 800 ms after user stops typing
  const liveTranslate = useCallback(
    async (text, from, to) => {
      if (!text.trim()) { setResult(null); return; }
      setLoading(true);
      try {
        const translation = await translateText(text, from, to);
        setResult(translation);
      } catch (err) {
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debouncedTranslate = useDebounce(liveTranslate, 800);

  function handleTextChange(text) {
    setInputText(text);
    debouncedTranslate(text, pair.from, pair.to);
  }

  function handlePairChange(index) {
    setPairIndex(index);
    setResult(null);
    if (inputText.trim()) {
      debouncedTranslate(inputText, PAIRS[index].from, PAIRS[index].to);
    }
  }

  // Camera flow
  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setCameraActive(false);
      const translation = await translateImage(photo.base64);
      setResult(translation);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setCameraActive(false)}>
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
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
          onPress={() => { setMode('text'); setResult(null); }}
        >
          <Text style={[styles.modeBtnText, mode === 'text' && styles.modeBtnTextActive]}>
            ⌨️  Text
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'camera' && styles.modeBtnActive]}
          onPress={() => setMode('camera')}
        >
          <Text style={[styles.modeBtnText, mode === 'camera' && styles.modeBtnTextActive]}>
            📷  Camera
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language pair selector */}
      <View style={styles.pairRow}>
        {PAIRS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.pairBtn, pairIndex === i && styles.pairBtnActive]}
            onPress={() => handlePairChange(i)}
          >
            <Text style={[styles.pairBtnText, pairIndex === i && styles.pairBtnTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'text' ? (
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          {/* Input box */}
          <TextInput
            style={styles.input}
            placeholder={PLACEHOLDERS[pair.from] ?? 'Type here…'}
            placeholderTextColor="#555"
            multiline
            value={inputText}
            onChangeText={handleTextChange}
            autoCorrect={false}
          />

          {/* Result */}
          <View style={styles.resultBox}>
            {loading ? (
              <ActivityIndicator color="#e94560" size="small" />
            ) : result ? (
              <>
                <Text style={styles.resultLabel}>
                  {PAIRS[pairIndex].label.split(' → ')[1]}
                </Text>
                <Text style={styles.resultText}>{result}</Text>
              </>
            ) : (
              <Text style={styles.resultPlaceholder}>Translation will appear here</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        // Camera mode
        <View style={styles.cameraMode}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>Translating...</Text>
            </View>
          ) : result ? (
            <ScrollView style={styles.flex}>
              <Text style={styles.resultLabel}>Translation</Text>
              <Text style={styles.resultText}>{result}</Text>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => { setResult(null); setCameraActive(true); }}
              >
                <Text style={styles.retakeBtnText}>Translate Another</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              <Text style={styles.cameraHint}>
                Point at any text — menus, signs, museum plaques — for an instant translation with context.
              </Text>
              {!permission?.granted ? (
                <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
                  <Text style={styles.actionBtnText}>Grant Camera Access</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setCameraActive(true)}>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.actionBtnText}>Open Camera</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  flex: { flex: 1 },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e1e35',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },

  // Language pair pills
  pairRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pairBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a2e',
  },
  pairBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  pairBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  pairBtnTextActive: { color: '#e94560' },

  // Text mode
  input: {
    backgroundColor: '#1e1e35',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 140,
    textAlignVertical: 'top',
    lineHeight: 24,
    marginBottom: 12,
  },
  resultBox: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a50',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e94560',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 24 },
  resultPlaceholder: { fontSize: 15, color: '#444', textAlign: 'center' },

  // Camera mode
  cameraMode: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  cameraHint: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  actionBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cameraIcon: { fontSize: 32 },
  retakeBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { alignItems: 'center', gap: 16 },
  loadingText: { color: '#aaa', fontSize: 16 },

  // Camera view
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#000',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelButton: { width: 80, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },
});
