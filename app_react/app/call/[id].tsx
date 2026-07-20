import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { getSocket } from "../../lib/socket";

/** How often we send a camera frame to the other side (ms). */
const FRAME_INTERVAL = 500;

type Phase = "ringing" | "incoming" | "connected" | "ended";

/**
 * Socket-based 1:1 video call (no WebRTC).
 * Each side captures a small JPEG from the camera a couple of times a second
 * and relays it through the server, so it runs inside Expo Go.
 */
export default function CallScreen() {
  const router = useRouter();
  const { authToken } = useRegistration();
  const params = useLocalSearchParams<{
    id: string; // the other user's id
    name?: string;
    photo?: string;
    callId?: string; // present when answering an incoming call
    incoming?: string;
  }>();

  const isIncoming = params.incoming === "1";
  const [phase, setPhase] = useState<Phase>(isIncoming ? "incoming" : "ringing");
  const [remoteFrame, setRemoteFrame] = useState<string | null>(null);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [status, setStatus] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const callIdRef = useRef<string | null>(params.callId ?? null);
  const timerRef = useRef<any>(null);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  // ---------- socket wiring ----------
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);

    const onRinging = ({ callId }: any) => {
      callIdRef.current = callId;
    };
    const onAccepted = ({ callId }: any) => {
      callIdRef.current = callId;
      setPhase("connected");
    };
    const onFrame = ({ data, muted: m }: any) => {
      setRemoteFrame(data);
      setRemoteMuted(!!m);
    };
    const onEnd = ({ reason }: any) => {
      setStatus(reason === "declined" ? "Call declined" : "Call ended");
      setPhase("ended");
      setTimeout(() => router.back(), 1200);
    };
    const onUnavailable = ({ reason }: any) => {
      setStatus(reason ?? "User unavailable");
      setPhase("ended");
      setTimeout(() => router.back(), 1500);
    };

    socket.on("call_ringing", onRinging);
    socket.on("call_accepted", onAccepted);
    socket.on("call_frame", onFrame);
    socket.on("call_end", onEnd);
    socket.on("call_unavailable", onUnavailable);
    socket.on("error_msg", ({ message }: any) => setStatus(message));

    // Outgoing call → invite immediately.
    if (!isIncoming && params.id) {
      socket.emit("call_invite", { to: params.id });
    }

    return () => {
      socket.off("call_ringing", onRinging);
      socket.off("call_accepted", onAccepted);
      socket.off("call_frame", onFrame);
      socket.off("call_end", onEnd);
      socket.off("call_unavailable", onUnavailable);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, params.id]);

  // ---------- frame streaming while connected ----------
  useEffect(() => {
    if (phase !== "connected" || !authToken) return;
    if (!permission?.granted) return;

    const socket = getSocket(authToken);
    timerRef.current = setInterval(async () => {
      try {
        const shot = await cameraRef.current?.takePictureAsync({
          quality: 0.3,
          base64: true,
          skipProcessing: true,
          shutterSound: false,
        });
        if (shot?.base64 && callIdRef.current) {
          socket.emit("call_frame", {
            callId: callIdRef.current,
            data: `data:image/jpeg;base64,${shot.base64}`,
            muted: mutedRef.current,
          });
        }
      } catch {
        /* skip this frame */
      }
    }, FRAME_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [phase, authToken, permission?.granted]);

  // Ask for the camera once.
  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted]);

  // ---------- actions ----------
  const accept = () => {
    if (!authToken || !callIdRef.current) return;
    getSocket(authToken).emit("call_accept", { callId: callIdRef.current });
    setPhase("connected");
  };

  const hangUp = () => {
    if (authToken && callIdRef.current) {
      const socket = getSocket(authToken);
      socket.emit(phase === "incoming" ? "call_reject" : "call_end", {
        callId: callIdRef.current,
      });
    }
    clearInterval(timerRef.current);
    router.back();
  };

  const name = params.name || "Stranger";

  if (permission && !permission.granted) {
    return (
      <View style={styles.center}>
        <Feather name="camera-off" size={40} color="#888" />
        <Text style={styles.permText}>Camera permission is needed for video calls.</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant permission</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Remote video = latest frame from the other side */}
      {phase === "connected" && remoteFrame ? (
        <Image source={{ uri: remoteFrame }} style={styles.remote} resizeMode="cover" />
      ) : (
        <View style={[styles.remote, styles.remoteIdle]}>
          {params.photo ? (
            <Image source={{ uri: params.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phaseText}>
            {status ??
              (phase === "incoming"
                ? "Incoming video call…"
                : phase === "ringing"
                  ? "Ringing…"
                  : "Connecting…")}
          </Text>
          {phase !== "ended" && <ActivityIndicator color="#fff" style={{ marginTop: 14 }} />}
        </View>
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.6)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <SafeAreaView edges={["top"]} style={styles.top}>
        <View style={styles.nameChip}>
          <View style={styles.liveDot} />
          <Text style={styles.nameChipText}>{name}</Text>
          {remoteMuted && <Feather name="mic-off" size={13} color="#fff" />}
        </View>
      </SafeAreaView>

      {/* Local camera preview (also the frame source) */}
      <View style={styles.selfPip}>
        <CameraView ref={cameraRef} style={styles.selfCam} facing={facing} animateShutter={false} />
        {muted && (
          <View style={styles.mutedTag}>
            <Feather name="mic-off" size={12} color="#fff" />
          </View>
        )}
      </View>

      {/* Controls */}
      <SafeAreaView edges={["bottom"]} style={styles.controls}>
        {phase === "incoming" ? (
          <>
            <Pressable style={[styles.ctrl, styles.endBtn]} onPress={hangUp}>
              <Feather name="phone-off" size={26} color="#fff" />
            </Pressable>
            <Pressable style={[styles.ctrl, styles.acceptBtn]} onPress={accept}>
              <Feather name="video" size={26} color="#fff" />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.ctrl} onPress={() => setMuted((m) => !m)}>
              <Feather name={muted ? "mic-off" : "mic"} size={22} color="#fff" />
            </Pressable>
            <Pressable style={[styles.ctrl, styles.endBtn]} onPress={hangUp}>
              <Feather name="phone-off" size={26} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.ctrl}
              onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
            </Pressable>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111", gap: 14, padding: 30 },
  permText: { color: "#ccc", textAlign: "center", fontSize: 15 },
  permBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  permBtnText: { color: "#fff", fontWeight: "700" },
  backLink: { color: "#888", marginTop: 8 },

  remote: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  remoteIdle: { alignItems: "center", justifyContent: "center", backgroundColor: "#151515" },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarFallback: { backgroundColor: Colors.lightPrimary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 46, fontWeight: "800", color: Colors.primary },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 16 },
  phaseText: { color: "#bbb", fontSize: 14, marginTop: 6 },

  top: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  nameChip: {
    flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18,
  },
  nameChipText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff5a5f" },

  selfPip: {
    position: "absolute", top: 90, right: 16, width: 100, height: 140,
    borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "#222",
  },
  selfCam: { width: "100%", height: "100%" },
  mutedTag: { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.6)", padding: 4, borderRadius: 8 },

  controls: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 22, paddingBottom: 20, paddingTop: 10,
  },
  ctrl: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  endBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#ef4444" },
  acceptBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#10b981" },
});
