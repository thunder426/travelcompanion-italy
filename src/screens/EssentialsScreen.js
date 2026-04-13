import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, ActivityIndicator, SectionList, ScrollView,
} from 'react-native';
import * as Speech from 'expo-speech';
import PHRASES from '../data/phrases';
import { TICKET_INFO } from '../data/transitData';

// ── Currency ──────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar',       flag: '🇺🇸' },
  { code: 'GBP', symbol: '£',  name: 'British Pound',   flag: '🇬🇧' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',    flag: '🇨🇳' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',     flag: '🇨🇭' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',    flag: '🇯🇵' },
  { code: 'HKD', symbol: 'HK$',name: 'Hong Kong Dollar',flag: '🇭🇰' },
];

function CurrencyView() {
  const [amount, setAmount]   = useState('1');
  const [rates, setRates]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/EUR');
      const data = await res.json();
      if (data.result !== 'success') throw new Error('Rate fetch failed');
      setRates(data.rates);
      setUpdatedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setError('Could not load rates. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, []);

  const euros = parseFloat(amount) || 0;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
      {/* EUR input */}
      <View style={styles.eurBox}>
        <Text style={styles.eurFlag}>🇪🇺</Text>
        <View style={styles.eurInputRow}>
          <Text style={styles.eurSymbol}>€</Text>
          <TextInput
            style={styles.eurInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#555"
            selectTextOnFocus
          />
        </View>
        <Text style={styles.eurLabel}>Euro</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#e94560" size="large" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRates}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : rates ? (
        <>
          {CURRENCIES.map(c => (
            <View key={c.code} style={styles.rateCard}>
              <Text style={styles.rateFlag}>{c.flag}</Text>
              <View style={styles.rateInfo}>
                <Text style={styles.rateName}>{c.name}</Text>
                <Text style={styles.rateCode}>{c.code}</Text>
              </View>
              <Text style={styles.rateAmount}>
                {c.symbol}{(euros * rates[c.code]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
          <Text style={styles.rateNote}>
            Rates updated {updatedAt} · EUR base · tap retry to refresh
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchRates}>
            <Text style={styles.refreshText}>↻  Refresh Rates</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
  );
}

// ── Phrasebook ────────────────────────────────────────────────────────────────
const LANGS = [
  { key: 'en', label: 'EN' },
  { key: 'zh', label: 'ZH' },
];

function PhrasebookView() {
  const [search, setSearch]     = useState('');
  const [showLang, setShowLang] = useState('en'); // source language shown
  const [expanded, setExpanded] = useState(null);  // 'category|index'

  const sections = PHRASES.map(cat => ({
    title: `${cat.icon}  ${cat.category}`,
    data: search.trim()
      ? cat.items.filter(p =>
          p.en.toLowerCase().includes(search.toLowerCase()) ||
          p.it.toLowerCase().includes(search.toLowerCase()) ||
          p.zh.includes(search)
        )
      : cat.items,
  })).filter(s => s.data.length > 0);

  async function speak(text, lang) {
    // Stop anything currently playing
    await Speech.stop();

    // iOS uses 'zh-Hans' for Simplified Chinese, not 'zh-CN'
    const locale = lang === 'it' ? 'it-IT'
                 : lang === 'zh' ? 'zh-Hans'
                 : 'en-US';

    Speech.speak(text, {
      language: locale,
      rate: 0.85,
      onError: () => {
        // Language pack not installed — fall back to device default voice
        Speech.speak(text, { rate: 0.85 });
      },
    });
  }

  function toggleExpand(key) {
    setExpanded(prev => prev === key ? null : key);
  }

  return (
    <View style={styles.flex}>
      {/* Search + lang toggle */}
      <View style={styles.phraseToolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases…"
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <View style={styles.langToggle}>
          {LANGS.map(l => (
            <TouchableOpacity
              key={l.key}
              style={[styles.langBtn, showLang === l.key && styles.langBtnActive]}
              onPress={() => setShowLang(l.key)}
            >
              <Text style={[styles.langBtnText, showLang === l.key && styles.langBtnTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.en + i}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const key = `${section.title}|${index}`;
          const isOpen = expanded === key;
          return (
            <TouchableOpacity
              style={styles.phraseRow}
              onPress={() => toggleExpand(key)}
              activeOpacity={0.7}
            >
              <View style={styles.phraseContent}>
                <Text style={styles.phraseSource}>
                  {showLang === 'en' ? item.en : item.zh}
                </Text>
                <Text style={styles.phraseIt}>{item.it}</Text>
                {isOpen && showLang === 'zh' && (
                  <Text style={styles.phraseEn}>{item.en}</Text>
                )}
              </View>
              <View style={styles.speakBtns}>
                <TouchableOpacity
                  onPress={() => speak(showLang === 'en' ? item.en : item.zh, showLang)}
                  hitSlop={8}
                  style={styles.speakBtn}
                >
                  <Text style={styles.speakIcon}>🔊</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => speak(item.it, 'it')} hitSlop={8} style={styles.speakBtn}>
                  <Text style={[styles.speakIcon, { opacity: 0.6 }]}>🇮🇹</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ── Transport View ────────────────────────────────────────────────────────────
function TransportView() {
  const [city, setCity] = useState('rome');
  const info = TICKET_INFO[city];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* City toggle */}
      <View style={styles.modeToggle}>
        {[{ key: 'rome', label: '🏛️  Rome' }, { key: 'florence', label: '🌸  Florence' }].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, city === key && styles.modeBtnActive]}
            onPress={() => setCity(key)}
          >
            <Text style={[styles.modeBtnText, city === key && styles.modeBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets */}
      <Text style={tr.sectionLabel}>🎫 Tickets</Text>
      {info.tickets.map((t, i) => (
        <View key={i} style={tr.ticketCard}>
          <View style={tr.ticketTop}>
            <Text style={tr.ticketName}>{t.name}</Text>
            <Text style={tr.ticketPrice}>{t.price}</Text>
          </View>
          <Text style={tr.ticketDuration}>{t.duration}</Text>
          <Text style={tr.ticketNote}>{t.note}</Text>
        </View>
      ))}

      {/* Tips */}
      <Text style={tr.sectionLabel}>💡 Tips</Text>
      {info.tips.map((tip, i) => (
        <View key={i} style={tr.tipRow}>
          <Text style={tr.tipText}>{tip}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Essentials Screen ─────────────────────────────────────────────────────────
export default function EssentialsScreen() {
  const [mode, setMode] = useState('phrasebook'); // 'phrasebook' | 'currency' | 'transport'

  return (
    <View style={styles.container}>
      <View style={styles.modeToggle}>
        {[
          { key: 'phrasebook', label: '🗣️' },
          { key: 'currency',   label: '💶' },
          { key: 'transport',  label: '🚇' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => setMode(key)}
          >
            <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'phrasebook' && <PhrasebookView />}
      {mode === 'currency'   && <CurrencyView />}
      {mode === 'transport'  && <TransportView />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  flex: { flex: 1 },

  modeToggle: {
    flexDirection: 'row', backgroundColor: '#1e1e35',
    margin: 16, borderRadius: 12, padding: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },

  // Currency
  eurBox: {
    backgroundColor: '#1e1e35', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 20,
  },
  eurFlag: { fontSize: 36, marginBottom: 8 },
  eurInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eurSymbol: { fontSize: 32, color: '#fff', fontWeight: '300' },
  eurInput: {
    fontSize: 48, fontWeight: '700', color: '#fff',
    minWidth: 120, textAlign: 'center',
  },
  eurLabel: { color: '#888', fontSize: 14, marginTop: 4 },

  rateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e',
    borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  rateFlag: { fontSize: 28, marginRight: 12 },
  rateInfo: { flex: 1 },
  rateName: { fontSize: 15, color: '#fff', fontWeight: '600' },
  rateCode: { fontSize: 12, color: '#888', marginTop: 2 },
  rateAmount: { fontSize: 20, fontWeight: '700', color: '#e94560' },

  rateNote: { fontSize: 12, color: '#444', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  refreshBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: '#e94560' },
  refreshText: { color: '#e94560', fontSize: 14, fontWeight: '600' },

  errorBox: { alignItems: 'center', marginTop: 40, gap: 16 },
  errorText: { color: '#888', fontSize: 15, textAlign: 'center' },
  retryBtn: { backgroundColor: '#e94560', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Phrasebook
  phraseToolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  searchInput: {
    flex: 1, backgroundColor: '#1e1e35', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 15,
  },
  langToggle: {
    flexDirection: 'row', backgroundColor: '#1e1e35', borderRadius: 10, padding: 3,
  },
  langBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  langBtnActive: { backgroundColor: '#e94560' },
  langBtnText: { color: '#888', fontSize: 13, fontWeight: '700' },
  langBtnTextActive: { color: '#fff' },

  sectionHeader: {
    fontSize: 13, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 16, paddingVertical: 8, paddingTop: 16,
  },
  phraseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e1e35',
  },
  phraseContent: { flex: 1 },
  phraseSource: { fontSize: 15, color: '#fff', marginBottom: 3 },
  phraseIt: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  phraseEn: { fontSize: 13, color: '#666', marginTop: 2 },
  speakBtns: { flexDirection: 'row', gap: 6 },
  speakBtn: { padding: 4 },
  speakIcon: { fontSize: 20 },
});

const tr = StyleSheet.create({
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 16,
  },
  ticketCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a50',
  },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ticketName: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  ticketPrice: { fontSize: 18, fontWeight: '800', color: '#e94560' },
  ticketDuration: { fontSize: 12, color: '#888', marginBottom: 4 },
  ticketNote: { fontSize: 13, color: '#aaa', lineHeight: 18 },
  tipRow: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#2a2a50',
  },
  tipText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
});
