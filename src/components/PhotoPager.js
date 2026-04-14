import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, Dimensions,
} from 'react-native';

const { width: W } = Dimensions.get('window');

export default function PhotoPager({ uris, style, imageHeight }) {
  const [page, setPage] = useState(0);
  const list = Array.isArray(uris) ? uris.filter(Boolean) : [];
  if (list.length === 0) return null;

  const single = list.length === 1;

  return (
    <View style={[s.container, style]}>
      <ScrollView
        horizontal
        pagingEnabled={!single}
        scrollEnabled={!single}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / W);
          setPage(i);
        }}
        style={s.flex}
      >
        {list.map((uri, i) => (
          <ScrollView
            key={i}
            style={{ width: W, height: imageHeight }}
            contentContainerStyle={s.zoomContent}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bouncesZoom
          >
            <Image source={{ uri }} style={s.img} resizeMode="contain" />
          </ScrollView>
        ))}
      </ScrollView>
      {!single && (
        <>
          <View style={s.dots}>
            {list.map((_, i) => (
              <View key={i} style={[s.dot, i === page && s.dotOn]} />
            ))}
          </View>
          <Text style={s.pageBadge}>{page + 1} / {list.length}</Text>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: '#000', overflow: 'hidden' },
  flex: { flex: 1 },
  zoomContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  img: { width: '100%', height: '100%' },
  dots: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', gap: 6, justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { backgroundColor: '#fff' },
  pageBadge: {
    position: 'absolute', top: 8, right: 10,
    color: '#fff', fontSize: 11, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    overflow: 'hidden',
  },
});
