import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { conversation } from '../data/mock'
import { colors } from '../theme'

export default function ChatScreen({ route, navigation }) {
  const peer = route.params?.peer ?? { name: 'Aisha', emoji: '👩🏻', grad: ['#FF5E8A', '#FF9F45'] }
  const [msgs, setMsgs] = useState(conversation)
  const [text, setText] = useState('')

  const send = () => {
    if (!text.trim()) return
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: text.trim() }])
    setText('')
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></Pressable>
        <LinearGradient colors={peer.grad} style={styles.av}><Text style={{ fontSize: 22 }}>{peer.emoji}</Text></LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{peer.name}</Text>
          <Text style={styles.status}>● Online</Text>
        </View>
        <Pressable style={styles.icn}><Text>📞</Text></Pressable>
        <Pressable style={styles.icn} onPress={() => navigation.navigate('Call', { peer })}><Text>📹</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 10 }}>
        {msgs.map((m) => (
          <View key={m.id} style={[styles.bub, m.from === 'me' ? styles.me : styles.them]}>
            {m.from === 'me'
              ? <LinearGradient colors={[colors.p1, colors.p2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.meBg} />
              : null}
            <Text style={styles.bubT}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.composer}>
          <View style={styles.icn}><Text>＋</Text></View>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
          />
          <Pressable style={styles.send} onPress={send}><Text style={{ fontSize: 17 }}>➤</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.glassBrd },
  back: { color: colors.ink, fontSize: 34, marginRight: 2 },
  av: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  status: { color: colors.p4, fontSize: 12, fontWeight: '600' },
  icn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, alignItems: 'center', justifyContent: 'center' },
  bub: { maxWidth: '76%', paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20, overflow: 'hidden' },
  them: { alignSelf: 'flex-start', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, borderBottomLeftRadius: 6 },
  me: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  meBg: { ...StyleSheet.absoluteFillObject },
  bubT: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 26, borderTopWidth: 1, borderTopColor: colors.glassBrd },
  input: { flex: 1, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, borderRadius: 100, paddingHorizontal: 18, paddingVertical: 11, color: colors.ink },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.p1, alignItems: 'center', justifyContent: 'center' },
})
