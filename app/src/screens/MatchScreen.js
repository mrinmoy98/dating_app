import { View, Text, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme'

// "It's a Match!" celebration — presented as a modal screen.
export default function MatchScreen({ route, navigation }) {
  const peer = route.params?.peer ?? { name: 'Aisha', emoji: '👩🏻', grad: ['#FF5E8A', '#FF9F45'] }

  return (
    <View style={styles.root}>
      <View style={styles.avs}>
        <LinearGradient colors={[colors.p2, colors.p4]} style={styles.av}><Text style={{ fontSize: 50 }}>🧑🏻</Text></LinearGradient>
        <LinearGradient colors={peer.grad} style={[styles.av, { marginLeft: -30 }]}><Text style={{ fontSize: 50 }}>{peer.emoji}</Text></LinearGradient>
      </View>
      <Text style={styles.title}>It's a Match!</Text>
      <Text style={styles.sub}>You and {peer.name} liked each other</Text>

      <View style={styles.actions}>
        <Pressable onPress={() => { navigation.goBack(); navigation.navigate('Chat', { peer }) }}>
          <LinearGradient colors={[colors.p1, colors.p2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
            <Text style={styles.primaryT}>Say hi 💬</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryT}>Keep swiping</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(9,6,14,0.9)', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 30 },
  avs: { flexDirection: 'row' },
  av: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  title: { fontFamily: 'Fraunces', fontSize: 44, fontWeight: '700', color: colors.p1 },
  sub: { color: '#e9dcf0', fontSize: 16 },
  actions: { width: 280, gap: 12, marginTop: 6 },
  primary: { paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
  primaryT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: { paddingVertical: 14, borderRadius: 100, alignItems: 'center', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd },
  secondaryT: { color: colors.ink, fontWeight: '700', fontSize: 15 },
})
