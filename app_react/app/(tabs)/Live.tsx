import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
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
import { api, type ConnectionUser } from "../../lib/api";
import { getSocket } from "../../lib/socket";

type Tab = "friends" | "new" | "interest";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "friends", label: "Friends", icon: "users" },
  { key: "new", label: "New", icon: "user-plus" },
  { key: "interest", label: "Interests", icon: "heart" },
];

export default function Live() {
  const router = useRouter();
  const { authToken } = useRegistration();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<ConnectionUser[]>([]);
  const [newUsers, setNewUsers] = useState<ConnectionUser[]>([]);
  const [interest, setInterest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!authToken) return;
    setLoading(true);
    Promise.all([
      api.friends(authToken).catch(() => []),
      api.newUsers(authToken).catch(() => []),
      api.byInterest(authToken).catch(() => []),
    ])
      .then(([f, n, i]) => {
        setFriends(f || []);
        setNewUsers(n || []);
        setInterest(i || []);
      })
      .finally(() => setLoading(false));
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Live presence for friends.
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    const onPresence = ({ userId, online }: any) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        online ? next.add(userId) : next.delete(userId);
        return next;
      });
    };
    socket.on("presence", onPresence);
    return () => {
      socket.off("presence", onPresence);
    };
  }, [authToken]);

  // Ring incoming calls from anywhere in the app.
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    const onRing = ({ callId, from }: any) => {
      router.push({
        pathname: "/call/[id]",
        params: {
          id: from?.id,
          name: from?.firstName ?? "Caller",
          photo: from?.photoUrl ?? "",
          callId,
          incoming: "1",
        },
      } as any);
    };
    socket.on("call_ring", onRing);
    return () => {
      socket.off("call_ring", onRing);
    };
  }, [authToken, router]);

  const follow = async (u: ConnectionUser) => {
    if (!authToken) return;
    setBusyId(u.id);
    try {
      await api.follow(u.id, authToken);
      load(); // they may now be a friend (if they already followed you)
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const openChat = (u: ConnectionUser) =>
    router.push({
      pathname: "/chat/[id]",
      params: { id: u.id, name: u.firstName ?? "", photo: u.photoUrl ?? "" },
    } as any);

  const startCall = (u: ConnectionUser) =>
    router.push({
      pathname: "/call/[id]",
      params: { id: u.id, name: u.firstName ?? "", photo: u.photoUrl ?? "" },
    } as any);

  const data: any[] = tab === "friends" ? friends : tab === "new" ? newUsers : interest;

  const renderItem = ({ item }: { item: any }) => {
    const isOnline = onlineIds.has(item.id);
    return (
      <Pressable style={styles.row} onPress={() => router.push(`/user/${item.id}` as any)}>
        <View>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(item.firstName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {tab === "friends" && isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {item.firstName} {item.lastName || ""}
            {item.age ? `, ${item.age}` : ""}
          </Text>
          {tab === "interest" && item.shared_interests?.length ? (
            <Text style={styles.sub} numberOfLines={1}>
              ❤️ {item.shared_interests.slice(0, 3).join(", ")}
            </Text>
          ) : (
            !!item.location && (
              <Text style={styles.sub} numberOfLines={1}>
                {item.location}
              </Text>
            )
          )}
        </View>

        {tab === "friends" ? (
          <View style={styles.actions}>
            <Pressable style={styles.iconBtn} onPress={() => openChat(item)}>
              <Feather name="message-circle" size={18} color={Colors.primary} />
            </Pressable>
            <Pressable style={[styles.iconBtn, styles.callBtn]} onPress={() => startCall(item)}>
              <Feather name="video" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.followBtn}
            onPress={() => follow(item)}
            disabled={busyId === item.id}
          >
            {busyId === item.id ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Feather name="user-plus" size={14} color={Colors.primary} />
                <Text style={styles.followText}>Follow</Text>
              </>
            )}
          </Pressable>
        )}
      </Pressable>
    );
  };

  const emptyText =
    tab === "friends"
      ? "No friends yet. Follow someone — when they follow you back, you can chat & video call."
      : tab === "new"
        ? "No new members right now."
        : "Add interests to your profile to find people who share them.";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <Text style={styles.subtitle}>Follow each other to unlock chat & video calls</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon} size={15} color={tab === t.key ? Colors.primary : Colors.gray} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
              {t.key === "friends" && friends.length ? ` (${friends.length})` : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.gray, marginTop: 4 },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { color: Colors.gray, fontWeight: "600", fontSize: 13.5 },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },

  row: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff",
    padding: 12, borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: "#f0f0f2",
  },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#eee" },
  avatarFallback: { backgroundColor: Colors.lightPrimary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: Colors.primary, fontWeight: "700", fontSize: 20 },
  onlineDot: {
    position: "absolute", right: 1, bottom: 1, width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#10b981", borderWidth: 2, borderColor: "#fff",
  },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text },
  sub: { fontSize: 13, color: Colors.darkGray, marginTop: 2 },

  actions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.lightPrimary,
  },
  callBtn: { backgroundColor: Colors.primary },
  followBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 7, minWidth: 86, justifyContent: "center",
  },
  followText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  empty: { textAlign: "center", color: Colors.gray, marginTop: 40, lineHeight: 20, paddingHorizontal: 20 },
});
