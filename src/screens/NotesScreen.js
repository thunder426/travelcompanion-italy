import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initDb, getAllNotes, saveNote, deleteNote } from '../services/notesDb';

initDb();

function formatDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Note Editor ───────────────────────────────────────────────────────────────
function NoteEditor({ note, onSave, onCancel }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody]   = useState(note?.body  ?? '');

  function handleSave() {
    const t = title.trim();
    const b = body.trim();
    if (!t && !b) { onCancel(); return; }
    saveNote(t || 'Untitled', b, note?.id ?? null);
    onSave();
  }

  return (
    <KeyboardAvoidingView
      style={styles.editorContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={onCancel} hitSlop={12}>
          <Text style={styles.editorCancel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} hitSlop={12}>
          <Text style={styles.editorSave}>Save</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Title"
        placeholderTextColor="#444"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
        returnKeyType="next"
      />
      <TextInput
        style={styles.bodyInput}
        placeholder="Write your note…"
        placeholderTextColor="#444"
        value={body}
        onChangeText={setBody}
        multiline
        textAlignVertical="top"
        autoFocus={!note}
      />
    </KeyboardAvoidingView>
  );
}

// ── Notes List ────────────────────────────────────────────────────────────────
export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [notes, setNotes]       = useState([]);
  const [editing, setEditing]   = useState(null); // null | {} (new) | note obj
  const [search, setSearch]     = useState('');

  const loadNotes = useCallback(() => setNotes(getAllNotes()), []);

  useEffect(() => { loadNotes(); }, []);

  function handleDelete(id) {
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteNote(id); loadNotes(); } },
    ]);
  }

  if (editing !== null) {
    return (
      <NoteEditor
        note={editing.id ? editing : null}
        onSave={() => { setEditing(null); loadNotes(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const filtered = search.trim()
    ? notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes…"
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>
            {search ? 'No notes match your search' : 'No notes yet\nTap + to create one'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setEditing(item)} activeOpacity={0.75}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title || 'Untitled'}
                </Text>
                {item.body ? (
                  <Text style={styles.cardPreview} numberOfLines={2}>{item.body}</Text>
                ) : null}
                <Text style={styles.cardDate}>{formatDate(item.updated_at)}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} hitSlop={8}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setEditing({})}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },

  searchRow: { padding: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#1e1e35', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, color: '#fff', fontSize: 15,
  },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a50',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardPreview: { fontSize: 14, color: '#888', lineHeight: 20, marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#555' },
  deleteBtn: { padding: 4, marginLeft: 8 },
  deleteIcon: { fontSize: 18 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#e94560', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },

  // Editor
  editorContainer: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  editorHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  editorCancel: { fontSize: 16, color: '#888' },
  editorSave: { fontSize: 16, fontWeight: '700', color: '#e94560' },
  titleInput: {
    fontSize: 22, fontWeight: '700', color: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#2a2a50',
    paddingBottom: 12, marginBottom: 16,
  },
  bodyInput: { flex: 1, fontSize: 16, color: '#fff', lineHeight: 26 },
});
