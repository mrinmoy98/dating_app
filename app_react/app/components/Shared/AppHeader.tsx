import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRegistration } from "../../../context/RegistrationContext";
import { api } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";

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
}

/**
 * Instagram-style app header: "+" (upload a reel) on the left, the screen title
 * in the middle, and a heart notification button with an unread badge on the
 * right. Shared by every main tab so the actions are always in the same place.
 */
export default function AppHeader({ title, dark, hideUpload, floating, rightExtra }: AppHeaderProps) {
  const router = useRouter();
  const { authToken } = useRegistration();
  const [unread, setUnread] = useState(0);
  const [uploading, setUploading] = useState(false);

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

  /** Pick a video from the gallery and upload it as a reel. */
  const uploadReel = async () => {
    if (!authToken) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    try {
      setUploading(true);
      const url = await api.uploadVideo(result.assets[0].uri, authToken);
      if (url) Alert.alert("Reel uploaded ✅", "Your reel will appear in the feed shortly.");
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
        <Pressable style={styles.btn} onPress={uploadReel} disabled={uploading} hitSlop={8}>
          {uploading ? (
            <ActivityIndicator size="small" color={tint} />
          ) : (
            <Feather name="plus-square" size={25} color={tint} />
          )}
        </Pressable>
      )}

      <Text style={[styles.title, { color: tint }]}>{title}</Text>

      {/* Right — optional extra action, then notifications */}
      <View style={styles.rightGroup}>
        {rightExtra}
        <Pressable
          style={styles.btn}
          hitSlop={8}
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
        </Pressable>
      </View>
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
});
