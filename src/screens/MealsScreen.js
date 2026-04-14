import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  Modal, ScrollView, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { initMenusDb, getMenu, getAllMenus } from '../services/menusDb';
import {
  initMealsDb, getAllMeals, getMeal, createMeal, deleteMeal,
} from '../services/mealsDb';
import {
  initOrdersDb, getOrdersForMeal, upsertOrder, deleteOrder,
} from '../services/menuOrdersDb';
import MenuDetailModal from '../components/MenuDetailModal';
import OrderSheet from '../components/OrderSheet';

function formatDate(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function findItem(translation, sectionIdx, itemIdx) {
  if (!translation) return null;
  try {
    const obj = JSON.parse(translation.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    return obj?.sections?.[sectionIdx]?.items?.[itemIdx] || null;
  } catch {
    return null;
  }
}

export default function MealsScreen({ active = true }) {
  const insets = useSafeAreaInsets();
  const [meals, setMeals] = useState([]);
  const [ordersByMeal, setOrdersByMeal] = useState({});
  const [openMealId, setOpenMealId] = useState(null);
  const [picker, setPicker] = useState(false);
  const [menusForPicker, setMenusForPicker] = useState([]);
  // When set, opens the menu modal in add-mode bound to this meal.
  const [addToMeal, setAddToMeal] = useState(null); // { menu, mealId }

  const load = useCallback(() => {
    const rows = getAllMeals();
    setMeals(rows);
    const map = {};
    for (const m of rows) {
      map[m.id] = getOrdersForMeal(m.id);
    }
    setOrdersByMeal(map);
  }, []);

  useEffect(() => {
    initMenusDb();
    initOrdersDb();
    initMealsDb();
    load();
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  // JournalScreen keeps inactive tabs mounted with display:none, so focus
  // effects don't fire on tab-switch. Reload whenever this tab becomes active.
  useEffect(() => { if (active) load(); }, [active, load]);

  function openPicker() {
    setMenusForPicker(getAllMenus());
    setPicker(true);
  }

  function pickMenuAndStartMeal(menu) {
    // Defer meal row creation to the first dish save inside MenuDetailModal.
    setPicker(false);
    setAddToMeal({ menu, mealId: 'pending' });
  }

  function openMeal(mealId) {
    setOpenMealId(mealId);
  }

  const openMeal_ = openMealId ? meals.find((m) => m.id === openMealId) : null;
  const openMealOrders = openMealId ? ordersByMeal[openMealId] || [] : [];

  if (meals.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>🍽</Text>
        <Text style={s.emptyText}>
          No meals logged yet{'\n'}Open a menu and tap "Start meal here"
        </Text>
        <TouchableOpacity style={s.emptyBtn} onPress={openPicker}>
          <Text style={s.emptyBtnText}>➕  New meal</Text>
        </TouchableOpacity>

        <MenuPickerModal
          visible={picker}
          menus={menusForPicker}
          onPick={pickMenuAndStartMeal}
          onClose={() => setPicker(false)}
        />
        {addToMeal && (
          <MenuDetailModal
            menu={addToMeal.menu}
            addMealId={addToMeal.mealId}
            onClose={() => { setAddToMeal(null); load(); }}
            onChanged={load}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.newBtn} onPress={openPicker}>
          <Text style={s.newBtnText}>➕  New meal</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={meals}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item: meal }) => {
          const orders = ordersByMeal[meal.id] || [];
          const photos = orders.map((o) => o.dish_photo).filter(Boolean).slice(0, 4);
          return (
            <TouchableOpacity style={s.card} onPress={() => openMeal(meal.id)} activeOpacity={0.7}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle} numberOfLines={1}>{meal.menu_title}</Text>
                <Text style={s.cardDate}>{formatDate(meal.eaten_at)}</Text>
              </View>
              <Text style={s.cardCount}>
                {orders.length === 0
                  ? 'No dishes yet'
                  : `${orders.length} ${orders.length === 1 ? 'dish' : 'dishes'}`}
              </Text>
              {photos.length > 0 && (
                <View style={s.photoStrip}>
                  {photos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={s.stripThumb} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <MenuPickerModal
        visible={picker}
        menus={menusForPicker}
        onPick={pickMenuAndStartMeal}
        onClose={() => setPicker(false)}
      />

      {openMeal_ && (
        <MealDetailModal
          meal={openMeal_}
          orders={openMealOrders}
          onClose={() => setOpenMealId(null)}
          onAddDishes={() => {
            const menu = getMenu(openMeal_.menu_id);
            if (menu) {
              setOpenMealId(null);
              setAddToMeal({ menu, mealId: openMeal_.id });
            }
          }}
          onDeleted={() => { setOpenMealId(null); load(); }}
          onChanged={load}
        />
      )}

      {addToMeal && (
        <MenuDetailModal
          menu={addToMeal.menu}
          addMealId={addToMeal.mealId}
          onClose={() => { setAddToMeal(null); load(); }}
          onChanged={load}
        />
      )}
    </View>
  );
}

function MenuPickerModal({ visible, menus, onPick, onClose }) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[s.pickerContainer, { paddingTop: insets.top }]}>
        <View style={s.pickerHeader}>
          <Text style={s.pickerTitle}>Pick a menu</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.detailClose}>✕</Text>
          </TouchableOpacity>
        </View>
        {menus.length === 0 ? (
          <View style={s.pickerEmpty}>
            <Text style={s.emptyText}>No saved menus yet.{'\n'}Translate a menu first.</Text>
          </View>
        ) : (
          <FlatList
            data={menus}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.pickerRow} onPress={() => onPick(item)} activeOpacity={0.7}>
                {item.photo_uri ? (
                  <Image source={{ uri: item.photo_uri }} style={s.pickerThumb} />
                ) : (
                  <View style={[s.pickerThumb, s.stripEmpty]}>
                    <Text style={{ fontSize: 20 }}>📷</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.pickerRowTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.pickerRowDate}>{formatDate(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

function MealDetailModal({ meal, orders, onClose, onAddDishes, onDeleted, onChanged }) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(null); // { order, dish }

  function handleOrderSave({ dishPhoto, rating, note }) {
    if (!editing) return;
    upsertOrder({
      mealId: meal.id,
      menuId: meal.menu_id,
      sectionIdx: editing.order.section_idx,
      itemIdx: editing.order.item_idx,
      dishPhoto, rating, note,
    });
    setEditing(null);
    onChanged?.();
  }

  function handleOrderDelete() {
    if (!editing) return;
    deleteOrder(meal.id, editing.order.section_idx, editing.order.item_idx);
    setEditing(null);
    onChanged?.();
  }

  function handleDelete() {
    Alert.alert('Delete meal?', 'This removes the meal and all its logged dishes.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteMeal(meal.id);
        onDeleted?.();
      } },
    ]);
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={[s.detailContainer, { paddingTop: insets.top }]}>
        <View style={s.detailHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.detailTitle} numberOfLines={1}>{meal.menu_title}</Text>
            <Text style={s.detailSubtitle}>{formatDate(meal.eaten_at)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.detailClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }}>
          {orders.length === 0 ? (
            <Text style={s.dishEmpty}>No dishes yet. Tap "Add dishes" below.</Text>
          ) : (
            orders.map((o) => {
              const dish = findItem(meal.translation, o.section_idx, o.item_idx);
              return (
                <TouchableOpacity
                  key={o.id}
                  style={s.dishCard}
                  onPress={() => setEditing({ order: o, dish })}
                  activeOpacity={0.7}
                >
                  {o.dish_photo ? (
                    <Image source={{ uri: o.dish_photo }} style={s.dishPhoto} />
                  ) : (
                    <View style={[s.dishPhoto, s.stripEmpty]}>
                      <Text style={{ fontSize: 26 }}>🍽</Text>
                    </View>
                  )}
                  <View style={s.dishInfo}>
                    <Text style={s.dishName} numberOfLines={2}>{dish?.name || 'Dish'}</Text>
                    {dish?.price ? <Text style={s.dishPrice}>{dish.price}</Text> : null}
                    {o.rating ? (
                      <Text style={s.stars}>
                        {'★'.repeat(o.rating)}
                        <Text style={s.starsDim}>{'★'.repeat(5 - o.rating)}</Text>
                      </Text>
                    ) : null}
                    {o.note ? <Text style={s.dishNote}>{o.note}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={[s.detailFooter, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.footerRow}>
            <TouchableOpacity style={s.primaryBtn} onPress={onAddDishes}>
              <Text style={s.primaryBtnText}>➕  Add dishes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
              <Text style={s.deleteBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        <OrderSheet
          visible={editing !== null}
          item={editing?.dish}
          existing={editing?.order || null}
          onClose={() => setEditing(null)}
          onSave={handleOrderSave}
          onDelete={handleOrderDelete}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#0f0f1a', padding: 24 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24 },
  emptyBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 10, backgroundColor: '#e94560',
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  newBtn: {
    paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, backgroundColor: '#e94560',
  },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12, marginBottom: 10, padding: 14,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  cardDate: {
    fontSize: 11, color: '#e94560', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  cardCount: { fontSize: 12, color: '#888', marginTop: 4 },
  photoStrip: { flexDirection: 'row', gap: 6, marginTop: 10 },
  stripThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#000' },
  stripEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a50' },

  // Picker
  pickerContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2a2a50',
  },
  pickerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  pickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 10, marginBottom: 8,
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a50',
  },
  pickerThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#000' },
  pickerRowTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pickerRowDate: {
    color: '#e94560', fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2,
  },

  // Meal detail
  detailContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2a2a50', gap: 12,
  },
  detailTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  detailSubtitle: {
    fontSize: 11, color: '#e94560', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2,
  },
  detailClose: { fontSize: 22, color: '#888', paddingHorizontal: 4 },

  dishEmpty: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 60 },
  dishCard: {
    flexDirection: 'row', gap: 12, padding: 12, marginBottom: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a50',
    backgroundColor: '#1a1a2e',
  },
  dishPhoto: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#000' },
  dishInfo: { flex: 1 },
  dishName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  dishPrice: { color: '#e94560', fontSize: 13, fontWeight: '700', marginTop: 2 },
  stars: { fontSize: 13, color: '#fde68a', letterSpacing: 1, marginTop: 4 },
  starsDim: { color: '#3a301a' },
  dishNote: { color: '#bbb', fontSize: 12, fontStyle: 'italic', marginTop: 4 },

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
