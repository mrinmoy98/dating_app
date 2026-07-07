import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { reels } from '../data/mock'
import { colors } from '../theme'

function Reel({ r, height }) {
  const [liked, setLiked] = useState(false)
  const [following, setFollowing] = useState(r.following)
  return (
    <LinearGradient colors={r.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.reel, { height }]}>
      <Text style={styles.big}>{r.emoji}</Text>

      <View style={styles.side}>
        <Pressable style={styles.sideBtn} onPress={() => setLiked((v) => !v)}>
          <Text style={styles.sideIcon}>{liked ? '❤️' : '🤍'}</Text><Text style={styles.sideT}>{r.likes}</Text>
        </Pressable>
        <View style={styles.sideBtn}><Text style={styles.sideIcon}>💬</Text><Text style={styles.sideT}>{r.comments}</Text></View>
        <View style={styles.sideBtn}><Text style={styles.sideIcon}>↗︎</Text><Text style={styles.sideT}>Share</Text></View>
      </View>

      <View style={styles.meta}>
        <View style={styles.u}>
          <LinearGradient colors={r.grad} style={styles.av} />
          <Text style={styles.uName}>@{r.user}</Text>
          <Pressable style={[styles.follow, following && styles.followOn]} onPress={() => setFollowing((v) => !v)}>
            <Text style={styles.followT}>{following ? 'Following' : 'Follow'}</Text>
          </Pressable>
        </View>
        <Text style={styles.caption}>{r.caption}</Text>
      </View>
    </LinearGradient>
  )
}

export default function ReelsScreen() {
  const { height } = useWindowDimensions()
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={reels}
        keyExtractor={(r) => String(r.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <Reel r={item} height={height} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  reel: { alignItems: 'center', justifyContent: 'center' },
  big: { fontSize: 150 },
  side: { position: 'absolute', right: 20, bottom: 150, alignItems: 'center', gap: 22 },
  sideBtn: { alignItems: 'center' },
  sideIcon: { fontSize: 26 },
  sideT: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 3 },
  meta: { position: 'absolute', left: 20, right: 90, bottom: 90 },
  u: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  av: { width: 34, height: 34, borderRadius: 17 },
  uName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  follow: { borderWidth: 1.5, borderColor: '#fff', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 100 },
  followOn: { borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.15)' },
  followT: { color: '#fff', fontSize: 12, fontWeight: '700' },
  caption: { color: '#f0e8f5', fontSize: 14, marginTop: 9 },
})
