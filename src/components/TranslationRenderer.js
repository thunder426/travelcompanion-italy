import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Speech from 'expo-speech';

async function speakItalian(text) {
  if (!text) return;
  await Speech.stop();
  Speech.speak(text, {
    language: 'it-IT',
    rate: 0.85,
    onError: () => Speech.speak(text, { rate: 0.85 }),
  });
}

// Display config for each tag type
const TAG_STYLES = {
  vegetarian:   { icon: '🌿', label: 'Vegetarian',  bg: '#15372a', color: '#6ee7b7' },
  seafood:      { icon: '🐟', label: 'Seafood',     bg: '#13293d', color: '#7dd3fc' },
  meat:         { icon: '🥩', label: 'Meat',        bg: '#3a1d24', color: '#fda4af' },
  specialty:    { icon: '⭐', label: 'Local Specialty', bg: '#3a301a', color: '#fde68a' },
  kid_friendly: { icon: '👶', label: 'Kid-Friendly', bg: '#1f3a1d', color: '#bef264' },
  challenging:  { icon: '⚠️', label: 'Challenging for Kids', bg: '#3a2a16', color: '#fdba74' },
};

const ALLERGEN_LABELS = {
  gluten:    'Gluten',
  dairy:     'Dairy',
  nuts:      'Nuts',
  shellfish: 'Shellfish',
  eggs:      'Eggs',
  soy:       'Soy',
};

// Walk the string and return: whether we're currently inside a string literal
// and the stack of unclosed '{' / '[' (as their corresponding closer chars).
function scanStructure(text) {
  let inString = false, escape = false;
  const stack = [];
  for (const c of text) {
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }
  return { inString, stack };
}

// Best-effort repair for truncated JSON: walk back from the end to the last
// safe boundary, drop trailing commas, and close any open brackets.
function tryRepair(raw) {
  const s = raw.trim();
  for (let i = s.length; i > 0; i--) {
    const ch = s[i - 1];
    // Only try parsing at plausible end-of-value chars
    if (ch !== '}' && ch !== ']' && ch !== '"' && ch !== 'e' /*true/false*/ && ch !== 'l' /*null*/ && !/[0-9]/.test(ch)) continue;
    const prefix = s.slice(0, i);
    const { inString, stack } = scanStructure(prefix);
    if (inString) continue;
    let candidate = prefix.replace(/,\s*$/, '');
    for (let k = stack.length - 1; k >= 0; k--) candidate += stack[k];
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }
  return null;
}

function parse(content) {
  if (!content || typeof content !== 'string') return null;
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === 'object' && obj.type) return obj;
  } catch {}
  // Fall through to repair attempt for truncated output
  const repaired = tryRepair(cleaned);
  if (repaired && repaired.type) return { ...repaired, _truncated: true };
  return null;
}

export default function TranslationRenderer({ content, filterTag, orders, onOrderPress }) {
  const parsed = parse(content);

  // Fallback: plain text
  if (!parsed) {
    return <Text style={s.plain}>{content}</Text>;
  }

  if (parsed.type === 'menu') {
    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    if (sections.length === 0) {
      return <Text style={s.plain}>{content}</Text>;
    }
    // Keep original indices around for order lookup/callback
    const indexed = sections.map((sec, si) => ({
      ...sec,
      _si: si,
      items: (sec.items || []).map((it, ii) => ({ ...it, _ii: ii })),
    }));
    const isOrdered = filterTag === '__ordered__';
    const filtered = filterTag
      ? indexed
          .map((sec) => ({
            ...sec,
            items: sec.items.filter((it) =>
              isOrdered
                ? orders && orders[`${sec._si}:${it._ii}`]
                : Array.isArray(it.tags) && it.tags.includes(filterTag)
            ),
          }))
          .filter((sec) => sec.items.length > 0)
      : indexed;
    if (filterTag && filtered.length === 0) {
      return <Text style={s.filterEmpty}>No items match this filter.</Text>;
    }
    return (
      <View>
        {filtered.map((sec) => (
          <View key={sec._si} style={s.section}>
            <Text style={s.sectionName}>{sec.original || sec.name || 'Menu'}</Text>
            {sec.items.map((item) => (
              <MenuItem
                key={item._ii}
                item={item}
                order={orders && orders[`${sec._si}:${item._ii}`]}
                onOrderPress={
                  onOrderPress ? () => onOrderPress(sec._si, item._ii, item) : null
                }
              />
            ))}
          </View>
        ))}
        {parsed._truncated && (
          <Text style={s.truncated}>
            Menu was long — some items may be missing. Retake the photo zoomed in on one section for full detail.
          </Text>
        )}
      </View>
    );
  }

  if (parsed.type === 'sign') {
    return (
      <View>
        <View style={s.signRow}>
          <Text style={s.signTranslation}>{parsed.translation}</Text>
          {parsed.translation ? (
            <TouchableOpacity
              style={s.speakBtn}
              onPress={() => speakItalian(parsed.translation)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.speakIconLarge}>🔊</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {parsed.note ? (
          <View style={s.noteBox}>
            <Text style={s.noteLabel}>What it means</Text>
            <Text style={s.noteText}>{parsed.note}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (parsed.type === 'none') {
    return (
      <View style={s.noneBox}>
        <Text style={s.noneIcon}>🤔</Text>
        <Text style={s.noneText}>{parsed.message || "Couldn't find any readable text in this photo."}</Text>
      </View>
    );
  }

  return <Text style={s.plain}>{content}</Text>;
}

function MenuItem({ item, order, onOrderPress }) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const allergens = Array.isArray(item.allergens) ? item.allergens : [];
  const ordered = !!order;
  return (
    <View style={[s.item, ordered && s.itemOrdered]}>
      <View style={s.itemHeader}>
        <Text style={s.itemName}>{item.name}</Text>
        <TouchableOpacity
          style={s.speakBtn}
          onPress={() => speakItalian(item.name)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.speakIcon}>🔊</Text>
        </TouchableOpacity>
        {item.price ? <Text style={s.itemPrice}>{item.price}</Text> : null}
      </View>
      {item.desc ? <Text style={s.itemDesc}>{item.desc}</Text> : null}
      {tags.length > 0 && (
        <View style={s.pillRow}>
          {tags.map((t, i) => {
            const cfg = TAG_STYLES[t];
            if (!cfg) return null;
            return (
              <View key={i} style={[s.pill, { backgroundColor: cfg.bg }]}>
                <Text style={[s.pillText, { color: cfg.color }]}>
                  {cfg.icon}  {cfg.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      {allergens.length > 0 && (
        <Text style={s.allergens}>
          Contains: {allergens.map((a) => ALLERGEN_LABELS[a] || a).join(' · ')}
        </Text>
      )}
      {ordered && (
        <TouchableOpacity
          style={s.orderBox}
          onPress={onOrderPress}
          activeOpacity={onOrderPress ? 0.7 : 1}
          disabled={!onOrderPress}
        >
          {order.dish_photo ? (
            <Image source={{ uri: order.dish_photo }} style={s.orderPhoto} />
          ) : (
            <View style={[s.orderPhoto, s.orderPhotoEmpty]}>
              <Text style={{ fontSize: 18 }}>🍽</Text>
            </View>
          )}
          <View style={s.orderInfo}>
            <Text style={s.orderLabel}>You ordered this</Text>
            {order.rating ? (
              <Text style={s.orderStars}>
                {'★'.repeat(order.rating)}
                <Text style={s.orderStarsDim}>{'★'.repeat(5 - order.rating)}</Text>
              </Text>
            ) : null}
            {order.note ? (
              <Text style={s.orderNote} numberOfLines={2}>{order.note}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      )}
      {!ordered && onOrderPress && (
        <TouchableOpacity style={s.addOrderBtn} onPress={onOrderPress} activeOpacity={0.7}>
          <Text style={s.addOrderText}>➕  I had this</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  plain: { fontSize: 16, color: '#fff', lineHeight: 24 },
  filterEmpty: { fontSize: 14, color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },

  section: { marginBottom: 20 },
  sectionName: {
    fontSize: 13, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: 12, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: '#2a2a50',
  },

  item: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1, borderColor: '#2a2a50',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  itemOrdered: { borderColor: '#e94560' },
  addOrderBtn: {
    marginTop: 10, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#2a2a50',
    borderStyle: 'dashed', alignItems: 'center',
  },
  addOrderText: { color: '#888', fontSize: 12, fontWeight: '600' },
  orderBox: {
    flexDirection: 'row', gap: 10, marginTop: 12,
    backgroundColor: '#2a1016', borderRadius: 10, padding: 10,
    alignItems: 'center',
  },
  orderPhoto: { width: 54, height: 54, borderRadius: 8, backgroundColor: '#000' },
  orderPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderLabel: {
    fontSize: 10, fontWeight: '700', color: '#fda4af',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2,
  },
  orderStars: { fontSize: 13, color: '#fde68a', letterSpacing: 1 },
  orderStarsDim: { color: '#3a301a' },
  orderNote: { fontSize: 12, color: '#bbb', marginTop: 2, fontStyle: 'italic' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  speakBtn: { paddingHorizontal: 2 },
  speakIcon: { fontSize: 16, opacity: 0.75 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#e94560' },
  itemDesc: { fontSize: 14, color: '#bbb', lineHeight: 20, marginTop: 4 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14 },
  pillText: { fontSize: 11, fontWeight: '700' },

  allergens: {
    fontSize: 11, color: '#888', fontStyle: 'italic',
    marginTop: 8, letterSpacing: 0.3,
  },

  truncated: {
    fontSize: 12, color: '#fdba74', fontStyle: 'italic',
    marginTop: 8, padding: 10,
    backgroundColor: '#3a2a16', borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: '#fdba74',
  },

  noneBox: {
    alignItems: 'center', padding: 24, marginTop: 20,
    backgroundColor: '#1a1a2e', borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a50',
  },
  noneIcon: { fontSize: 36, marginBottom: 12 },
  noneText: { fontSize: 15, color: '#bbb', lineHeight: 22, textAlign: 'center' },

  signRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  signTranslation: { fontSize: 20, color: '#fff', lineHeight: 28, fontWeight: '600', flex: 1 },
  speakIconLarge: { fontSize: 20, opacity: 0.75 },
  noteBox: {
    marginTop: 16, padding: 14,
    backgroundColor: '#1a1a2e',
    borderLeftWidth: 3, borderLeftColor: '#e94560',
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 11, fontWeight: '700', color: '#e94560',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  noteText: { fontSize: 14, color: '#bbb', lineHeight: 20 },
});
