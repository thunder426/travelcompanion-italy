import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DiscoverScreen from './DiscoverScreen';
import TranslationScreen from './TranslationScreen';

const TABS = [
  { key: 'discover', label: 'Discover' },
  { key: 'translate', label: 'Translate' },
];

export default function ExploreHomeScreen() {
  const [tab, setTab] = useState('discover');

  return (
    <View style={s.container}>
      <View style={s.tabRow}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabBtnText, tab === key && s.tabBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Keep both mounted so state (e.g. an in-progress menu translation)
          survives sub-tab switching. Only toggle visibility. */}
      <View style={[s.screen, tab !== 'discover' && s.hidden]}>
        <DiscoverScreen />
      </View>
      <View style={[s.screen, tab !== 'translate' && s.hidden]}>
        <TranslationScreen />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#1e1e35',
    margin: 16, marginBottom: 0, borderRadius: 12, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#e94560' },
  tabBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabBtnTextActive: { color: '#fff' },
  screen: { flex: 1 },
  hidden: { display: 'none' },
});
