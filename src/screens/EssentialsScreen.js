import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, ActivityIndicator, SectionList, ScrollView, Linking,
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
  const [city, setCity]   = useState('rome');
  const [tab, setTab]     = useState('transit'); // 'transit' | 'parking'
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

      {/* Transit / Parking sub-toggle */}
      <View style={tr.subToggle}>
        {[{ key: 'transit', label: '🚇  Transit' }, { key: 'parking', label: '🅿️  Parking' }].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[tr.subBtn, tab === key && tr.subBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[tr.subBtnText, tab === key && tr.subBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'transit' && <>
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

        {/* How to Buy */}
        <Text style={tr.sectionLabel}>🛒 How to Buy</Text>
        {info.howToBuy.map((step, i) => (
          <View key={i} style={tr.buyCard}>
            <Text style={tr.buyIcon}>{step.icon}</Text>
            <View style={tr.buyBody}>
              <Text style={tr.buyTitle}>{step.title}</Text>
              <Text style={tr.buyDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        {/* Links */}
        <Text style={tr.sectionLabel}>🔗 Useful Links</Text>
        {info.links.map((link, i) => (
          <TouchableOpacity
            key={i}
            style={tr.linkCard}
            onPress={() => Linking.openURL(link.url)}
            activeOpacity={0.75}
          >
            <View style={tr.linkBody}>
              <Text style={tr.linkLabel}>{link.label}</Text>
              <Text style={tr.linkDesc}>{link.desc}</Text>
            </View>
            <Text style={tr.linkArrow}>↗</Text>
          </TouchableOpacity>
        ))}

        {/* Tips */}
        <Text style={tr.sectionLabel}>💡 Tips</Text>
        {info.tips.map((tip, i) => (
          <View key={i} style={tr.tipRow}>
            <Text style={tr.tipText}>{tip}</Text>
          </View>
        ))}
      </>}

      {tab === 'parking' && <>
        {/* Zone legend */}
        <Text style={tr.sectionLabel}>🗺️ Parking Zones</Text>
        {info.parking.zones.map((z, i) => (
          <View key={i} style={tr.zoneCard}>
            <View style={[tr.zoneSwatch, { backgroundColor: z.color }]} />
            <View style={tr.zoneBody}>
              <View style={tr.zoneTop}>
                <Text style={tr.zoneLabel}>{z.label}</Text>
                <Text style={tr.zonePrice}>{z.price}</Text>
              </View>
              <Text style={tr.zoneDesc}>{z.desc}</Text>
            </View>
          </View>
        ))}

        {/* Garages & car parks */}
        <Text style={tr.sectionLabel}>🏢 Key Car Parks</Text>
        {info.parking.garages.map((g, i) => (
          <View key={i} style={tr.garageCard}>
            <View style={tr.garageTop}>
              <Text style={tr.garageName}>{g.name}</Text>
              <Text style={tr.garagePrice}>{g.price}</Text>
            </View>
            <Text style={tr.garageLocation}>📍 {g.location}</Text>
            <Text style={tr.garageNote}>{g.note}</Text>
          </View>
        ))}

        {/* Parking apps */}
        <Text style={tr.sectionLabel}>📱 Parking Apps</Text>
        {info.parking.apps.map((app, i) => (
          <TouchableOpacity
            key={i}
            style={tr.linkCard}
            onPress={() => Linking.openURL(app.url)}
            activeOpacity={0.75}
          >
            <Text style={tr.buyIcon}>{app.icon}</Text>
            <View style={tr.linkBody}>
              <Text style={tr.linkLabel}>{app.name}</Text>
              <Text style={tr.linkDesc}>{app.desc}</Text>
            </View>
            <Text style={tr.linkArrow}>↗</Text>
          </TouchableOpacity>
        ))}

        {/* Parking tips */}
        <Text style={tr.sectionLabel}>💡 Tips</Text>
        {info.parking.tips.map((tip, i) => (
          <View key={i} style={tr.tipRow}>
            <Text style={tr.tipText}>{tip}</Text>
          </View>
        ))}
      </>}
    </ScrollView>
  );
}

// ── Emergency View ────────────────────────────────────────────────────────────
const EMERGENCY_NUMBERS = [
  { number: '112', desc: 'General Emergency',  sub: 'Police · Ambulance · Fire (EU)' },
  { number: '118', desc: 'Medical Emergency',  sub: 'Ambulance & paramedics' },
  { number: '113', desc: 'State Police',       sub: 'Polizia di Stato' },
  { number: '115', desc: 'Fire Brigade',       sub: 'Vigili del Fuoco' },
  { number: '116', desc: 'Non-urgent Medical', sub: 'Guardia Medica (after hours GP)' },
];

const MEDICAL_PHRASES = [
  { it: 'Aiuto!',                           en: 'Help!' },
  { it: 'Chiami un\'ambulanza!',            en: 'Call an ambulance!' },
  { it: 'Ho bisogno di un medico',          en: 'I need a doctor' },
  { it: 'Dov\'è l\'ospedale più vicino?',   en: 'Where is the nearest hospital?' },
  { it: 'Sono allergico/a a...',            en: 'I\'m allergic to...' },
  { it: 'Mi fa male qui',                   en: 'It hurts here' },
  { it: 'Sono diabetico/a',                 en: 'I\'m diabetic' },
  { it: 'Non riesco a respirare',           en: 'I can\'t breathe' },
  { it: 'Sto avendo un attacco di cuore',   en: 'I\'m having a heart attack' },
  { it: 'Ho perso il mio passaporto',       en: 'I lost my passport' },
  { it: 'Sono stato/a derubato/a',          en: 'I\'ve been robbed' },
  { it: 'Dov\'è il commissariato?',         en: 'Where is the police station?' },
];

function EmergencyView() {
  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={em.banner}>
        <Text style={em.bannerText}>🇮🇹  Italy Emergency Numbers</Text>
        <Text style={em.bannerSub}>Tap a number to call</Text>
      </View>

      {EMERGENCY_NUMBERS.map(item => (
        <TouchableOpacity
          key={item.number}
          style={em.numberCard}
          onPress={() => Linking.openURL(`tel:${item.number}`)}
          activeOpacity={0.75}
        >
          <View style={em.numberBadge}>
            <Text style={em.numberText}>{item.number}</Text>
          </View>
          <View style={em.numberInfo}>
            <Text style={em.numberDesc}>{item.desc}</Text>
            <Text style={em.numberSub}>{item.sub}</Text>
          </View>
          <Text style={em.callIcon}>📞</Text>
        </TouchableOpacity>
      ))}

      <Text style={em.sectionLabel}>Medical & Safety Phrases</Text>
      {MEDICAL_PHRASES.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={em.phraseRow}
          onPress={() => Speech.speak(p.it, { language: 'it-IT', rate: 0.85 })}
          activeOpacity={0.7}
        >
          <View style={em.phraseTexts}>
            <Text style={em.phraseIt}>{p.it}</Text>
            <Text style={em.phraseEn}>{p.en}</Text>
          </View>
          <Text style={em.speakIcon}>🔊</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Essentials Screen ─────────────────────────────────────────────────────────
export default function EssentialsScreen() {
  const [mode, setMode] = useState('phrasebook'); // 'phrasebook' | 'currency' | 'transport' | 'emergency'

  return (
    <View style={styles.container}>
      <View style={styles.modeToggle}>
        {[
          { key: 'phrasebook', label: '🗣️' },
          { key: 'currency',   label: '💶' },
          { key: 'transport',  label: '🚇' },
          { key: 'emergency',  label: '🆘' },
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
      {mode === 'emergency'  && <EmergencyView />}
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

const em = StyleSheet.create({
  banner: {
    backgroundColor: '#2a1020', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#e94560',
    alignItems: 'center',
  },
  bannerText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  bannerSub:  { fontSize: 13, color: '#888', marginTop: 4 },

  numberCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  numberBadge: {
    backgroundColor: '#e94560', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14,
    marginRight: 14, minWidth: 64, alignItems: 'center',
  },
  numberText:  { fontSize: 20, fontWeight: '900', color: '#fff' },
  numberInfo:  { flex: 1 },
  numberDesc:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  numberSub:   { fontSize: 12, color: '#888', marginTop: 2 },
  callIcon:    { fontSize: 22 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 20, marginBottom: 10,
  },
  phraseRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  phraseTexts: { flex: 1 },
  phraseIt:    { fontSize: 15, fontWeight: '600', color: '#fff' },
  phraseEn:    { fontSize: 13, color: '#888', marginTop: 3 },
  speakIcon:   { fontSize: 20, marginLeft: 10 },
});

const tr = StyleSheet.create({
  subToggle: {
    flexDirection: 'row', backgroundColor: '#1e1e35',
    borderRadius: 10, padding: 3, marginBottom: 4,
  },
  subBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  subBtnActive: { backgroundColor: '#2a2a50' },
  subBtnText: { color: '#666', fontSize: 13, fontWeight: '700' },
  subBtnTextActive: { color: '#fff' },

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
  buyCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a50', gap: 12,
  },
  buyIcon: { fontSize: 22, lineHeight: 28 },
  buyBody: { flex: 1 },
  buyTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  buyDesc: { fontSize: 13, color: '#aaa', lineHeight: 19 },

  linkCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#e9456040',
    gap: 12,
  },
  linkBody: { flex: 1 },
  linkLabel: { fontSize: 14, fontWeight: '700', color: '#e94560' },
  linkDesc: { fontSize: 12, color: '#888', marginTop: 3 },
  linkArrow: { fontSize: 18, color: '#e94560', fontWeight: '700' },

  zoneCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a50', gap: 12,
  },
  zoneSwatch: {
    width: 14, height: 14, borderRadius: 3, marginTop: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  zoneBody: { flex: 1 },
  zoneTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  zoneLabel: { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1 },
  zonePrice: { fontSize: 13, fontWeight: '700', color: '#e94560' },
  zoneDesc: { fontSize: 13, color: '#aaa', lineHeight: 19 },

  garageCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a50',
  },
  garageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  garageName: { fontSize: 14, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  garagePrice: { fontSize: 13, fontWeight: '700', color: '#e94560' },
  garageLocation: { fontSize: 12, color: '#888', marginBottom: 6 },
  garageNote: { fontSize: 13, color: '#aaa', lineHeight: 19 },

  tipRow: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#2a2a50',
  },
  tipText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
});
