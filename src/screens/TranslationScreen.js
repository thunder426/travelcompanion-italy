import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { translateImage, translateText } from '../services/claudeApi';

const PAIRS = [
  { from: 'en', to: 'it', label: 'EN → IT', fromLocale: 'en-US', toLocale: 'it-IT' },
  { from: 'it', to: 'en', label: 'IT → EN', fromLocale: 'it-IT', toLocale: 'en-US' },
  { from: 'zh', to: 'it', label: 'ZH → IT', fromLocale: 'zh-CN', toLocale: 'it-IT' },
  { from: 'it', to: 'zh', label: 'IT → ZH', fromLocale: 'it-IT', toLocale: 'zh-CN' },
];

const PLACEHOLDERS = {
  en: 'Type in English…',
  it: 'Scrivi in italiano…',
  zh: '输入中文…',
};

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
  const [mode, setMode] = useState('voice'); // 'voice' | 'text' | 'camera'
  const [pairIndex, setPairIndex] = useState(0);

  // Text mode state
  const [inputText, setInputText] = useState('');

  // Shared result state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const cameraRef = useRef(null);

  // Voice state
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const pair = PAIRS[pairIndex];

  // ── Voice setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    Voice.onSpeechStart = () => setListening(true);
    Voice.onSpeechEnd = handleSpeechEnd;
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechPartialResults = (e) => {
      if (e.value?.[0]) setTranscript(e.value[0]);
    };
    Voice.onSpeechError = (e) => {
      stopPulse();
      setListening(false);
      if (e.error?.code !== '7') { // code 7 = no match, not a real error
        Alert.alert('Voice error', e.error?.message || 'Could not recognise speech. Please try again.');
      }
    };
    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, [pairIndex]);

  function startPulse() {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }

  function stopPulse() {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }

  async function startListening() {
    try {
      setResult(null);
      setTranscript('');
      await Voice.start(pair.fromLocale);
      startPulse();
    } catch (e) {
      Alert.alert('Error', 'Could not start voice recognition. Please try again.');
    }
  }

  async function stopListening() {
    try {
      await Voice.stop();
      stopPulse();
    } catch (e) {}
  }

  function handleSpeechEnd() {
    stopPulse();
    setListening(false);
  }

  async function handleSpeechResults(e) {
    const text = e.value?.[0];
    if (!text) return;
    setTranscript(text);
    setLoading(true);
    try {
      const translation = await translateText(text, pair.from, pair.to);
      setResult(translation);
      // Auto-speak the translation
      Speech.speak(translation, { language: pair.toLocale, rate: 0.9 });
    } catch (err) {
      Alert.alert('Translation error', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Text mode ──────────────────────────────────────────────────────────────
  const liveTranslate = useCallback(async (text, from, to) => {
    if (!text.trim()) { setResult(null); return; }
    setLoading(true);
    try {
      setResult(await translateText(text, from, to));
    } catch { setResult(null); }
    finally { setLoading(false); }
  }, []);

  const debouncedTranslate = useDebounce(liveTranslate, 800);

  function handleTextChange(text) {
    setInputText(text);
    debouncedTranslate(text, pair.from, pair.to);
  }

  function handlePairChange(index) {
    setPairIndex(index);
    setResult(null);
    setTranscript('');
    if (mode === 'text' && inputText.trim()) {
      debouncedTranslate(inputText, PAIRS[index].from, PAIRS[index].to);
    }
  }

  // ── Camera mode ────────────────────────────────────────────────────────────
  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setCameraActive(false);
      setResult(await translateImage(photo.base64));
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ── Camera view ────────────────────────────────────────────────────────────
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

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        {[
          { key: 'voice', label: '🎙️  Voice' },
          { key: 'text',  label: '⌨️  Text'  },
          { key: 'camera', label: '📷  Camera' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => { setMode(key); setResult(null); setTranscript(''); }}
          >
            <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Language pair pills */}
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

      {/* ── VOICE MODE ── */}
      {mode === 'voice' && (
        <View style={styles.voiceContainer}>
          {/* Transcript */}
          <View style={styles.transcriptBox}>
            <Text style={styles.resultLabel}>You said</Text>
            <Text style={[styles.transcriptText, !transcript && styles.placeholderText]}>
              {transcript || (listening ? 'Listening…' : 'Tap the mic and speak')}
            </Text>
          </View>

          {/* Mic button */}
          <View style={styles.micWrapper}>
            <Animated.View style={[styles.micRipple, { transform: [{ scale: pulseAnim }] }]} />
            <TouchableOpacity
              style={[styles.micBtn, listening && styles.micBtnActive]}
              onPress={listening ? stopListening : startListening}
              activeOpacity={0.8}
            >
              <Text style={styles.micIcon}>{listening ? '⏹' : '🎙️'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.micHint}>
            {listening ? 'Tap to stop' : 'Tap to speak'}
          </Text>

          {/* Translation result */}
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>{pair.label.split(' → ')[1]}</Text>
            {loading ? (
              <ActivityIndicator color="#e94560" size="small" style={{ marginTop: 8 }} />
            ) : result ? (
              <>
                <Text style={styles.resultText}>{result}</Text>
                <TouchableOpacity
                  style={styles.speakAgainBtn}
                  onPress={() => Speech.speak(result, { language: pair.toLocale, rate: 0.9 })}
                >
                  <Text style={styles.speakAgainText}>🔊  Speak again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.placeholderText}>Translation will appear here</Text>
            )}
          </View>
        </View>
      )}

      {/* ── TEXT MODE ── */}
      {mode === 'text' && (
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.input}
            placeholder={PLACEHOLDERS[pair.from] ?? 'Type here…'}
            placeholderTextColor="#555"
            multiline
            value={inputText}
            onChangeText={handleTextChange}
            autoCorrect={false}
          />
          <View style={styles.resultBox}>
            {loading ? (
              <ActivityIndicator color="#e94560" size="small" />
            ) : result ? (
              <>
                <Text style={styles.resultLabel}>{pair.label.split(' → ')[1]}</Text>
                <Text style={styles.resultText}>{result}</Text>
                <TouchableOpacity
                  style={styles.speakAgainBtn}
                  onPress={() => Speech.speak(result, { language: pair.toLocale, rate: 0.9 })}
                >
                  <Text style={styles.speakAgainText}>🔊  Speak</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.placeholderText}>Translation will appear here</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── CAMERA MODE ── */}
      {mode === 'camera' && (
        <View style={styles.cameraModeContainer}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>Translating…</Text>
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
            <View style={styles.centered}>
              <Text style={styles.cameraHint}>
                Point at any text — menus, signs, museum plaques — for an instant translation.
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
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  flex: { flex: 1 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e1e35',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },

  pairRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pairBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a2e',
  },
  pairBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  pairBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  pairBtnTextActive: { color: '#e94560' },

  // Voice mode
  voiceContainer: { flex: 1, gap: 16 },
  transcriptBox: {
    backgroundColor: '#1e1e35', borderRadius: 12, padding: 16, minHeight: 90,
  },
  transcriptText: { fontSize: 16, color: '#fff', lineHeight: 24, marginTop: 6 },
  placeholderText: { fontSize: 15, color: '#444', textAlign: 'center', marginTop: 4 },

  micWrapper: { alignItems: 'center', justifyContent: 'center', height: 120 },
  micRipple: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(233, 69, 96, 0.25)',
  },
  micBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1e1e35',
    borderWidth: 2, borderColor: '#e94560',
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: '#e94560' },
  micIcon: { fontSize: 32 },
  micHint: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: -8 },

  resultBox: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16, minHeight: 100,
    borderWidth: 1, borderColor: '#2a2a50', justifyContent: 'center',
  },
  resultLabel: {
    fontSize: 11, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
  },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 24 },

  speakAgainBtn: { marginTop: 12, alignSelf: 'flex-start' },
  speakAgainText: { color: '#e94560', fontSize: 14, fontWeight: '600' },

  // Text mode
  input: {
    backgroundColor: '#1e1e35', borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 16, minHeight: 140,
    textAlignVertical: 'top', lineHeight: 24, marginBottom: 12,
  },

  // Camera mode
  cameraModeContainer: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  cameraHint: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  actionBtn: {
    backgroundColor: '#e94560', paddingVertical: 18, paddingHorizontal: 36,
    borderRadius: 16, alignItems: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cameraIcon: { fontSize: 32 },
  retakeBtn: {
    backgroundColor: '#e94560', paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 12, alignItems: 'center', marginTop: 20,
  },
  retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingText: { color: '#aaa', fontSize: 16 },

  // Camera view
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
  cancelButton: { width: 80, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },
});
