import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Backdrop from '../components/Backdrop'
import { matchesList } from '../data/mock'
import { colors } from '../theme'

export default function MatchesScreen({ navigation }) {
  const openChat = (m) => navigation.navigate('Chat', { peer: m })

  return (
    <Backdrop>
      <View style={styles.head}><Text style={styles.title}>Matches</Text></View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <Text style={styles.subhead}>New matches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
          {matchesList.map((m) => (
            <Pressable key={m.id} style={styles.railItem} onPress={() => openChat(m)}>
              <LinearGradient colors={m.grad} style={styles.railAv}><Text style={{ fontSize: 30 }}>{m.emoji}</Text></LinearGradient>
              <Text style={styles.railName}>{m.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.subhead}>Messages</Text>
        {matchesList.map((m) => (
          <Pressable key={m.id} style={styles.row} onPress={() => openChat(m)}>
            <LinearGradient colors={m.grad} style={styles.rowAv}><Text style={{ fontSize: 24 }}>{m.emoji}</Text></LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{m.name}</Text>
              <Text style={styles.rowLast}>{m.last}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.time}>{m.time}</Text>
              {(m.unread || m.online) && <View style={styles.dot} />}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Backdrop>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 10 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '600', color: colors.ink },
  subhead: { color: colors.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12, marginTop: 6 },
  railItem: { alignItems: 'center', marginRight: 14 },
  railAv: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.p1 },
  railName: { color: colors.muted, fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, paddingHorizontal: 6 },
  rowAv: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rowName: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  rowLast: { color: colors.muted, fontSize: 13, marginTop: 2 },
  time: { color: colors.muted, fontSize: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.p4, marginTop: 6 },
})
