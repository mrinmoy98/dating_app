import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Backdrop from '../components/Backdrop'
import { me } from '../data/mock'
import { colors } from '../theme'

export default function ProfileScreen() {
  const [interestedIn, setInterestedIn] = useState('Everyone')

  return (
    <Backdrop>
      <View style={styles.head}><Text style={styles.title}>Profile</Text></View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <View style={styles.top}>
          <LinearGradient colors={me.grad} style={styles.big}><Text style={{ fontSize: 60 }}>{me.emoji}</Text></LinearGradient>
          <Text style={styles.nameBig}>{me.name}, {me.age}</Text>
          <Pressable style={styles.editBtn}><Text style={styles.editT}>✎ Edit profile</Text></Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h4}>Photos</Text>
          <View style={styles.gallery}>
            {me.photos.map((p, i) => (
              <LinearGradient key={i} colors={[me.grad[i % 2], me.grad[(i + 1) % 2]]} style={styles.gItem}>
                <Text style={{ fontSize: 40 }}>{p}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h4}>About</Text>
          <Text style={styles.about}>{me.bio}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h4}>Interests</Text>
          <View style={styles.seg}>
            {me.interests.map((i) => (
              <View key={i} style={styles.chip}><Text style={styles.chipT}>{i}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h4}>I'm interested in</Text>
          <View style={styles.seg}>
            {['Man', 'Woman', 'Everyone'].map((g) => {
              const on = interestedIn === g
              return (
                <Pressable key={g} onPress={() => setInterestedIn(g)}>
                  {on
                    ? <LinearGradient colors={[colors.p1, colors.p2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.segBtn}><Text style={styles.segTOn}>{g}</Text></LinearGradient>
                    : <View style={styles.segBtnOff}><Text style={styles.segT}>{g}</Text></View>}
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.h4}>Preferences</Text>
          <View style={styles.pref}><Text style={styles.prefL}>Age range</Text><Text style={styles.prefR}>{me.prefs.ageRange}</Text></View>
          <View style={styles.pref}><Text style={styles.prefL}>Maximum distance</Text><Text style={styles.prefR}>{me.prefs.distance}</Text></View>
        </View>

        <Pressable style={styles.logout}><Text style={{ color: colors.danger, fontWeight: '700' }}>Log out</Text></Pressable>
      </ScrollView>
    </Backdrop>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 6 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '600', color: colors.ink },
  top: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  big: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.glassBrd },
  nameBig: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  editBtn: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, paddingHorizontal: 22, paddingVertical: 9, borderRadius: 100 },
  editT: { color: colors.ink, fontWeight: '700' },
  panel: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBrd, borderRadius: 20, padding: 18, marginBottom: 14 },
  h4: { color: colors.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700', marginBottom: 10 },
  gallery: { flexDirection: 'row', gap: 10 },
  gItem: { flex: 1, aspectRatio: 3 / 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  about: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: colors.glassBrd, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipT: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  segBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  segBtnOff: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.glassBrd },
  segT: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  segTOn: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pref: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  prefL: { color: colors.ink, fontSize: 14 },
  prefR: { color: colors.p3, fontSize: 14, fontWeight: '600' },
  logout: { alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBrd },
})
