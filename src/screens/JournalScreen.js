import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import NotesScreen from './NotesScreen';
import ExpenseScreen from './ExpenseScreen';
import SavedMenusScreen from './SavedMenusScreen';
import MealsScreen from './MealsScreen';

const TABS = [
  { key: 'notes',    label: 'Notes' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'menus',    label: 'Menus' },
  { key: 'meals',    label: 'Meals' },
];

export default function JournalScreen() {
  const [tab, setTab] = useState('notes');

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
      <View style={[s.screen, tab !== 'notes' && s.hidden]}>
        <NotesScreen />
      </View>
      <View style={[s.screen, tab !== 'expenses' && s.hidden]}>
        <ExpenseScreen />
      </View>
      <View style={[s.screen, tab !== 'menus' && s.hidden]}>
        <SavedMenusScreen />
      </View>
      <View style={[s.screen, tab !== 'meals' && s.hidden]}>
        <MealsScreen active={tab === 'meals'} />
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
