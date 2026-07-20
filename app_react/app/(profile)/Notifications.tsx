import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type AppNotification, type NotificationType } from "../../lib/api";
import { getSocket } from "../../lib/socket";

/** Icon + colour per notification type. */
const STYLE_BY_TYPE: Record<NotificationType, { icon: any; color: string }> = {
  follow: { icon: "user-plus", color: "#3b82f6" },
  follow_back: { icon: "users", color: "#10b981" },
  like: { icon: "heart", color: Colors.primary },
  match: { icon: "zap", color: "#f59e0b" },
  message: { icon: "message-circle", color: "#8b5cf6" },
  call: { icon: "video", color: "#ef4444" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { authToken } = useRegistration();
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!authToken) return;
    api
      .notifications(authToken)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authToken]);

  useEffect(() => {
    load();
    // Mark everything read once the screen is open.
    if (authToken) api.markAllRead(authToken).catch(() => {});
  }, [load, authToken]);

  // Live notifications while the screen is open.
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    const onNew = (n: AppNotification) => setRows((prev) => [n, ...prev]);
    socket.on("notification", onNew);
    return () => {
      socket.off("notification", onNew);
    };
  }, [authToken]);

  const remove = async (n: AppNotification) => {
    setRows((prev) => prev.filter((x) => x.id !== n.id));
    if (authToken) await api.deleteNotification(n.id, authToken).catch(() => {});
  };

  const open = (n: AppNotification) => {
    if (!n.from) return;
    // Messages go straight to the chat, everything else to the profile.
    if (n.type === "message") {
      router.push({
        pathname: "/chat/[id]",
        params: { id: n.from.id, name: n.from.firstName ?? "", photo: n.from.photoUrl ?? "" },
      } as any);
    } else {
      router.push(`/user/${n.from.id}` as any);
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const s = STYLE_BY_TYPE[item.type] ?? STYLE_BY_TYPE.follow;
    return (
      <Pressable style={[styles.row, !item.read && styles.rowUnread]} onPress={() => open(item)}>
        <View style={styles.avatarWrap}>
          {item.from?.photoUrl ? (
            <Image source={{ uri: item.from.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(item.from?.firstName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: s.color }]}>
            <Feather name={s.icon} size={11} color="#fff" />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.text}>{item.text}</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
        <Pressable hitSlop={8} onPress={() => remove(item)}>
          <Feather name="x" size={16} color={Colors.gray} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={[Colors.primary, "#b8007e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={38} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  rowUnread: { backgroundColor: "#fff5f9" },
  avatarWrap: { width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eee" },
  avatarFallback: {
    backgroundColor: Colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: Colors.primary, fontWeight: "700", fontSize: 18 },
  typeBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  text: { fontSize: 14, color: Colors.text, lineHeight: 19 },
  time: { fontSize: 12, color: Colors.gray, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: Colors.gray, fontSize: 15 },
});
