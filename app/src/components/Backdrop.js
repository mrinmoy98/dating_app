import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme'

// Soft aurora blobs behind content (approximation of the web animated aurora).
export default function Backdrop({ children }) {
  return (
    <View style={styles.root}>
      <View style={[styles.blob, { backgroundColor: colors.p1, top: -90, left: -70, width: 300, height: 300 }]} />
      <View style={[styles.blob, { backgroundColor: colors.p2, top: 120, right: -90, width: 260, height: 260 }]} />
      <View style={[styles.blob, { backgroundColor: colors.p3, bottom: -80, left: 30, width: 240, height: 240 }]} />
      <View style={[styles.blob, { backgroundColor: colors.p4, bottom: 60, right: 20, width: 200, height: 200 }]} />
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 400, opacity: 0.35 },
  content: { flex: 1 },
})

export function Grad(props) {
  return <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} {...props} />
}
