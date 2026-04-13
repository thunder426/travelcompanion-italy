import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  Alert, KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import {
  initDb, getAllNotes, getAllTodos,
  saveNote, saveTodo, updateTodoItems, deleteNote,
} from '../services/notesDb';

initDb();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatReminderTime(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

async function requestNotifPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleReminder(title, body, unixTs) {
  const granted = await requestNotifPermission();
  if (!granted) {
    Alert.alert('Permission needed', 'Please allow notifications in Settings to use reminders.');
    return null;
  }
  const trigger = new Date(unixTs * 1000);
  if (trigger <= new Date()) {
    Alert.alert('Invalid time', 'Please choose a time in the future.');
    return null;
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: '✈️ Travel Reminder', body: title + (body ? `\n${body}` : ''), sound: true },
    trigger,
  });
  return id;
}

async function cancelReminder(notificationId) {
  if (notificationId) {
    try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reminder Picker Modal
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_OPTIONS = [
  { label: 'In 30 minutes',    offset: 30 * 60 },
  { label: 'In 1 hour',        offset: 60 * 60 },
  { label: 'In 3 hours',       offset: 3 * 60 * 60 },
  { label: 'Tonight at 8 pm',  fn: () => { const d = new Date(); d.setHours(20,0,0,0); if(d<=new Date()) d.setDate(d.getDate()+1); return Math.floor(d/1000); } },
  { label: 'Tomorrow at 9 am', fn: () => { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); return Math.floor(d/1000); } },
];

function ReminderModal({ visible, current, onSet, onClear, onClose }) {
  const [customHour, setCustomHour]   = useState('09');
  const [customMin,  setCustomMin]    = useState('00');
  const [daysAhead,  setDaysAhead]    = useState(0); // 0=today, 1=tomorrow...

  function applyQuick(opt) {
    const ts = opt.fn ? opt.fn() : Math.floor(Date.now() / 1000) + opt.offset;
    onSet(ts);
  }

  function applyCustom() {
    const h = parseInt(customHour, 10);
    const m = parseInt(customMin,  10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert('Invalid time', 'Enter a valid hour (0-23) and minute (0-59).');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(h, m, 0, 0);
    onSet(Math.floor(d / 1000));
  }

  const dayLabels = ['Today', 'Tomorrow', 'In 2 days', 'In 3 days', 'In 4 days', 'In 5 days', 'In 6 days'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={rm.overlay}>
        <View style={rm.sheet}>
          <View style={rm.header}>
            <Text style={rm.title}>Set Reminder</Text>
            <TouchableOpacity onPress={onClose}><Text style={rm.close}>✕</Text></TouchableOpacity>
          </View>

          {current && (
            <View style={rm.currentBox}>
              <Text style={rm.currentLabel}>Current: {formatReminderTime(current)}</Text>
              <TouchableOpacity onPress={onClear}>
                <Text style={rm.clearText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick options */}
          <Text style={rm.sectionLabel}>Quick</Text>
          {QUICK_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.label} style={rm.optionRow} onPress={() => applyQuick(opt)}>
              <Text style={rm.optionText}>{opt.label}</Text>
              <Text style={rm.arrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Custom */}
          <Text style={rm.sectionLabel}>Custom</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rm.dayScroll}>
            {dayLabels.map((lbl, i) => (
              <TouchableOpacity
                key={lbl}
                style={[rm.dayBtn, daysAhead === i && rm.dayBtnActive]}
                onPress={() => setDaysAhead(i)}
              >
                <Text style={[rm.dayBtnText, daysAhead === i && rm.dayBtnTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={rm.timeRow}>
            <TextInput
              style={rm.timeInput} value={customHour}
              onChangeText={setCustomHour} keyboardType="number-pad"
              maxLength={2} placeholder="HH" placeholderTextColor="#555"
            />
            <Text style={rm.timeSep}>:</Text>
            <TextInput
              style={rm.timeInput} value={customMin}
              onChangeText={setCustomMin} keyboardType="number-pad"
              maxLength={2} placeholder="MM" placeholderTextColor="#555"
            />
            <TouchableOpacity style={rm.setBtn} onPress={applyCustom}>
              <Text style={rm.setBtnText}>Set</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Note Editor
// ─────────────────────────────────────────────────────────────────────────────
function NoteEditor({ note, onSave, onCancel }) {
  const [title, setTitle]                 = useState(note?.title ?? '');
  const [body,  setBody]                  = useState(note?.body  ?? '');
  const [reminderTime, setReminderTime]   = useState(note?.reminder_time ?? null);
  const [notifId, setNotifId]             = useState(note?.notification_id ?? null);
  const [showReminder, setShowReminder]   = useState(false);

  async function handleSave() {
    const t = title.trim() || 'Untitled';
    const b = body.trim();
    saveNote(t, b, note?.id ?? null);
    onSave();
  }

  async function handleSetReminder(ts) {
    await cancelReminder(notifId);
    const id = await scheduleReminder(title.trim() || 'Note reminder', body.trim(), ts);
    if (id) {
      setReminderTime(ts);
      setNotifId(id);
      // Update DB immediately if editing
      if (note?.id) saveNote(title.trim() || 'Untitled', body.trim(), note.id);
    }
    setShowReminder(false);
  }

  async function handleClearReminder() {
    await cancelReminder(notifId);
    setReminderTime(null);
    setNotifId(null);
    setShowReminder(false);
  }

  return (
    <KeyboardAvoidingView style={ed.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={ed.header}>
        <TouchableOpacity onPress={onCancel} hitSlop={12}>
          <Text style={ed.cancel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowReminder(true)} hitSlop={12}>
          <Text style={[ed.reminder, reminderTime && ed.reminderActive]}>
            🔔 {reminderTime ? formatReminderTime(reminderTime) : 'Remind me'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} hitSlop={12}>
          <Text style={ed.save}>Save</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={ed.titleInput} placeholder="Title" placeholderTextColor="#444"
        value={title} onChangeText={setTitle} maxLength={100} />
      <TextInput style={ed.bodyInput} placeholder="Write your note…" placeholderTextColor="#444"
        value={body} onChangeText={setBody} multiline textAlignVertical="top" autoFocus={!note} />
      <ReminderModal
        visible={showReminder} current={reminderTime}
        onSet={handleSetReminder} onClear={handleClearReminder}
        onClose={() => setShowReminder(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Todo Editor
// ─────────────────────────────────────────────────────────────────────────────
function TodoEditor({ todo, onSave, onCancel }) {
  const [title, setTitle]               = useState(todo?.title ?? '');
  const [items, setItems]               = useState(
    todo?.items ? JSON.parse(todo.items) : []
  );
  const [newItem, setNewItem]           = useState('');
  const [reminderTime, setReminderTime] = useState(todo?.reminder_time ?? null);
  const [notifId, setNotifId]           = useState(todo?.notification_id ?? null);
  const [showReminder, setShowReminder] = useState(false);
  const inputRef = useRef(null);

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    setItems(prev => [...prev, { id: Date.now().toString(), text, done: false }]);
    setNewItem('');
    inputRef.current?.focus();
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function handleSave() {
    const t = title.trim() || 'Untitled';
    saveTodo(t, items, reminderTime, notifId, todo?.id ?? null);
    onSave();
  }

  async function handleSetReminder(ts) {
    await cancelReminder(notifId);
    const id = await scheduleReminder(title.trim() || 'Todo reminder', '', ts);
    if (id) { setReminderTime(ts); setNotifId(id); }
    setShowReminder(false);
  }

  async function handleClearReminder() {
    await cancelReminder(notifId);
    setReminderTime(null); setNotifId(null);
    setShowReminder(false);
  }

  return (
    <KeyboardAvoidingView style={ed.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={ed.header}>
        <TouchableOpacity onPress={onCancel} hitSlop={12}><Text style={ed.cancel}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setShowReminder(true)} hitSlop={12}>
          <Text style={[ed.reminder, reminderTime && ed.reminderActive]}>
            🔔 {reminderTime ? formatReminderTime(reminderTime) : 'Remind me'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} hitSlop={12}><Text style={ed.save}>Save</Text></TouchableOpacity>
      </View>

      <TextInput style={ed.titleInput} placeholder="List title" placeholderTextColor="#444"
        value={title} onChangeText={setTitle} maxLength={100} />

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {items.map(item => (
          <View key={item.id} style={td.itemRow}>
            <View style={[td.checkbox, item.done && td.checkboxDone]} />
            <Text style={[td.itemText, item.done && td.itemTextDone]}>{item.text}</Text>
            <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={8}>
              <Text style={td.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add item input */}
        <View style={td.addRow}>
          <Text style={td.addPlus}>+</Text>
          <TextInput
            ref={inputRef}
            style={td.addInput}
            placeholder="Add item…"
            placeholderTextColor="#555"
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          {newItem.trim() ? (
            <TouchableOpacity onPress={addItem} hitSlop={8}>
              <Text style={td.addBtn}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <ReminderModal
        visible={showReminder} current={reminderTime}
        onSet={handleSetReminder} onClear={handleClearReminder}
        onClose={() => setShowReminder(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Todo List Item (checkable inline)
// ─────────────────────────────────────────────────────────────────────────────
function TodoCard({ todo, onOpen, onDelete }) {
  const [items, setItems] = useState(JSON.parse(todo.items || '[]'));
  const doneCount = items.filter(i => i.done).length;
  const allDone   = items.length > 0 && doneCount === items.length;

  function toggleItem(id) {
    const updated = items.map(i => i.id === id ? { ...i, done: !i.done } : i);
    setItems(updated);
    updateTodoItems(todo.id, updated);
  }

  return (
    <TouchableOpacity style={[ls.card, allDone && ls.cardDone]} onPress={() => onOpen(todo)} activeOpacity={0.75}>
      <View style={ls.cardTop}>
        <Text style={[ls.cardTitle, allDone && ls.cardTitleDone]} numberOfLines={1}>
          {todo.title || 'Untitled'}
        </Text>
        <TouchableOpacity onPress={() => onDelete(todo.id)} hitSlop={8} style={ls.deleteBtn}>
          <Text style={ls.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View style={ls.progressRow}>
          <View style={ls.progressBg}>
            <View style={[ls.progressFill, { width: `${(doneCount / items.length) * 100}%` }]} />
          </View>
          <Text style={ls.progressText}>{doneCount}/{items.length}</Text>
        </View>
      )}

      {/* Checklist items */}
      {items.map(item => (
        <TouchableOpacity key={item.id} style={td.checkRow} onPress={() => toggleItem(item.id)} activeOpacity={0.7}>
          <View style={[td.checkbox, item.done && td.checkboxDone]}>
            {item.done && <Text style={td.checkmark}>✓</Text>}
          </View>
          <Text style={[td.checkText, item.done && td.checkTextDone]}>{item.text}</Text>
        </TouchableOpacity>
      ))}

      {todo.reminder_time && (
        <Text style={ls.reminderBadge}>🔔 {formatReminderTime(todo.reminder_time)}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab]           = useState('notes'); // 'notes' | 'todos'
  const [notes, setNotes]       = useState([]);
  const [todos, setTodos]       = useState([]);
  const [editing, setEditing]   = useState(null);  // null | {type, data}
  const [search, setSearch]     = useState('');

  const loadAll = useCallback(() => {
    setNotes(getAllNotes());
    setTodos(getAllTodos());
  }, []);

  useEffect(() => { loadAll(); }, []);

  function handleDelete(id) {
    Alert.alert('Delete?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const all = [...notes, ...todos];
        const item = all.find(n => n.id === id);
        if (item?.notification_id) await cancelReminder(item.notification_id);
        deleteNote(id);
        loadAll();
      }},
    ]);
  }

  if (editing) {
    const isNote = editing.type === 'note';
    const Editor = isNote ? NoteEditor : TodoEditor;
    const prop   = isNote ? 'note' : 'todo';
    return (
      <Editor
        {...{ [prop]: editing.data?.id ? editing.data : null }}
        onSave={() => { setEditing(null); loadAll(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const filteredNotes = search.trim()
    ? notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()))
    : notes;

  const filteredTodos = search.trim()
    ? todos.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : todos;

  return (
    <View style={[ls.container, { paddingBottom: insets.bottom }]}>
      {/* Tab toggle */}
      <View style={ls.tabRow}>
        {[{ key: 'notes', label: '📝  Notes' }, { key: 'todos', label: '✅  To-Do' }].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[ls.tabBtn, tab === key && ls.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[ls.tabBtnText, tab === key && ls.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={ls.searchRow}>
        <TextInput
          style={ls.searchInput}
          placeholder={`Search ${tab}…`}
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Notes tab */}
      {tab === 'notes' && (
        filteredNotes.length === 0
          ? <View style={ls.empty}><Text style={ls.emptyIcon}>📝</Text><Text style={ls.emptyText}>{search ? 'No notes match' : 'No notes yet\nTap + to create one'}</Text></View>
          : <FlatList
              data={filteredNotes}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={ls.card} onPress={() => setEditing({ type: 'note', data: item })} activeOpacity={0.75}>
                  <View style={ls.cardTop}>
                    <Text style={ls.cardTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8} style={ls.deleteBtn}>
                      <Text style={ls.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  {item.body ? <Text style={ls.cardPreview} numberOfLines={2}>{item.body}</Text> : null}
                  <View style={ls.cardFooter}>
                    <Text style={ls.cardDate}>{formatDate(item.updated_at)}</Text>
                    {item.reminder_time && <Text style={ls.reminderBadge}>🔔 {formatReminderTime(item.reminder_time)}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
      )}

      {/* Todos tab */}
      {tab === 'todos' && (
        filteredTodos.length === 0
          ? <View style={ls.empty}><Text style={ls.emptyIcon}>✅</Text><Text style={ls.emptyText}>{search ? 'No lists match' : 'No to-do lists yet\nTap + to create one'}</Text></View>
          : <FlatList
              data={filteredTodos}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <TodoCard
                  todo={item}
                  onOpen={data => setEditing({ type: 'todo', data })}
                  onDelete={handleDelete}
                />
              )}
            />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={ls.fab}
        onPress={() => setEditing({ type: tab === 'notes' ? 'note' : 'todo', data: {} })}
      >
        <Text style={ls.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  tabRow: { flexDirection: 'row', backgroundColor: '#1e1e35', margin: 16, marginBottom: 0, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#e94560' },
  tabBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabBtnTextActive: { color: '#fff' },
  searchRow: { padding: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: '#1e1e35', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 15 },
  card: { backgroundColor: '#1a1a2e', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a50' },
  cardDone: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#666' },
  cardPreview: { fontSize: 14, color: '#888', lineHeight: 20, marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#555' },
  reminderBadge: { fontSize: 12, color: '#e94560' },
  deleteBtn: { padding: 4, marginLeft: 8 },
  deleteIcon: { fontSize: 17 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressBg: { flex: 1, height: 4, backgroundColor: '#2a2a50', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#e94560', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#888', minWidth: 30, textAlign: 'right' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#e94560', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});

const ed = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cancel: { fontSize: 16, color: '#888' },
  save: { fontSize: 16, fontWeight: '700', color: '#e94560' },
  reminder: { fontSize: 13, color: '#888' },
  reminderActive: { color: '#e94560' },
  titleInput: { fontSize: 22, fontWeight: '700', color: '#fff', borderBottomWidth: 1, borderBottomColor: '#2a2a50', paddingBottom: 12, marginBottom: 16 },
  bodyInput: { flex: 1, fontSize: 16, color: '#fff', lineHeight: 26 },
});

const td = StyleSheet.create({
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#e94560', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#e94560' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 15, color: '#fff' },
  checkTextDone: { textDecorationLine: 'line-through', color: '#666' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  itemText: { flex: 1, fontSize: 15, color: '#fff' },
  itemTextDone: { textDecorationLine: 'line-through', color: '#666' },
  removeIcon: { color: '#555', fontSize: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2a2a50', marginTop: 8 },
  addPlus: { fontSize: 20, color: '#e94560', width: 22, textAlign: 'center' },
  addInput: { flex: 1, fontSize: 15, color: '#fff' },
  addBtn: { color: '#e94560', fontSize: 15, fontWeight: '700' },
});

const rm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  close: { fontSize: 18, color: '#888' },
  currentBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a1020', borderRadius: 10, padding: 12, marginBottom: 16 },
  currentLabel: { color: '#e94560', fontSize: 14 },
  clearText: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2a2a50' },
  optionText: { fontSize: 16, color: '#fff' },
  arrow: { fontSize: 20, color: '#555' },
  dayScroll: { marginBottom: 12 },
  dayBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 8, backgroundColor: '#1e1e35' },
  dayBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  dayBtnText: { color: '#888', fontSize: 13 },
  dayBtnTextActive: { color: '#e94560' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { backgroundColor: '#1e1e35', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', width: 70 },
  timeSep: { fontSize: 24, color: '#fff', fontWeight: '700' },
  setBtn: { flex: 1, backgroundColor: '#e94560', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  setBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
