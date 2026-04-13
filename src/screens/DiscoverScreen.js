import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, FlatList,
  Image, Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { describeArtwork, describeStreet } from '../services/claudeApi';
import { setCurrentDestination, getCurrentDestination } from '../services/destinationContext';
import DESTINATIONS from '../data/destinations';

const DEPTH_OPTIONS = [
  { key: 'quick',    label: 'Quick',     icon: '⚡' },
  { key: 'standard', label: 'Standard',  icon: '📖' },
  { key: 'deep',     label: 'Deep Dive', icon: '🔬' },
];

// ── Site Detail View (museum / church full-page detail) ───────────────────────
function SiteDetailView({ site, onBack }) {
  const [imgFailed, setImgFailed] = useState(false);

  function openMaps() {
    const q = encodeURIComponent(site.mapQuery || site.name + ' Italy');
    Linking.openURL(`https://maps.apple.com/?q=${q}`).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`)
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Hero image */}
        {site.image && !imgFailed ? (
          <Image
            source={{ uri: site.image }}
            style={sd.hero}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={[sd.hero, sd.heroPlaceholder]}>
            <Text style={sd.heroEmoji}>🏛️</Text>
          </View>
        )}

        {/* Back button overlaid at top of image */}
        <TouchableOpacity style={sd.backBtn} onPress={onBack}>
          <Text style={sd.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={sd.content}>
          <Text style={sd.name}>{site.name}</Text>

          {/* Quick-info strip */}
          {(site.hours || site.price || site.duration) && (
            <View style={sd.infoStrip}>
              {site.hours && (
                <View style={sd.infoItem}>
                  <Text style={sd.infoIcon}>🕐</Text>
                  <Text style={sd.infoLabel}>Hours</Text>
                  <Text style={sd.infoValue}>{site.hours}</Text>
                </View>
              )}
              {site.price && (
                <View style={[sd.infoItem, site.hours && sd.infoItemBorder]}>
                  <Text style={sd.infoIcon}>💶</Text>
                  <Text style={sd.infoLabel}>Price</Text>
                  <Text style={sd.infoValue}>{site.price}</Text>
                </View>
              )}
              {site.duration && (
                <View style={[sd.infoItem, (site.hours || site.price) && sd.infoItemBorder]}>
                  <Text style={sd.infoIcon}>⏱</Text>
                  <Text style={sd.infoLabel}>Allow</Text>
                  <Text style={sd.infoValue}>{site.duration}</Text>
                </View>
              )}
            </View>
          )}

          {/* Best time callout */}
          {site.bestTime && (
            <View style={sd.bestTimeBox}>
              <Text style={sd.bestTimeTitle}>⏰  Best time to visit</Text>
              <Text style={sd.bestTimeText}>{site.bestTime}</Text>
            </View>
          )}

          {/* Address */}
          {site.address && (
            <Text style={sd.address}>📍 {site.address}</Text>
          )}

          {/* Description */}
          <Text style={sd.description}>{site.description}</Text>

          {/* Don't-miss highlights */}
          {site.highlights?.length > 0 && (
            <View style={sd.highlightsBox}>
              <Text style={sd.highlightsTitle}>✨  Don't miss</Text>
              {site.highlights.map((h, i) => (
                <View key={i} style={sd.highlightRow}>
                  <Text style={sd.highlightDot}>▸</Text>
                  <Text style={sd.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tip */}
          {site.tip && (
            <View style={sd.tipBox}>
              <Text style={sd.tipText}>💡  {site.tip}</Text>
            </View>
          )}

          {/* Open in Maps */}
          {site.mapQuery && (
            <TouchableOpacity style={sd.mapsBtn} onPress={openMaps}>
              <Text style={sd.mapsBtnText}>🗺  Open in Maps</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Destination Detail View ───────────────────────────────────────────────────
function DestinationDetail({ destination, isActive, onSetActive, onBack }) {
  const [section, setSection] = useState('overview');
  const [selectedSite, setSelectedSite] = useState(null);
  const [heroFailed, setHeroFailed] = useState(false);

  const SECTIONS = [
    { key: 'overview',      label: 'Overview'  },
    { key: 'neighborhoods', label: 'Areas'     },
    { key: 'museums',       label: 'Museums'   },
    { key: 'churches',      label: 'Churches'  },
    { key: 'food',          label: 'Food'      },
    { key: 'practical',     label: 'Tips'      },
  ];

  // Show site detail when a museum / church is tapped
  if (selectedSite) {
    return <SiteDetailView site={selectedSite} onBack={() => setSelectedSite(null)} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={dv.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Text style={dv.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={dv.title}>{destination.emoji} {destination.name}</Text>
        <TouchableOpacity
          style={[dv.setBtn, isActive && dv.setBtnActive]}
          onPress={onSetActive}
        >
          <Text style={[dv.setBtnText, isActive && dv.setBtnTextActive]}>
            {isActive ? '📍 Active' : 'Set Active'}
          </Text>
        </TouchableOpacity>
      </View>

      {isActive && (
        <View style={dv.activeBanner}>
          <Text style={dv.activeBannerText}>
            📍 Claude is using {destination.name} as context for camera features
          </Text>
        </View>
      )}

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dv.tabScroll}>
        {SECTIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[dv.tab, section === s.key && dv.tabActive]}
            onPress={() => setSection(s.key)}
          >
            <Text style={[dv.tabText, section === s.key && dv.tabTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── Overview ── */}
        {section === 'overview' && (
          <>
            {/* Full-bleed hero with overlay tagline */}
            <View style={dv.heroWrapper}>
              {destination.heroImage && !heroFailed ? (
                <Image
                  source={{ uri: destination.heroImage }}
                  style={dv.heroFull}
                  resizeMode="cover"
                  onError={() => setHeroFailed(true)}
                />
              ) : (
                <View style={[dv.heroFull, dv.heroPlaceholder]}>
                  <Text style={{ fontSize: 64 }}>{destination.emoji}</Text>
                </View>
              )}
              <View style={dv.heroOverlay}>
                <Text style={dv.heroTaglineText}>{destination.tagline}</Text>
                <Text style={dv.heroRegionText}>{destination.region} · Italy</Text>
              </View>
            </View>

            <Text style={dv.body}>{destination.overview}</Text>
            <View style={dv.divider} />
            <Text style={dv.sectionTitle}>History</Text>
            <Text style={dv.body}>{destination.history}</Text>
          </>
        )}

        {/* ── Practical tips ── */}
        {section === 'practical' && destination.practical.map((tip, i) => (
          <View key={i} style={dv.tipCard}>
            <Text style={dv.tipIcon}>{tip.icon}</Text>
            <Text style={dv.tipText}>{tip.tip}</Text>
          </View>
        ))}

        {/* ── Neighborhoods ── */}
        {section === 'neighborhoods' && (
          <>
            <SectionBanner
              uri={destination.neighborhoods.find(n => n.image)?.image || destination.heroImage}
              icon="🗺️"
              label={`${destination.name} — Areas`}
              sub={`${destination.neighborhoods.length} neighbourhoods to explore`}
            />
            {destination.neighborhoods.map((n, i) => (
              <View key={i} style={dv.areaCard}>
                {n.image ? <NeighbourhoodImage uri={n.image} /> : null}
                <View style={dv.areaCardBody}>
                  <Text style={dv.cardTitle}>{n.name}</Text>
                  {n.bestFor && <Text style={dv.cardBestFor}>Best for: {n.bestFor}</Text>}
                  <Text style={dv.cardBody}>{n.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Museums ── */}
        {section === 'museums' && (
          <>
            <SectionBanner
              uri={destination.heroImage}
              icon="🏛️"
              label="Museums & Sites"
              sub={`${destination.museums.length} highlighted attractions`}
            />
            {destination.museums.map((m, i) => (
              <TouchableOpacity key={i} style={dv.siteCardV} onPress={() => setSelectedSite(m)} activeOpacity={0.85}>
                <SiteCardImage uri={m.image} fallback="🏛️" />
                <View style={dv.siteCardVBody}>
                  <Text style={dv.siteCardName}>{m.name}</Text>
                  <View style={dv.siteQuickRow}>
                    {m.hours && <Text style={dv.siteQuickChip} numberOfLines={1}>🕐 {m.hours.split('·')[0].split(',')[0].trim()}</Text>}
                    {m.price && <Text style={dv.siteQuickChip} numberOfLines={1}>💶 {m.price.split('·')[0].trim()}</Text>}
                    {m.duration && <Text style={dv.siteQuickChip}>⏱ {m.duration.split('(')[0].trim()}</Text>}
                  </View>
                  <Text style={dv.siteCardDesc} numberOfLines={3}>{m.description}</Text>
                  <Text style={dv.tapHint}>Tap for full guide  ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Churches ── */}
        {section === 'churches' && (
          <>
            <SectionBanner
              uri={destination.churches.find(c => c.image)?.image || destination.heroImage}
              icon="⛪"
              label="Churches & Basilicas"
              sub={`${destination.churches.length} essential churches`}
            />
            {destination.churches.map((c, i) => (
              <TouchableOpacity key={i} style={dv.siteCardV} onPress={() => setSelectedSite(c)} activeOpacity={0.85}>
                <SiteCardImage uri={c.image} fallback="⛪" />
                <View style={dv.siteCardVBody}>
                  <Text style={dv.siteCardName}>{c.name}</Text>
                  <View style={dv.siteQuickRow}>
                    {c.hours && <Text style={dv.siteQuickChip} numberOfLines={1}>🕐 {c.hours.split('·')[0].trim()}</Text>}
                    {c.price && <Text style={dv.siteQuickChip} numberOfLines={1}>💶 {c.price.split('·')[0].trim()}</Text>}
                  </View>
                  <Text style={dv.siteCardDesc} numberOfLines={3}>{c.description}</Text>
                  <Text style={dv.tapHint}>Tap for highlights  ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Food ── */}
        {section === 'food' && (
          <>
            <SectionBanner
              uri={destination.heroImage}
              icon="🍝"
              label={`Eat in ${destination.name}`}
              sub="Local dishes you must try"
            />
            {destination.food.map((f, i) => (
              <View key={i} style={dv.foodCard}>
                <Text style={dv.foodNum}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={dv.foodInfo}>
                  <Text style={dv.cardTitle}>{f.name}</Text>
                  <Text style={dv.cardBody}>{f.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </View>
  );
}

// Full-bleed neighbourhood banner image
function NeighbourhoodImage({ uri }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={{ uri }}
      style={dv.neighbourhoodImg}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

// Full-width photo for vertical museum/church cards
function SiteCardImage({ uri, fallback = '🏛️' }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={dv.siteCardImg}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[dv.siteCardImg, dv.siteCardImgPlaceholder]}>
      <Text style={{ fontSize: 56 }}>{fallback}</Text>
    </View>
  );
}

// Section-level banner that bleeds edge-to-edge above a tab's content
function SectionBanner({ uri, icon, label, sub }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={dv.tabBanner}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={dv.tabBannerImg}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[dv.tabBannerImg, dv.tabBannerPlaceholder]}>
          <Text style={{ fontSize: 56 }}>{icon}</Text>
        </View>
      )}
      <View style={dv.tabBannerOverlay}>
        <Text style={dv.tabBannerLabel}>{label}</Text>
        {sub ? <Text style={dv.tabBannerSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

// ── Guide List View ───────────────────────────────────────────────────────────
function GuideView() {
  const [selected, setSelected] = useState(null);
  const [activeId, setActiveId] = useState(getCurrentDestination()?.id ?? null);

  function handleSetActive(destination) {
    if (activeId === destination.id) {
      setCurrentDestination(null);
      setActiveId(null);
    } else {
      setCurrentDestination(destination);
      setActiveId(destination.id);
    }
  }

  if (selected) {
    return (
      <DestinationDetail
        destination={selected}
        isActive={activeId === selected.id}
        onSetActive={() => handleSetActive(selected)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <View style={styles.flex}>
      {activeId && (
        <View style={dv.activeBanner}>
          <Text style={dv.activeBannerText}>
            📍 {DESTINATIONS.find(d => d.id === activeId)?.name} is active — Claude knows your location
          </Text>
        </View>
      )}
      <FlatList
        data={DESTINATIONS}
        keyExtractor={d => d.id}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item }) => (
          <DestinationCard
            item={item}
            isActive={activeId === item.id}
            onPress={() => setSelected(item)}
          />
        )}
      />
    </View>
  );
}

function DestinationCard({ item, isActive, onPress }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <TouchableOpacity
      style={[dv.destCard, isActive && dv.destCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {item.heroImage && !imgFailed ? (
        <Image
          source={{ uri: item.heroImage }}
          style={dv.destHeroImg}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : null}
      <View style={dv.destCardContent}>
        <Text style={dv.destEmoji}>{item.emoji}</Text>
        <View style={dv.destInfo}>
          <Text style={dv.destName}>{item.name}</Text>
          <Text style={dv.destRegion}>{item.region}</Text>
          <Text style={dv.destTagline}>{item.tagline}</Text>
          <Text style={dv.destMuseumCount}>
            {item.museums.length} sites · {item.churches.length} churches · {item.neighborhoods.length} areas
          </Text>
        </View>
        <View style={dv.destRight}>
          {isActive && <Text style={dv.activePin}>📍</Text>}
          <Text style={dv.destArrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Camera + Museum/Street Views ──────────────────────────────────────────────
export default function DiscoverScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode]         = useState('guide');
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [depth, setDepth]       = useState('standard');
  const [speaking, setSpeaking] = useState(false);
  const cameraRef = useRef(null);

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setCameraActive(false);
      const text = mode === 'museum'
        ? await describeArtwork(photo.base64, depth)
        : await describeStreet(photo.base64);
      setResult(text);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleSpeech() {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(result, {
        language: 'en-US', rate: 0.9,
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  }

  if (!permission?.granted && mode !== 'guide') {
    return (
      <View style={styles.container}>
        <ModeToggle mode={mode} setMode={setMode} setResult={setResult} />
        <View style={styles.centered}>
          <Text style={styles.permText}>Camera access is needed.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
            <Text style={styles.actionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCameraActive(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={loading}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={{ width: 80 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModeToggle mode={mode} setMode={setMode} setResult={setResult} />

      {mode === 'guide' && <GuideView />}

      {(mode === 'museum' || mode === 'street') && (
        <>
          {mode === 'museum' && !result && (
            <View style={styles.depthRow}>
              {DEPTH_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.depthBtn, depth === opt.key && styles.depthBtnActive]}
                  onPress={() => setDepth(opt.key)}
                >
                  <Text style={styles.depthIcon}>{opt.icon}</Text>
                  <Text style={[styles.depthLabel, depth === opt.key && styles.depthLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>
                {mode === 'museum' ? 'Analysing artwork…' : 'Identifying landmark…'}
              </Text>
            </View>
          ) : result ? (
            <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.resultLabel}>{mode === 'museum' ? 'Guide' : 'Discovery'}</Text>
              <Text style={styles.resultText}>{result}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.listenBtn} onPress={toggleSpeech}>
                  <Text style={styles.actionBtnText}>{speaking ? '⏹  Stop' : '🔊  Listen'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setResult(null); setCameraActive(true); }}>
                  <Text style={styles.actionBtnText}>New Photo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.hint}>
                {mode === 'museum'
                  ? 'Photograph an artwork or exhibit for an AI-narrated explanation.'
                  : 'Point at any building or landmark to discover its history.'}
              </Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setCameraActive(true)}>
                <Text style={styles.camIcon}>{mode === 'museum' ? '🏛️' : '🔍'}</Text>
                <Text style={styles.actionBtnText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function ModeToggle({ mode, setMode, setResult }) {
  return (
    <View style={styles.modeToggle}>
      {[
        { key: 'guide',  label: '🗺️  Guide'    },
        { key: 'museum', label: '🏛️  Museum'   },
        { key: 'street', label: '🔍  Explorer' },
      ].map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
          onPress={() => { setMode(key); setResult?.(null); }}
        >
          <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#1e1e35', borderRadius: 12, padding: 4, marginBottom: 14 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#e94560' },
  modeBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  depthRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  depthBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e1e35', borderWidth: 1, borderColor: '#333' },
  depthBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1a25' },
  depthIcon: { fontSize: 20, marginBottom: 4 },
  depthLabel: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  depthLabelActive: { color: '#e94560' },
  permText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  hint: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  camIcon: { fontSize: 32 },
  actionBtn: { backgroundColor: '#e94560', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center', gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listenBtn: { backgroundColor: '#16213e', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e94560' },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 20 },
  resultLabel: { fontSize: 11, fontWeight: '700', color: '#e94560', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  resultText: { fontSize: 16, color: '#fff', lineHeight: 26 },
  loadingText: { color: '#aaa', fontSize: 16 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, backgroundColor: '#000' },
  captureButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelBtn: { width: 80, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 15 },
});

// Destination detail styles
const dv = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  back: { color: '#e94560', fontSize: 16, fontWeight: '600', width: 60 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  setBtn: { backgroundColor: '#1e1e35', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  setBtnActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  setBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },
  setBtnTextActive: { color: '#e94560' },
  activeBanner: { backgroundColor: '#2a1020', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e94560' },
  activeBannerText: { color: '#e94560', fontSize: 13, textAlign: 'center' },
  tabScroll: { marginBottom: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, marginRight: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a2e' },
  tabActive: { borderColor: '#e94560', backgroundColor: '#2a1020' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#e94560' },

  // ── Overview hero (full-bleed, negative margin to escape the ScrollView padding) ──
  heroWrapper: { marginHorizontal: -16, marginBottom: 18 },
  heroFull: { width: '100%', height: 260 },
  heroPlaceholder: { backgroundColor: '#1e1e35', alignItems: 'center', justifyContent: 'center' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,10,20,0.65)', paddingHorizontal: 16, paddingVertical: 14,
  },
  heroTaglineText: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroRegionText: { fontSize: 13, color: '#e94560' },

  body: { fontSize: 15, color: '#ccc', lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#2a2a50', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8 },

  // ── Section banner (full-bleed, negative margin) ──
  tabBanner: { marginHorizontal: -16, marginBottom: 20, height: 170 },
  tabBannerImg: { width: '100%', height: '100%' },
  tabBannerPlaceholder: { backgroundColor: '#1e1e35', alignItems: 'center', justifyContent: 'center' },
  tabBannerOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,10,20,0.70)', paddingHorizontal: 16, paddingVertical: 12,
  },
  tabBannerLabel: { fontSize: 20, fontWeight: '800', color: '#fff' },
  tabBannerSub: { fontSize: 13, color: '#e94560', marginTop: 2 },

  // ── Plain info cards ──
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a50', overflow: 'hidden' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardBestFor: { fontSize: 12, color: '#e94560', fontStyle: 'italic', marginBottom: 6 },
  cardBody: { fontSize: 14, color: '#aaa', lineHeight: 21 },

  // ── Neighbourhood cards ──
  areaCard: { backgroundColor: '#1a1a2e', borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: '#2a2a50', overflow: 'hidden' },
  areaCardBody: { padding: 14 },
  neighbourhoodImg: { width: '100%', height: 170 },

  // ── Tip cards ──
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2a2a50' },
  tipIcon: { fontSize: 20, width: 24 },
  tipText: { flex: 1, fontSize: 14, color: '#ccc', lineHeight: 21 },

  // ── Vertical site cards (museums, churches) ──
  siteCardV: { backgroundColor: '#1a1a2e', borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a50', overflow: 'hidden' },
  siteCardImg: { width: '100%', height: 210 },
  siteCardImgPlaceholder: { backgroundColor: '#1e1e35', alignItems: 'center', justifyContent: 'center' },
  siteCardVBody: { padding: 14, gap: 6 },
  siteCardName: { fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 21 },
  siteQuickRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginVertical: 2 },
  siteQuickChip: { fontSize: 11, color: '#aaa', backgroundColor: '#0f0f1a', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden' },
  siteCardDesc: { fontSize: 13, color: '#999', lineHeight: 19 },
  tapHint: { fontSize: 12, color: '#e94560', fontWeight: '700', marginTop: 4 },

  // ── Food cards ──
  foodCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a50' },
  foodNum: { fontSize: 22, fontWeight: '800', color: '#e94560', opacity: 0.5, width: 34 },
  foodInfo: { flex: 1 },

  // ── Destination list cards ──
  destCard: { backgroundColor: '#1a1a2e', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a50', overflow: 'hidden' },
  destCardActive: { borderColor: '#e94560', backgroundColor: '#1f1220' },
  destHeroImg: { width: '100%', height: 160 },
  destCardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  destEmoji: { fontSize: 36, marginRight: 12 },
  destInfo: { flex: 1 },
  destName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  destRegion: { fontSize: 13, color: '#888', marginTop: 2 },
  destTagline: { fontSize: 13, color: '#e94560', marginTop: 4, fontStyle: 'italic' },
  destMuseumCount: { fontSize: 11, color: '#555', marginTop: 4 },
  destRight: { alignItems: 'center', gap: 4 },
  activePin: { fontSize: 16 },
  destArrow: { fontSize: 24, color: '#555' },
});

// Site detail styles
const sd = StyleSheet.create({
  hero: { width: '100%', height: 260 },
  heroPlaceholder: { backgroundColor: '#1e1e35', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 60 },

  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(15,15,26,0.80)', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  backText: { color: '#e94560', fontSize: 15, fontWeight: '700' },

  content: { padding: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 14 },

  infoStrip: {
    flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a50', marginBottom: 14, overflow: 'hidden',
  },
  infoItem: { flex: 1, padding: 12, gap: 3 },
  infoItemBorder: { borderLeftWidth: 1, borderLeftColor: '#2a2a50' },
  infoIcon: { fontSize: 16 },
  infoLabel: { fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  infoValue: { fontSize: 12, color: '#ccc', lineHeight: 17 },

  bestTimeBox: {
    backgroundColor: '#1a2a1a', borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#2a502a',
  },
  bestTimeTitle: { fontSize: 12, fontWeight: '700', color: '#6fcf97', marginBottom: 4 },
  bestTimeText: { fontSize: 13, color: '#a8d8b8', lineHeight: 19 },

  address: { fontSize: 13, color: '#666', marginBottom: 12 },

  description: { fontSize: 15, color: '#ccc', lineHeight: 24, marginBottom: 18 },

  highlightsBox: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#2a2a50',
  },
  highlightsTitle: { fontSize: 13, fontWeight: '800', color: '#e94560', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  highlightRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  highlightDot: { color: '#e94560', fontSize: 14, marginTop: 1 },
  highlightText: { flex: 1, fontSize: 14, color: '#ddd', lineHeight: 20 },

  tipBox: {
    backgroundColor: '#1e2a1e', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#2a502a',
  },
  tipText: { fontSize: 14, color: '#a8d8b8', lineHeight: 21 },

  mapsBtn: {
    backgroundColor: '#1e1e35', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#e94560',
  },
  mapsBtnText: { color: '#e94560', fontSize: 16, fontWeight: '700' },
});
