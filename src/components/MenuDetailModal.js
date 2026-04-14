import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Modal, ScrollView, TextInput, Alert, StatusBar, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateMenuTitle, deleteMenu } from '../services/menusDb';
import { createMeal } from '../services/mealsDb';
import { getOrdersForMeal, upsertOrder, deleteOrder } from '../services/menuOrdersDb';
import TranslationRenderer from './TranslationRenderer';
import OrderSheet from './OrderSheet';
import PhotoPager from './PhotoPager';

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const FILTERS = [
  { key: 'vegetarian',   icon: '🌿', label: 'Vegetarian' },
  { key: 'seafood',      icon: '🐟', label: 'Seafood' },
  { key: 'meat',         icon: '🥩', label: 'Meat' },
  { key: 'specialty',    icon: '⭐', label: 'Specialty' },
  { key: 'kid_friendly', icon: '👶', label: 'Kid-Friendly' },
];

function extractTags(content) {
  if (!content) return new Set();
  try {
    const obj = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    if (obj?.type !== 'menu' || !Array.isArray(obj.sections)) return new Set();
    const tags = new Set();
    for (const sec of obj.sections) {
      for (const item of sec.items || []) {
        for (const t of item.tags || []) tags.add(t);
      }
    }
    return tags;
  } catch {
    return new Set();
  }
}

/**
 * Props:
 *  - menu: saved menu row
 *  - addMealId: if set, modal runs in "add-mode" bound to this meal — items
 *    show "I had this" buttons and orders for this meal render inline.
 *  - initialFilter: preset filter tag.
 *  - onClose, onChanged: lifecycle callbacks.
 */
export default function MenuDetailModal({
  menu,
  addMealId = null,
  initialFilter,
  onClose,
  onChanged,
}) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(menu);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeMealId, setActiveMealId] = useState(addMealId);
  const [orders, setOrders] = useState({});
  const [sheetTarget, setSheetTarget] = useState(null);

  const loadOrders = useCallback((mealId) => {
    if (typeof mealId !== 'number') { setOrders({}); return; }
    const rows = getOrdersForMeal(mealId);
    const map = {};
    for (const r of rows) map[`${r.section_idx}:${r.item_idx}`] = r;
    setOrders(map);
  }, []);

  // Only reset when the menu identity changes — not on every parent re-render.
  // Otherwise `onChanged` bouncing a fresh menu object back in would clobber
  // in-modal state like activeMealId right after tapping "Start meal".
  useEffect(() => {
    if (menu) {
      setCurrent(menu);
      setTitleDraft(menu.title);
      setEditingTitle(false);
      setActiveFilter(initialFilter || null);
      setActiveMealId(addMealId);
      loadOrders(addMealId);
    } else {
      setOrders({});
      setActiveFilter(null);
      setActiveMealId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id, initialFilter, addMealId]);

  // Keep `current` in sync with external updates (e.g. title refresh) without
  // resetting add-mode state.
  useEffect(() => { if (menu) setCurrent(menu); }, [menu]);

  if (!current) return null;

  const inAddMode = activeMealId !== null;
  const tags = extractTags(current.translation);
  const detailFilters = FILTERS.filter((f) => tags.has(f.key));
  const orderedCount = Object.keys(orders).length;

  function handleSaveTitle() {
    const t = titleDraft.trim();
    if (!t) { setEditingTitle(false); return; }
    updateMenuTitle(current.id, t);
    setCurrent({ ...current, title: t });
    setEditingTitle(false);
    onChanged?.();
  }

  function handleDelete() {
    Alert.alert('Delete menu?', 'This will remove the saved photo and translation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteMenu(current.id);
        onChanged?.();
        onClose?.();
      } },
    ]);
  }

  function handleStartMeal() {
    // Defer actually creating the meal row until the first dish is saved —
    // avoids empty meals if the user taps Done without adding anything.
    setActiveMealId('pending');
    setOrders({});
  }

  function handleOrderSave({ dishPhoto, rating, note }) {
    if (!sheetTarget) return;
    let mealId = activeMealId;
    if (mealId === 'pending' || mealId === null) {
      mealId = createMeal(current.id);
      setActiveMealId(mealId);
    }
    upsertOrder({
      mealId,
      menuId: current.id,
      sectionIdx: sheetTarget.sectionIdx,
      itemIdx: sheetTarget.itemIdx,
      dishPhoto, rating, note,
    });
    loadOrders(mealId);
    setSheetTarget(null);
    onChanged?.();
  }

  function handleOrderDelete() {
    if (!sheetTarget) return;
    if (typeof activeMealId === 'number') {
      deleteOrder(activeMealId, sheetTarget.sectionIdx, sheetTarget.itemIdx);
      loadOrders(activeMealId);
      onChanged?.();
    }
    setSheetTarget(null);
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={[s.detailContainer, { paddingTop: insets.top }]}>
        <View style={s.detailHeader}>
          {editingTitle ? (
            <TextInput
              style={s.titleInput}
              value={titleDraft}
              onChangeText={setTitleDraft}
              onBlur={handleSaveTitle}
              onSubmitEditing={handleSaveTitle}
              autoFocus
              returnKeyType="done"
              maxLength={80}
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity
              style={s.titleRow}
              onPress={() => setEditingTitle(true)}
              activeOpacity={0.7}
            >
              <Text style={s.detailTitle} numberOfLines={2}>{current.title}</Text>
              <Text style={s.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.detailClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {inAddMode && (
          <View style={s.addBanner}>
            <Text style={s.addBannerText}>
              🍽  Adding to meal — {orderedCount} {orderedCount === 1 ? 'dish' : 'dishes'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.addBannerDone}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {(current.photo_uris_arr?.length > 0 || current.photo_uri) && (
          <PhotoPager
            uris={current.photo_uris_arr?.length > 0 ? current.photo_uris_arr : [current.photo_uri]}
            style={s.photoZoom}
            imageHeight={Dimensions.get('window').height * 0.38}
          />
        )}

        {detailFilters.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            style={s.filterBar}
          >
            {detailFilters.map((f) => {
              const on = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterPill, on && s.filterPillOn]}
                  onPress={() => setActiveFilter(on ? null : f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.filterPillText, on && s.filterPillTextOn]}>
                    {f.icon}  {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <ScrollView
          style={s.flex}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
        >
          <Text style={s.detailDate}>{formatDate(current.created_at)}</Text>
          <TranslationRenderer
            content={current.translation}
            filterTag={activeFilter}
            orders={inAddMode ? orders : null}
            onOrderPress={
              inAddMode
                ? (sectionIdx, itemIdx, item) => setSheetTarget({ sectionIdx, itemIdx, item })
                : null
            }
          />
        </ScrollView>

        <View style={[s.detailFooter, { paddingBottom: insets.bottom + 12 }]}>
          {inAddMode ? (
            <TouchableOpacity style={s.primaryBtn} onPress={onClose}>
              <Text style={s.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.footerRow}>
              <TouchableOpacity style={s.primaryBtn} onPress={handleStartMeal}>
                <Text style={s.primaryBtnText}>🍽  Start meal here</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                <Text style={s.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <OrderSheet
          visible={sheetTarget !== null}
          item={sheetTarget?.item}
          existing={
            sheetTarget
              ? orders[`${sheetTarget.sectionIdx}:${sheetTarget.itemIdx}`] || null
              : null
          }
          onClose={() => setSheetTarget(null)}
          onSave={handleOrderSave}
          onDelete={handleOrderDelete}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  detailContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a50',
    gap: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  detailTitle: { fontSize: 17, fontWeight: '700', color: '#fff', flex: 1 },
  editIcon: { fontSize: 14, opacity: 0.7 },
  titleInput: {
    flex: 1, fontSize: 17, fontWeight: '700', color: '#fff',
    backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#e94560',
  },
  detailClose: { fontSize: 22, color: '#888', paddingHorizontal: 4 },

  addBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#3a1d24', borderBottomWidth: 1, borderBottomColor: '#e94560',
  },
  addBannerText: { color: '#fda4af', fontSize: 13, fontWeight: '700' },
  addBannerDone: { color: '#fff', fontSize: 13, fontWeight: '700' },

  photoZoom: {
    height: Dimensions.get('window').height * 0.38,
    backgroundColor: '#000',
    overflow: 'hidden',
    flexGrow: 0,
  },
  photoZoomContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  photoImg: { width: '100%', height: '100%' },

  filterBar: {
    flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#2a2a50',
  },
  filterRow: {
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, flexDirection: 'row',
  },
  filterPill: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 1,
    borderColor: '#2a2a50', backgroundColor: '#1a1a2e',
  },
  filterPillOn: { borderColor: '#e94560', backgroundColor: '#3a1d24' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterPillTextOn: { color: '#fda4af' },

  detailDate: {
    fontSize: 11, color: '#e94560', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },

  detailFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#0f0f1a',
    borderTopWidth: 1, borderTopColor: '#2a2a50',
  },
  footerRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 10, backgroundColor: '#e94560',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: '#2a2a50',
  },
  deleteBtnText: { color: '#888', fontSize: 16 },
});
