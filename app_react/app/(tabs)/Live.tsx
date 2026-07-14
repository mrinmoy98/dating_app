import Colors from "@/data/Colors";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const PREFS = ["Everyone", "Women", "Men"];

const ONLINE = [
  { name: "Ria", img: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg" },
  { name: "Sam", img: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
  { name: "Zoya", img: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg" },
  { name: "Ken", img: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg" },
  { name: "Neha", img: "https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg" },
  { name: "Dev", img: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg" },
];

type Phase = "idle" | "searching" | "incall";

export default function Live() {
  const [pref, setPref] = useState("Everyone");
  const [phase, setPhase] = useState<Phase>("idle");
  const [partner, setPartner] = useState(ONLINE[0]);
  const [muted, setMuted] = useState(false);
  const timer = useRef<any>(null);

  // Pulse animation for the hero button.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const startMatching = () => {
    setPhase("searching");
    timer.current = setTimeout(() => {
      const p = ONLINE[Math.floor(Math.random() * ONLINE.length)];
      setPartner(p);
      setPhase("incall");
    }, 2600);
  };
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("idle");
  };
  const next = () => {
    setMuted(false);
    setPhase("searching");
    timer.current = setTimeout(() => {
      const p = ONLINE[Math.floor(Math.random() * ONLINE.length)];
      setPartner(p);
      setPhase("incall");
    }, 1800);
  };
  const endCall = () => {
    if (timer.current) clearTimeout(timer.current);
    setMuted(false);
    setPhase("idle");
  };

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Hero */}
        <LinearGradient colors={[Colors.primary, "#b8007e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <Text style={styles.heroTitle}>Random Video Match</Text>
          <Text style={styles.heroSub}>Tap to instantly meet someone new on camera</Text>

          <Animated.View style={{ transform: [{ scale: pulse }], marginTop: 26 }}>
            <Pressable style={styles.startBtn} onPress={startMatching}>
              <Feather name="video" size={30} color={Colors.primary} />
            </Pressable>
          </Animated.View>
          <Text style={styles.startLabel}>Start Matching</Text>
        </LinearGradient>

        {/* Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I want to meet</Text>
          <View style={styles.chips}>
            {PREFS.map((p) => (
              <Pressable key={p} onPress={() => setPref(p)} style={[styles.chip, pref === p && styles.chipActive]}>
                <Text style={[styles.chipText, pref === p && styles.chipTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Online now */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Online now</Text>
            <Text style={styles.onlineCount}>● {ONLINE.length * 214} live</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6 }}>
            {ONLINE.map((u) => (
              <View key={u.name} style={styles.onlineItem}>
                <View>
                  <Image source={{ uri: u.img }} style={styles.onlineAvatar} />
                  <View style={styles.onlineGreen} />
                </View>
                <Text style={styles.onlineName}>{u.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Safety */}
        <View style={styles.safety}>
          <Feather name="shield" size={18} color={Colors.primary} />
          <Text style={styles.safetyText}>
            Be respectful. Calls are monitored for safety — you can skip or report anytime.
          </Text>
        </View>
      </ScrollView>

      {/* ===== Searching / In-call modal ===== */}
      <Modal visible={phase !== "idle"} animationType="slide" onRequestClose={cancel}>
        {phase === "searching" ? (
          <LinearGradient colors={["#1a0d1e", "#3a0d2e"]} style={styles.searching}>
            <View style={styles.radar}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
            <Text style={styles.searchTitle}>Finding someone…</Text>
            <Text style={styles.searchSub}>Matching you with a {pref === "Everyone" ? "person" : pref.toLowerCase()} online</Text>
            <Pressable style={styles.cancelBtn} onPress={cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </LinearGradient>
        ) : (
          <View style={styles.call}>
            {/* Remote (full screen) */}
            <Image source={{ uri: partner.img }} style={styles.remote} />
            <LinearGradient colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />

            {/* Top info */}
            <SafeAreaView edges={["top"]} style={styles.callTop}>
              <View style={styles.callName}>
                <View style={styles.liveDot} />
                <Text style={styles.callNameText}>{partner.name}</Text>
              </View>
              <Pressable style={styles.reportBtn}>
                <Feather name="flag" size={16} color="#fff" />
                <Text style={styles.reportText}>Report</Text>
              </Pressable>
            </SafeAreaView>

            {/* Self PIP */}
            <View style={styles.selfPip}>
              <Image source={{ uri: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg" }} style={styles.selfImg} />
              {muted && (
                <View style={styles.mutedTag}><Feather name="mic-off" size={12} color="#fff" /></View>
              )}
            </View>

            {/* Controls */}
            <SafeAreaView edges={["bottom"]} style={styles.controls}>
              <Pressable style={styles.ctrlBtn} onPress={() => setMuted((m) => !m)}>
                <Feather name={muted ? "mic-off" : "mic"} size={22} color="#fff" />
              </Pressable>
              <Pressable style={[styles.ctrlBtn, styles.endBtn]} onPress={endCall}>
                <Feather name="phone-off" size={26} color="#fff" />
              </Pressable>
              <Pressable style={styles.ctrlBtn}>
                <Feather name="refresh-cw" size={20} color="#fff" />
              </Pressable>
              <Pressable style={[styles.ctrlBtn, styles.nextBtn]} onPress={next}>
                <Feather name="skip-forward" size={22} color="#fff" />
              </Pressable>
            </SafeAreaView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  hero: { margin: 16, borderRadius: 24, padding: 26, alignItems: "center" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff5a5f" },
  liveBadgeText: { color: "#fff", fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 14 },
  heroSub: { color: "rgba(255,255,255,0.9)", fontSize: 13.5, textAlign: "center", marginTop: 6 },
  startBtn: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 8 },
  startLabel: { color: "#fff", fontWeight: "800", fontSize: 15, marginTop: 14 },

  section: { paddingHorizontal: 16, marginTop: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  onlineCount: { color: "#10b981", fontSize: 12, fontWeight: "700" },
  chips: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: "#e3e3e3", backgroundColor: "#fafafa" },
  chipActive: { backgroundColor: Colors.lightPrimary, borderColor: Colors.primary },
  chipText: { color: Colors.darkGray, fontWeight: "600" },
  chipTextActive: { color: Colors.primary, fontWeight: "700" },

  onlineItem: { alignItems: "center", gap: 6, width: 66 },
  onlineAvatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: Colors.primary },
  onlineGreen: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#10b981", borderWidth: 2, borderColor: "#fff" },
  onlineName: { fontSize: 12, color: Colors.text },

  safety: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: Colors.lightPrimary, marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 14 },
  safetyText: { flex: 1, color: Colors.text, fontSize: 12.5, lineHeight: 18 },

  /* searching */
  searching: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  radar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  searchTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 10 },
  searchSub: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  cancelBtn: { marginTop: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  cancelText: { color: "#fff", fontWeight: "700" },

  /* call */
  call: { flex: 1, backgroundColor: "#000" },
  remote: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", resizeMode: "cover" },
  callTop: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  callName: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 },
  callNameText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 },
  reportText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  selfPip: { position: "absolute", top: 90, right: 16, width: 100, height: 150, borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" },
  selfImg: { width: "100%", height: "100%" },
  mutedTag: { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.6)", padding: 4, borderRadius: 8 },
  controls: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18, paddingBottom: 16, paddingTop: 10 },
  ctrlBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  endBtn: { width: 66, height: 66, borderRadius: 33, backgroundColor: "#ef4444" },
  nextBtn: { backgroundColor: Colors.primary },
});
