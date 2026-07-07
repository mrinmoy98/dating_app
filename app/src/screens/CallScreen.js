import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme'

export default function CallScreen({ route, navigation }) {
  const peer = route.params?.peer ?? { name: 'Aisha', emoji: '👩🏻' }
  const [sec, setSec] = useState(0)
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')

  return (
    <LinearGradient colors={['#241533', '#0f0a17']} style={styles.root}>
      <Text style={styles.remote}>{peer.emoji}</Text>

      <View style={styles.name}>
        <Text style={styles.nameT}>{peer.name}</Text>
        <Text style={styles.timer}>{mm}:{ss}</Text>
      </View>

      <LinearGradient colors={[colors.p4, colors.p2]} style={styles.self}>
        <Text style={{ fontSize: 50 }}>🙂</Text>
      </LinearGradient>

      <View style={styles.ctrl}>
        <Pressable style={[styles.b, muted && styles.off]} onPress={() => setMuted((v) => !v)}><Text style={styles.bIcon}>{muted ? '🔇' : '🎤'}</Text></Pressable>
        <Pressable style={[styles.b, camOff && styles.off]} onPress={() => setCamOff((v) => !v)}><Text style={styles.bIcon}>📹</Text></Pressable>
        <Pressable style={[styles.b, styles.end]} onPress={() => navigation.goBack()}><Text style={styles.bIcon}>☎️</Text></Pressable>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  remote: { fontSize: 180 },
  name: { position: 'absolute', top: 60, left: 26 },
  nameT: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  timer: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  self: { position: 'absolute', top: 60, right: 26, width: 110, height: 160, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  ctrl: { position: 'absolute', bottom: 50, flexDirection: 'row', gap: 20 },
  b: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.5 },
  end: { backgroundColor: '#ff3b6a', borderWidth: 0 },
  bIcon: { fontSize: 24 },
})
