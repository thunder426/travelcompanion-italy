import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { initMenusDb, getAllMenus, getMenu } from '../services/menusDb';
import { initOrdersDb } from '../services/menuOrdersDb';
import { initMealsDb } from '../services/mealsDb';
import MenuDetailModal from '../components/MenuDetailModal';
import MenuCaptureModal from '../components/MenuCaptureModal';

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function buildPreview(content) {
  if (!content) return '';
  try {
    const obj = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    if (obj?.type === 'menu' && Array.isArray(obj.sections)) {
      const names = obj.sections.flatMap(sec => (sec.items || []).map(i => i.name)).filter(Boolean);
      if (names.length > 0) {
        return names.slice(0, 3).join(' · ') + (names.length > 3 ? '…' : '');
      }
    }
    if (obj?.type === 'sign' && obj.translation) {
      return obj.translation;
    }
  } catch {}
  return content;
}

export default function SavedMenusScreen() {
  const insets = useSafeAreaInsets();
  const [menus, setMenus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const load = useCallback(() => {
    setMenus(getAllMenus());
  }, []);

  useEffect(() => {
    initMenusDb();
    initOrdersDb();
    initMealsDb();
    load();
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  function openMenu(m) {
    setSelected(m);
  }

  function closeMenu() {
    setSelected(null);
  }

  function handleChanged() {
    // Refresh list + re-read the currently open menu (title may have changed).
    load();
    if (selected) {
      const fresh = getMenu(selected.id);
      if (fresh) setSelected(fresh);
    }
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.captureBtn} onPress={() => setCapturing(true)}>
          <Text style={s.captureBtnText}>📷  Capture menu</Text>
        </TouchableOpacity>
      </View>

      {menus.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🍝</Text>
          <Text style={s.emptyText}>No saved menus yet{'\n'}Tap Capture menu to start</Text>
        </View>
      ) : (
        <FlatList
          data={menus}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openMenu(item)} activeOpacity={0.7}>
              {item.photo_uri ? (
                <Image source={{ uri: item.photo_uri }} style={s.cardThumb} />
              ) : (
                <View style={[s.cardThumb, s.cardThumbPlaceholder]}>
                  <Text style={s.cardThumbIcon}>📷</Text>
                </View>
              )}
              <View style={s.cardInfo}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={s.cardDate}>{formatDate(item.created_at)}</Text>
                <Text style={s.cardPreview} numberOfLines={2}>{buildPreview(item.translation)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
        <MenuDetailModal
          menu={selected}
          onClose={closeMenu}
          onChanged={handleChanged}
        />
      )}

      <MenuCaptureModal
        visible={capturing}
        onClose={() => { setCapturing(false); load(); }}
        onSaved={() => load()}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },

  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  captureBtn: {
    paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, backgroundColor: '#e94560',
  },
  captureBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a50',
    overflow: 'hidden',
  },
  cardThumb: { width: 90, height: 90, backgroundColor: '#000' },
  cardThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardThumbIcon: { fontSize: 24 },
  cardInfo: { flex: 1, padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardDate: { fontSize: 11, color: '#e94560', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  cardPreview: { fontSize: 12, color: '#888', lineHeight: 16 },
});
