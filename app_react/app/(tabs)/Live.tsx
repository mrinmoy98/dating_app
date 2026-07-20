import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../../config";
import { useRegistration } from "../../context/RegistrationContext";

/**
 * react-native-webrtc is a NATIVE module — it does NOT exist inside Expo Go.
 * Loading it lazily lets the rest of the app run in Expo Go; real calls need a
 * development build:  npx expo run:android   (or eas build)
 */
let WebRTC: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebRTC = require("react-native-webrtc");
} catch {
  WebRTC = null;
}
const RTCView = WebRTC?.RTCView;

const PREFS = [
  { label: "Everyone", value: [] as string[] },
  { label: "Women", value: ["Female"] },
  { label: "Men", value: ["Male"] },
];

type Phase = "idle" | "searching" | "incall";
interface PartnerCard {
  id: string;
  firstName: string | null;
  photoUrl: string | null;
}

export default function Live() {
  const { authToken } = useRegistration();
  const [prefIdx, setPrefIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [partner, setPartner] = useState<PartnerCard | null>(null);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<any>(null);
  const localRef = useRef<any>(null);
  const roomRef = useRef<string | null>(null);
  const pendingIce = useRef<any[]>([]);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

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

  // ---------------- socket ----------------
  const getSocket = (): Socket => {
    if (socketRef.current?.connected || socketRef.current?.active) return socketRef.current;
    const socket = io(`${API_BASE_URL}/call`, {
      transports: ["websocket"],
      auth: { token: authToken },
    });
    socketRef.current = socket;

    socket.on("matched", async ({ roomId, initiator, partner: p }) => {
      roomRef.current = roomId;
      setPartner(p ?? null);
      setPhase("incall");
      await startCall(roomId, initiator);
    });

    socket.on("signal", async ({ data }) => {
      const pc = pcRef.current;
      if (!pc || !WebRTC) return;
      try {
        if (data.type === "offer") {
          await pc.setRemoteDescription(new WebRTC.RTCSessionDescription(data.sdp));
          await flushIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("signal", {
            roomId: roomRef.current,
            data: { type: "answer", sdp: answer },
          });
        } else if (data.type === "answer") {
          await pc.setRemoteDescription(new WebRTC.RTCSessionDescription(data.sdp));
          await flushIce();
        } else if (data.type === "candidate" && data.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new WebRTC.RTCIceCandidate(data.candidate));
          } else {
            pendingIce.current.push(data.candidate);
          }
        }
      } catch (e) {
        console.warn("signal error", e);
      }
    });

    socket.on("partner_left", () => {
      // Partner skipped / disconnected → automatically look for someone new.
      stopCall();
      if (phaseRef.current !== "idle") {
        setStatus("Partner left — finding someone new…");
        setPhase("searching");
        socket.emit("join_queue", { pref: PREFS[prefIdx].value });
      }
    });

    socket.on("connect_error", () => setStatus("Could not reach the call server."));
    return socket;
  };

  const flushIce = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const pending = pendingIce.current.splice(0);
    for (const c of pending) {
      try {
        await pc.addIceCandidate(new WebRTC.RTCIceCandidate(c));
      } catch {}
    }
  };

  // ---------------- WebRTC ----------------
  const startCall = async (roomId: string, initiator: boolean) => {
    if (!WebRTC) return;
    try {
      const stream = await WebRTC.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      localRef.current = stream;
      setLocalStream(stream);

      const pc = new WebRTC.RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));

      pc.ontrack = (e: any) => {
        if (e.streams?.[0]) setRemoteStream(e.streams[0]);
      };
      pc.onicecandidate = (e: any) => {
        if (e.candidate) {
          socketRef.current?.emit("signal", {
            roomId,
            data: { type: "candidate", candidate: e.candidate },
          });
        }
      };

      if (initiator) {
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("signal", { roomId, data: { type: "offer", sdp: offer } });
      }
    } catch (e: any) {
      setStatus(e?.message ?? "Could not access camera/microphone.");
      endCall();
    }
  };

  /** Close the peer connection and release camera/mic. */
  const stopCall = () => {
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    try {
      localRef.current?.getTracks?.().forEach((t: any) => t.stop());
    } catch {}
    localRef.current = null;
    roomRef.current = null;
    pendingIce.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setPartner(null);
  };

  // ---------------- user actions ----------------
  const startMatching = () => {
    if (!authToken) {
      setStatus("Please log in first.");
      return;
    }
    if (!WebRTC) {
      setStatus(
        "Video calling needs a development build (react-native-webrtc doesn't run in Expo Go). Run: npx expo run:android",
      );
      return;
    }
    setStatus(null);
    setPhase("searching");
    getSocket().emit("join_queue", { pref: PREFS[prefIdx].value });
  };

  const next = () => {
    stopCall();
    setPhase("searching");
    getSocket().emit("join_queue", { pref: PREFS[prefIdx].value });
  };

  const endCall = () => {
    socketRef.current?.emit("leave");
    stopCall();
    setPhase("idle");
  };

  const toggleMute = () => {
    const stream = localRef.current;
    if (!stream) return;
    const nextMuted = !muted;
    stream.getAudioTracks().forEach((t: any) => (t.enabled = !nextMuted));
    setMuted(nextMuted);
  };

  const switchCamera = () => {
    localRef.current?.getVideoTracks?.().forEach((t: any) => t._switchCamera?.());
  };

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      socketRef.current?.emit("leave");
      socketRef.current?.disconnect();
      stopCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- UI ----------------
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
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

        {!WebRTC && (
          <View style={styles.devBuildNote}>
            <Feather name="alert-triangle" size={16} color="#b45309" />
            <Text style={styles.devBuildText}>
              Real video calls need a development build — run{" "}
              <Text style={{ fontWeight: "800" }}>npx expo run:android</Text>. (Expo Go can't load
              react-native-webrtc.)
            </Text>
          </View>
        )}

        {!!status && phase === "idle" && <Text style={styles.statusText}>{status}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I want to meet</Text>
          <View style={styles.chips}>
            {PREFS.map((p, i) => (
              <Pressable key={p.label} onPress={() => setPrefIdx(i)} style={[styles.chip, prefIdx === i && styles.chipActive]}>
                <Text style={[styles.chipText, prefIdx === i && styles.chipTextActive]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.safety}>
          <Feather name="shield" size={18} color={Colors.primary} />
          <Text style={styles.safetyText}>
            Be respectful. You can skip or end a call anytime — report anyone who misbehaves.
          </Text>
        </View>
      </ScrollView>

      {/* ===== Searching / In-call ===== */}
      <Modal visible={phase !== "idle"} animationType="slide" onRequestClose={endCall}>
        {phase === "searching" ? (
          <LinearGradient colors={["#1a0d1e", "#3a0d2e"]} style={styles.searching}>
            <View style={styles.radar}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
            <Text style={styles.searchTitle}>Finding someone…</Text>
            <Text style={styles.searchSub}>
              {status ?? `Matching you with ${PREFS[prefIdx].label.toLowerCase()} online`}
            </Text>
            <Pressable style={styles.cancelBtn} onPress={endCall}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </LinearGradient>
        ) : (
          <View style={styles.call}>
            {/* Remote video (full screen) */}
            {remoteStream && RTCView ? (
              <RTCView streamURL={remoteStream.toURL()} style={styles.remote} objectFit="cover" />
            ) : (
              <View style={[styles.remote, styles.remoteWaiting]}>
                {partner?.photoUrl ? (
                  <Image source={{ uri: partner.photoUrl }} style={styles.partnerAvatar} />
                ) : (
                  <Feather name="user" size={60} color="#666" />
                )}
                <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
                <Text style={styles.connectingText}>Connecting video…</Text>
              </View>
            )}
            <LinearGradient colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />

            {/* Top bar */}
            <SafeAreaView edges={["top"]} style={styles.callTop}>
              <View style={styles.callName}>
                <View style={styles.liveDot} />
                <Text style={styles.callNameText}>{partner?.firstName ?? "Stranger"}</Text>
              </View>
            </SafeAreaView>

            {/* Self preview */}
            {localStream && RTCView && (
              <View style={styles.selfPip}>
                <RTCView streamURL={localStream.toURL()} style={styles.selfVideo} objectFit="cover" mirror />
                {muted && (
                  <View style={styles.mutedTag}>
                    <Feather name="mic-off" size={12} color="#fff" />
                  </View>
                )}
              </View>
            )}

            {/* Controls */}
            <SafeAreaView edges={["bottom"]} style={styles.controls}>
              <Pressable style={styles.ctrlBtn} onPress={toggleMute}>
                <Feather name={muted ? "mic-off" : "mic"} size={22} color="#fff" />
              </Pressable>
              <Pressable style={[styles.ctrlBtn, styles.endBtn]} onPress={endCall}>
                <Feather name="phone-off" size={26} color="#fff" />
              </Pressable>
              <Pressable style={styles.ctrlBtn} onPress={switchCamera}>
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

  devBuildNote: {
    flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#fef3c7",
    marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 4,
  },
  devBuildText: { flex: 1, color: "#92400e", fontSize: 12.5, lineHeight: 18 },
  statusText: { color: "#ef4444", fontSize: 13, textAlign: "center", marginHorizontal: 24, marginTop: 8 },

  section: { paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  chips: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: "#e3e3e3", backgroundColor: "#fafafa" },
  chipActive: { backgroundColor: Colors.lightPrimary, borderColor: Colors.primary },
  chipText: { color: Colors.darkGray, fontWeight: "600" },
  chipTextActive: { color: Colors.primary, fontWeight: "700" },

  safety: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: Colors.lightPrimary, marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 14 },
  safetyText: { flex: 1, color: Colors.text, fontSize: 12.5, lineHeight: 18 },

  /* searching */
  searching: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  radar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  searchTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 10 },
  searchSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", paddingHorizontal: 30 },
  cancelBtn: { marginTop: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  cancelText: { color: "#fff", fontWeight: "700" },

  /* call */
  call: { flex: 1, backgroundColor: "#000" },
  remote: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  remoteWaiting: { alignItems: "center", justifyContent: "center", backgroundColor: "#151515" },
  partnerAvatar: { width: 110, height: 110, borderRadius: 55 },
  connectingText: { color: "#bbb", marginTop: 10, fontSize: 14 },
  callTop: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  callName: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 },
  callNameText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  selfPip: { position: "absolute", top: 90, right: 16, width: 100, height: 150, borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "#222" },
  selfVideo: { width: "100%", height: "100%" },
  mutedTag: { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.6)", padding: 4, borderRadius: 8 },
  controls: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18, paddingBottom: 16, paddingTop: 10 },
  ctrlBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  endBtn: { width: 66, height: 66, borderRadius: 33, backgroundColor: "#ef4444" },
  nextBtn: { backgroundColor: Colors.primary },
});
