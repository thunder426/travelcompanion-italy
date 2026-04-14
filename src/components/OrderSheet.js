import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Image,
  TextInput, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

async function persistDishPhoto(sourceUri) {
  if (!sourceUri || !FileSystem.documentDirectory) return sourceUri;
  const dir = FileSystem.documentDirectory + 'dish-photos/';
  try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
  const dest = dir + `dish_${Date.now()}.jpg`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}

export default function OrderSheet({ visible, item, existing, onClose, onSave, onDelete }) {
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState(null);
  const [rating, setRating] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhoto(existing?.dish_photo || null);
      setRating(existing?.rating || null);
      setNote(existing?.note || '');
    }
  }, [visible, existing]);

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to take a dish photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) {
      setBusy(true);
      const uri = await persistDishPhoto(res.assets[0].uri);
      setPhoto(uri);
      setBusy(false);
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Enable photo library access in Settings.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled) {
      setBusy(true);
      const uri = await persistDishPhoto(res.assets[0].uri);
      setPhoto(uri);
      setBusy(false);
    }
  }

  function handleSave() {
    onSave({ dishPhoto: photo, rating, note: note.trim() || null });
  }

  function handleDelete() {
    Alert.alert('Remove from ordered?', 'This removes the photo, rating and note for this dish.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose?.(); }}>
          <View style={s.backdropFill} />
        </TouchableWithoutFeedback>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            <Text style={s.title} numberOfLines={2}>{item?.name || 'Dish'}</Text>
            {item?.desc ? <Text style={s.desc} numberOfLines={2}>{item.desc}</Text> : null}

            <Text style={s.sectionLabel}>Photo</Text>
            {photo ? (
              <View>
                <Image source={{ uri: photo }} style={s.photo} />
                <TouchableOpacity style={s.photoRemove} onPress={() => setPhoto(null)}>
                  <Text style={s.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.photoRow}>
                <TouchableOpacity style={s.photoBtn} onPress={pickFromCamera} disabled={busy}>
                  <Text style={s.photoBtnText}>📷  Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.photoBtn} onPress={pickFromLibrary} disabled={busy}>
                  <Text style={s.photoBtnText}>🖼  Library</Text>
                </TouchableOpacity>
              </View>
            )}
            {busy && <ActivityIndicator color="#e94560" style={{ marginTop: 8 }} />}

            <Text style={s.sectionLabel}>Rating</Text>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setRating(rating === n ? null : n)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Text style={[s.star, rating && n <= rating && s.starOn]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>Note</Text>
            <TextInput
              style={s.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="How was it?"
              placeholderTextColor="#555"
              multiline
              maxLength={240}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />
          </ScrollView>

          <View style={s.actionRow}>
            {existing ? (
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                <Text style={s.deleteText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveText}>{existing ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  backdropFill: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#0f0f1a',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 8, maxHeight: '88%',
    borderTopWidth: 1, borderColor: '#2a2a50',
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 2, backgroundColor: '#2a2a50', marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  desc: { fontSize: 13, color: '#888', marginTop: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 18, marginBottom: 8,
  },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a50',
    alignItems: 'center',
  },
  photoBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  photo: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#000' },
  photoRemove: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stars: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 32, color: '#2a2a50' },
  starOn: { color: '#fde68a' },
  noteInput: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a50',
    borderRadius: 10, padding: 12, color: '#fff', fontSize: 14,
    minHeight: 70, textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#2a2a50', alignItems: 'center',
  },
  cancelText: { color: '#888', fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#3a1d24', backgroundColor: '#2a1016',
    alignItems: 'center',
  },
  deleteText: { color: '#fda4af', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#e94560', alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
