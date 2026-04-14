import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllExpenses, saveExpense, updateExpense, deleteExpense } from '../services/notesDb';

const CATEGORIES = [
  { key: 'Food',      icon: '🍽️' },
  { key: 'Transport', icon: '🚂' },
  { key: 'Museums',   icon: '🏛️' },
  { key: 'Hotel',     icon: '🛏️' },
  { key: 'Shopping',  icon: '🛍️' },
  { key: 'Other',     icon: '📦' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === yStr)  return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByDate(expenses) {
  const map = {};
  for (const e of expenses) {
    if (!map[e.date]) map[e.date] = [];
    map[e.date].push(e);
  }
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({ date, items: map[date] }));
}

// editing = null (closed) | { amount, category, note } (new) | { id, amount, category, note, date } (existing)
export default function ExpenseScreen() {
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState([]);
  const [editing,  setEditing]  = useState(null);
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('Food');
  const [note,     setNote]     = useState('');

  const load = useCallback(() => setExpenses(getAllExpenses()), []);
  useEffect(() => { load(); }, []);

  function openAdd() {
    setAmount(''); setCategory('Food'); setNote('');
    setEditing({});
  }

  function openEdit(expense) {
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setNote(expense.note ?? '');
    setEditing(expense);
  }

  function closeModal() { setEditing(null); }

  function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    if (editing.id) {
      updateExpense(editing.id, amt, category, note.trim());
    } else {
      saveExpense(amt, category, note.trim(), todayStr());
    }
    closeModal();
    load();
  }

  function handleDelete() {
    closeModal();
    setTimeout(() => {
      Alert.alert('Delete expense?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteExpense(editing.id); load(); } },
      ]);
    }, 300);
  }

  const isEditing   = !!editing?.id;
  const amountValid = parseFloat(amount) > 0;
  const total       = expenses.reduce((s, e) => s + e.amount, 0);
  const grouped     = groupByDate(expenses);

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {/* Trip total */}
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>Total Spent</Text>
        <Text style={s.totalAmount}>€{total.toFixed(2)}</Text>
        {expenses.length > 0 && (
          <Text style={s.totalSub}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {grouped.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>💶</Text>
          <Text style={s.emptyText}>No expenses yet{'\n'}Tap + to log one</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item: group }) => {
            const dayTotal = group.items.reduce((s, e) => s + e.amount, 0);
            return (
              <View>
                <View style={s.dayHeader}>
                  <Text style={s.dayLabel}>{formatDay(group.date)}</Text>
                  <Text style={s.dayTotal}>€{dayTotal.toFixed(2)}</Text>
                </View>
                {group.items.map(e => {
                  const cat = CATEGORIES.find(c => c.key === e.category) ?? CATEGORIES[5];
                  return (
                    <TouchableOpacity
                      key={e.id}
                      style={s.row}
                      onPress={() => openEdit(e)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.rowIcon}>{cat.icon}</Text>
                      <View style={s.rowInfo}>
                        <Text style={s.rowCategory}>{e.category}</Text>
                        {e.note ? <Text style={s.rowNote}>{e.note}</Text> : null}
                      </View>
                      <Text style={s.rowAmount}>€{e.amount.toFixed(2)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAdd}>
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <Modal visible={editing !== null} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
              <View style={s.sheetActions}>
                {isEditing && (
                  <TouchableOpacity onPress={handleDelete} style={s.deleteBtn}>
                    <Text style={s.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={closeModal}>
                  <Text style={s.sheetClose}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={s.amountRow}>
                <Text style={s.eurSign}>€</Text>
                <TextInput
                  style={s.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#555"
                  autoFocus
                  selectTextOnFocus
                />
              </View>

              {/* Category pills */}
              <Text style={s.fieldLabel}>Category</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[s.catPill, category === c.key && s.catPillActive]}
                    onPress={() => setCategory(c.key)}
                  >
                    <Text style={s.catIcon}>{c.icon}</Text>
                    <Text style={[s.catLabel, category === c.key && s.catLabelActive]}>{c.key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Note */}
              <Text style={s.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={s.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Trattoria da Mario"
                placeholderTextColor="#555"
                returnKeyType="done"
              />

              <TouchableOpacity
                style={[s.addBtn, !amountValid && s.addBtnDisabled]}
                onPress={handleSave}
                disabled={!amountValid}
              >
                <Text style={s.addBtnText}>{isEditing ? 'Save Changes' : 'Add Expense'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0f0f1a' },

  totalCard: {
    backgroundColor: '#1a1a2e', margin: 16, borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a50',
  },
  totalLabel:  { fontSize: 13, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { fontSize: 42, fontWeight: '800', color: '#e94560', marginTop: 4 },
  totalSub:    { fontSize: 13, color: '#555', marginTop: 4 },

  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  dayLabel: { fontSize: 13, fontWeight: '700', color: '#e94560', textTransform: 'uppercase', letterSpacing: 0.8 },
  dayTotal: { fontSize: 14, fontWeight: '700', color: '#888' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a50',
  },
  rowIcon:     { fontSize: 24, marginRight: 12 },
  rowInfo:     { flex: 1 },
  rowCategory: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rowNote:     { fontSize: 13, color: '#888', marginTop: 2 },
  rowAmount:   { fontSize: 18, fontWeight: '800', color: '#fff' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },

  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#e94560', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40, maxHeight: '85%',
  },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle:   { fontSize: 18, fontWeight: '700', color: '#fff' },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sheetClose:   { fontSize: 18, color: '#888' },
  deleteBtn:    { padding: 2 },
  deleteBtnText:{ fontSize: 20 },

  amountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f0f1a', borderRadius: 16, padding: 16, marginBottom: 20,
  },
  eurSign:     { fontSize: 36, color: '#888', fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 52, fontWeight: '800', color: '#fff', minWidth: 120, textAlign: 'center' },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0f0f1a', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  catPillActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  catIcon:       { fontSize: 16 },
  catLabel:      { fontSize: 14, color: '#888', fontWeight: '600' },
  catLabelActive:{ color: '#e94560' },

  noteInput: {
    backgroundColor: '#0f0f1a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a50', marginBottom: 20,
  },

  addBtn:         { backgroundColor: '#e94560', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.35 },
  addBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
