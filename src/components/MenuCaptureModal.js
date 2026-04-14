import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Image, Dimensions, Modal, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { translateImage, generateMenuTitle } from '../services/claudeApi';
import { initMenusDb, saveMenu } from '../services/menusDb';
import TranslationRenderer from './TranslationRenderer';
import PhotoPager from './PhotoPager';

/**
 * Self-contained multi-page menu capture flow:
 *   camera (multi-shot) → translate → review/save → close
 *
 * Props:
 *   visible: boolean
 *   onClose: () => void
 *   onSaved: (menuId) => void — fired after Save completes
 */
export default function MenuCaptureModal({ visible, onClose, onSaved }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [pages, setPages] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => { initMenusDb(); }, []);

  // Reset state each time the modal opens.
  useEffect(() => {
    if (visible) {
      setPages([]);
      setResult(null);
      setSavedId(null);
      setLoading(false);
      setSaving(false);
    }
  }, [visible]);

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setPages((prev) => [...prev, { uri: photo.uri, base64: photo.base64 }]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not capture photo.');
    }
  }

  function removePage(idx) {
    setPages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleTranslate() {
    if (pages.length === 0) return;
    setLoading(true);
    try {
      const base64s = pages.map((p) => p.base64);
      const translated = await translateImage(base64s.length === 1 ? base64s[0] : base64s);
      setResult(translated);
    } catch (err) {
      Alert.alert('Error', err.message || 'Translation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result || saving || savedId) return;
    setSaving(true);
    try {
      const persistentUris = [];
      if (FileSystem.documentDirectory) {
        const dir = FileSystem.documentDirectory + 'menus/';
        try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
        const stamp = Date.now();
        for (let i = 0; i < pages.length; i++) {
          const src = pages[i].uri;
          const dest = `${dir}menu_${stamp}_${i}.jpg`;
          try {
            await FileSystem.copyAsync({ from: src, to: dest });
            persistentUris.push(dest);
          } catch {
            persistentUris.push(src);
          }
        }
      }
      let title = 'Untitled Menu';
      try { title = await generateMenuTitle(result); } catch {}
      const id = saveMenu(title, result, persistentUris);
      setSavedId(id);
      onSaved?.(id);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save menu.');
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  // ---- Camera view: active until we have a translation result ----
  const showCamera = !result && !loading;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      {loading ? (
        <View style={[s.fullBlack, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={s.loadingText}>Translating {pages.length} {pages.length === 1 ? 'page' : 'pages'}…</Text>
        </View>
      ) : showCamera ? (
        <View style={s.cameraContainer}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={s.camera} facing="back" />
          ) : (
            <View style={s.permissionBox}>
              <Text style={s.permissionText}>Camera access is required to capture a menu.</Text>
              <TouchableOpacity style={s.permissionBtn} onPress={requestPermission}>
                <Text style={s.permissionBtnText}>Grant access</Text>
              </TouchableOpacity>
            </View>
          )}

          {pages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.thumbStrip}
              contentContainerStyle={s.thumbStripContent}
            >
              {pages.map((p, i) => (
                <View key={i} style={s.thumbWrap}>
                  <Image source={{ uri: p.uri }} style={s.thumb} />
                  <TouchableOpacity
                    style={s.thumbRemove}
                    onPress={() => removePage(i)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={s.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={s.thumbIdx}>{i + 1}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={[s.cameraControls, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <TouchableOpacity style={s.cancelButton} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.captureButton}
              onPress={takePicture}
              disabled={!permission?.granted}
            >
              <View style={s.captureInner} />
            </TouchableOpacity>
            {pages.length > 0 ? (
              <TouchableOpacity style={s.translateBtn} onPress={handleTranslate}>
                <Text style={s.translateBtnText}>Translate</Text>
                <Text style={s.translateBtnCount}>
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}
          </View>
        </View>
      ) : (
        // ---- Review view: pages + translation + save/close ----
        <View style={[s.reviewContainer, { paddingTop: insets.top }]}>
          <View style={s.reviewHeader}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.reviewClose}>✕</Text>
            </TouchableOpacity>
            <Text style={s.reviewTitle}>Translation</Text>
            <TouchableOpacity
              style={[s.reviewSaveBtn, (saving || savedId) && s.disabled]}
              onPress={handleSave}
              disabled={saving || !!savedId}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.reviewSaveBtnText}>{savedId ? '✓ Saved' : '💾 Save'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {pages.length > 0 && (
            <PhotoPager
              uris={pages.map((p) => p.uri)}
              style={s.photoPager}
              imageHeight={Dimensions.get('window').height * 0.38}
            />
          )}

          <ScrollView
            style={s.flex}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
          >
            <TranslationRenderer content={result} />
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },

  fullBlack: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: '#aaa', fontSize: 16 },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  permissionText: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    paddingVertical: 14, paddingHorizontal: 28,
    backgroundColor: '#e94560', borderRadius: 10,
  },
  permissionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  cameraControls: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16, backgroundColor: '#000',
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelButton: { width: 80, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },

  thumbStrip: {
    position: 'absolute', left: 0, right: 0, bottom: 120,
    maxHeight: 90,
  },
  thumbStripContent: { paddingHorizontal: 16, gap: 8 },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 70, height: 70, borderRadius: 8,
    borderWidth: 2, borderColor: '#fff', backgroundColor: '#000',
  },
  thumbRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#fff',
  },
  thumbRemoveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  thumbIdx: {
    position: 'absolute', bottom: 2, left: 4,
    color: '#fff', fontSize: 11, fontWeight: '700',
    textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 },
  },
  translateBtn: {
    width: 80, alignItems: 'center', paddingVertical: 4,
    backgroundColor: '#e94560', borderRadius: 10, paddingHorizontal: 6,
  },
  translateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  translateBtnCount: { color: '#fff', fontSize: 10, opacity: 0.85, marginTop: 2 },

  reviewContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  reviewHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2a2a50',
    gap: 8,
  },
  reviewClose: { fontSize: 22, color: '#888', paddingHorizontal: 8, paddingVertical: 4 },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  reviewSaveBtn: {
    backgroundColor: '#e94560',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 18, minWidth: 80, alignItems: 'center', justifyContent: 'center',
  },
  reviewSaveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },

  photoPager: {
    height: Dimensions.get('window').height * 0.38,
    flexGrow: 0,
  },
});
