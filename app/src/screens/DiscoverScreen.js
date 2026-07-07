import { useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, PanResponder, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Backdrop from '../components/Backdrop'
import { candidates } from '../data/mock'
import { colors } from '../theme'

export default function DiscoverScreen({ navigation }) {
  const [index, setIndex] = useState(0)
  const pan = useRef(new Animated.ValueXY()).current
  const current = candidates[index]
  const next = candidates[index + 1]

  const reset = () => pan.setValue({ x: 0, y: 0 })

  const swipe = (dir) => {
    Animated.timing(pan, {
      toValue: { x: dir === 'like' ? 500 : -500, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (dir === 'like' && current?.id === 11) navigation.navigate('Match', { peer: current })
      setIndex((i) => i + 1)
      reset()
    })
  }

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 120) swipe('like')
        else if (g.dx < -120) swipe('nope')
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
      },
    })
  ).current

  const rotate = pan.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-14deg', '0deg', '14deg'] })
  const likeOp = pan.x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' })
  const nopeOp = pan.x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: 'clamp' })

  return (
    <Backdrop>
      <View style={styles.head}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.icn}><Text>⚙︎</Text></View>
      </View>

      <View style={styles.deck}>
        {!current ? (
          <Text style={{ color: colors.muted }}>You're all caught up ✨</Text>
        ) : (
          <>
            {next && (
              <View style={[styles.card, { transform: [{ scale: 0.95 }, { translateY: 12 }] }]}>
                <LinearGradient colors={next.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photo}>
                  <Text style={styles.emoji}>{next.emoji}</Text>
                </LinearGradient>
              </View>
            )}
            <Animated.View
              {...responder.panHandlers}
              style={[styles.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
            >
              <LinearGradient colors={current.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photo}>
                <Text style={styles.emoji}>{current.emoji}</Text>
              </LinearGradient>

              <Animated.View style={[styles.stamp, styles.like, { opacity: likeOp }]}><Text style={[styles.stampT, { color: colors.p4 }]}>LIKE</Text></Animated.View>
              <Animated.View style={[styles.stamp, styles.nope, { opacity: nopeOp }]}><Text style={[styles.stampT, { color: colors.danger }]}>NOPE</Text></Animated.View>

              <LinearGradient colors={['transparent', 'rgba(9,6,14,0.94)']} style={styles.info}>
                <Text style={styles.name}>{current.name}, {current.age} {current.verified ? '✔️' : ''}</Text>
                <Text style={styles.dist}>📍 {current.distanceKm} km away · Active now</Text>
                <View style={styles.chips}>
                  {current.interests.map((i) => (
                    <View key={i} style={styles.chip}><Text style={styles.chipT}>{i}</Text></View>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          </>
        )}
      </View>

      {current && (
        <View style={styles.actions}>
          <Pressable style={styles.act} onPress={() => swipe('nope')}><Text style={{ fontSize: 22, color: colors.danger }}>✕</Text></Pressable>
          <Pressable style={[styles.act, styles.star]} onPress={() => setIndex((i) => i + 1)}><Text style={{ fontSize: 18, color: colors.p3 }}>⭐</Text></Pressable>
          <Pressable style={[styles.act, styles.yes]} onPress={() => swipe('like')}><Text style={{ fontSize: 22 }}>❤️</Text></Pressable>
        </View>
      )}
    </Backdrop>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 10 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '600', color: colors.ink },
  icn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, alignItems: 'center', justifyContent: 'center' },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  card: { position: 'absolute', top: 6, bottom: 10, width: '92%', borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBrd },
  photo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 150 },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingTop: 40 },
  name: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  dist: { color: '#eadff2', fontSize: 13, fontWeight: '600', marginTop: 5, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100 },
  chipT: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  stamp: { position: 'absolute', top: 30, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, borderWidth: 3 },
  like: { left: 20, borderColor: colors.p4, transform: [{ rotate: '-14deg' }] },
  nope: { right: 20, borderColor: colors.danger, transform: [{ rotate: '14deg' }] },
  stampT: { fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 100, paddingTop: 6 },
  act: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, alignItems: 'center', justifyContent: 'center' },
  star: { width: 52, height: 52, borderRadius: 26 },
  yes: { borderWidth: 0, backgroundColor: colors.p1 },
})
