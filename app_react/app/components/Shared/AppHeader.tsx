import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRegistration } from "../../../context/RegistrationContext";
import { api } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";
import PressableScale from "./PressableScale";

interface AppHeaderProps {
  /** Title shown in the middle. */
  title: string;
  /** Dark header (used on the black Reels screen). */
  dark?: boolean;
  /** Hide the left "+" (upload a reel) button. */
  hideUpload?: boolean;
  /** Transparent — floats over full-screen content like Reels. */
  floating?: boolean;
  /** Extra action rendered to the left of the notification heart (e.g. settings). */
  rightExtra?: React.ReactNode;
  /** Called after a reel is posted, so the caller can refresh its feed. */
  onUploaded?: () => void;
}

/**
 * Instagram-style app header: "+" (upload a reel) on the left, the screen title
 * in the middle, and a heart notification button with an unread badge on the
 * right. Shared by every main tab so the actions are always in the same place.
 */
export default function AppHeader({
  title,
  dark,
  hideUpload,
  floating,
  rightExtra,
  onUploaded,
}: AppHeaderProps) {
  const router = useRouter();
  const { authToken } = useRegistration();
  const [unread, setUnread] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const tint = dark ? "#fff" : Colors.text;

  // Unread badge — load once, then keep it live over the socket.
  useEffect(() => {
    if (!authToken) return;
    api
      .unreadCount(authToken)
      .then((r) => setUnread(r?.count ?? 0))
      .catch(() => {});

    const socket = getSocket(authToken);
    const onNew = () => setUnread((n) => n + 1);
    const onRead = () => setUnread(0);
    socket.on("notification", onNew);
    socket.on("notifications_read", onRead);
    return () => {
      socket.off("notification", onNew);
      socket.off("notifications_read", onRead);
    };
  }, [authToken]);

  /** Step 1 — pick a video from the gallery, then ask for a caption. */
  const pickReel = async () => {
    if (!authToken) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    setCaption("");
    setPendingVideo(result.assets[0].uri);
  };

  /** Step 2 — upload the file, then create the reel row. */
  const postReel = async () => {
    if (!authToken || !pendingVideo) return;
    try {
      setUploading(true);
      const url = await api.uploadVideo(pendingVideo, authToken, "reels");
      if (!url) throw new Error("Upload failed");
      await api.createReel({ video_url: url, caption: caption.trim() }, authToken);
      setPendingVideo(null);
      setCaption("");
      Alert.alert("Reel posted ✅", "It's live in the Reels feed and on your profile.");
      onUploaded?.();
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View
      style={[
        styles.header,
        dark && styles.headerDark,
        floating && styles.headerFloating,
      ]}
    >
      {/* Left — upload a reel */}
      {hideUpload ? (
        <View style={styles.btn} />
      ) : (
        <PressableScale style={styles.btn} ripple={null} onPress={pickReel} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={tint} />
          ) : (
            <Feather name="plus-square" size={25} color={tint} />
          )}
        </PressableScale>
      )}

      <Text style={[styles.title, { color: tint }]}>{title}</Text>

      {/* Right — optional extra action, then notifications */}
      <View style={styles.rightGroup}>
        {rightExtra}
        <PressableScale
          style={styles.btn}
          ripple={null}
          onPress={() => {
            setUnread(0);
            router.push("/(profile)/Notifications" as any);
          }}
        >
          <Feather name="heart" size={24} color={tint} />
          {unread > 0 && (
            <View style={[styles.badge, dark && styles.badgeDark]}>
              <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          )}
        </PressableScale>
      </View>

      {/* Caption sheet — shown after a video is picked */}
      <Modal visible={!!pendingVideo} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>New reel</Text>
              <Pressable onPress={() => setPendingVideo(null)} hitSlop={8} disabled={uploading}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.sheetPreview}>
              <Feather name="film" size={26} color={Colors.primary} />
              <Text style={styles.sheetPreviewText} numberOfLines={1}>
                {pendingVideo?.split("/").pop()}
              </Text>
            </View>

            <TextInput
              style={styles.sheetInput}
              placeholder="Write a caption…"
              placeholderTextColor={Colors.gray}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={300}
            />

            <Pressable style={styles.sheetBtn} onPress={postReel} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sheetBtnText}>Share reel</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  headerDark: { backgroundColor: "transparent" },
  headerFloating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
  },
  btn: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  rightGroup: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 19, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: 2,
    right: 4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeDark: { borderColor: "#000" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // ---- new-reel caption sheet ----
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
    gap: 14,
  },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: Colors.text },
  sheetPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
    padding: 14,
  },
  sheetPreviewText: { flex: 1, fontSize: 13, color: Colors.text },
  sheetInput: {
    borderWidth: 1,
    borderColor: "#e6e6ea",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: "top",
  },
  sheetBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
