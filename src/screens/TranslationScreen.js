import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as Speech from 'expo-speech';
import { translateText } from '../services/claudeApi';

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
  const [pairIndex, setPairIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pair = PAIRS[pairIndex];

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
    if (inputText.trim()) {
      debouncedTranslate(inputText, PAIRS[index].from, PAIRS[index].to);
    }
  }

  return (
    <View style={styles.container}>
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
                style={styles.speakBtn}
                onPress={async () => {
                  await Speech.stop();
                  const locale = pair.to === 'it' ? 'it-IT' : pair.to === 'zh' ? 'zh-Hans' : 'en-US';
                  Speech.speak(result, { language: locale, rate: 0.9, onError: () => Speech.speak(result, { rate: 0.9 }) });
                }}
              >
                <Text style={styles.speakBtnText}>🔊  Speak</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.placeholder}>Translation will appear here</Text>
          )}
        </View>
        <Text style={styles.hint}>
          To translate a menu photo, open the Journal tab → Menus → Capture menu.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  flex: { flex: 1 },

  pairRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pairBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a2e',
  },
  pairBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  pairBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  pairBtnTextActive: { color: '#e94560' },

  input: {
    backgroundColor: '#1e1e35', borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 16, minHeight: 140,
    textAlignVertical: 'top', lineHeight: 24, marginBottom: 12,
  },
  resultBox: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16, minHeight: 120,
    borderWidth: 1, borderColor: '#2a2a50', justifyContent: 'center',
  },
  resultLabel: {
    fontSize: 11, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
  },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 24 },
  placeholder: { fontSize: 15, color: '#444', textAlign: 'center' },
  speakBtn: { marginTop: 12, alignSelf: 'flex-start' },
  speakBtnText: { color: '#e94560', fontSize: 14, fontWeight: '600' },

  hint: {
    marginTop: 16, fontSize: 12, color: '#555',
    textAlign: 'center', lineHeight: 18, fontStyle: 'italic',
  },
});
