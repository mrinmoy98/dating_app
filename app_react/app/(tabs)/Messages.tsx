import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type ChatConversation, type ConnectionUser } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import AppHeader from "../components/Shared/AppHeader";

type Tab = "messages" | "requests";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : `${Math.floor(d / 7)}w`;
}

const fullName = (u: { firstName?: string | null; lastName?: string | null }) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Someone";

export default function MessagesScreen() {
  const router = useRouter();
  const { authToken } = useRegistration();
  const [tab, setTab] = useState<Tab>("messages");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [requests, setRequests] = useState<ConnectionUser[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!authToken) return;
    setLoading(true);
    Promise.all([
      api.conversations(authToken).catch(() => []),
      api.followers(authToken).catch(() => []),
    ])
      .then(([c, f]) => {
        setConversations(c || []);
        // Message requests = people following you that you haven't followed back,
        // so chat is still locked until you follow them.
        setRequests((f || []).filter((u) => !u.is_following));
      })
      .finally(() => setLoading(false));
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Presence + live message refresh.
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    const onPresence = ({ userId, online }: any) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };
    const onNewMessage = () => load();
    socket.on("presence", onPresence);
    socket.on("chat_new", onNewMessage);
    return () => {
      socket.off("presence", onPresence);
      socket.off("chat_new", onNewMessage);
    };
  }, [authToken, load]);

  const followBack = async (u: ConnectionUser) => {
    if (!authToken) return;
    setBusyId(u.id);
    try {
      await api.follow(u.id, authToken);
      load(); // becomes a friend → moves into the chat list
    } finally {
      setBusyId(null);
    }
  };

  const openChat = (u: { id: string; firstName?: string | null; photoUrl?: string | null }) =>
    router.push({
      pathname: "/chat/[id]",
      params: { id: u.id, name: u.firstName ?? "", photo: u.photoUrl ?? "" },
    } as any);

  const startCall = (u: { id: string; firstName?: string | null; photoUrl?: string | null }) =>
    router.push({
      pathname: "/call/[id]",
      params: { id: u.id, name: u.firstName ?? "", photo: u.photoUrl ?? "" },
    } as any);

  const avatar = (u: any, size = 56) =>
    u.photoUrl ? (
      <Image
        source={{ uri: u.photoUrl }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    ) : (
      <View
        style={[
          styles.avatar,
          styles.avatarFallback,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={styles.avatarInitial}>{(u.firstName || "?").charAt(0).toUpperCase()}</Text>
      </View>
    );

  // Search filters whichever list is showing.
  const q = query.trim().toLowerCase();
  const shownConversations = useMemo(
    () => (q ? conversations.filter((c) => fullName(c.user).toLowerCase().includes(q)) : conversations),
    [conversations, q],
  );
  const shownRequests = useMemo(
    () => (q ? requests.filter((u) => fullName(u).toLowerCase().includes(q)) : requests),
    [requests, q],
  );

  /** People you can chat with who are online right now. */
  const activeNow = useMemo(
    () => conversations.map((c) => c.user).filter((u) => onlineIds.has(u.id)),
    [conversations, onlineIds],
  );

  // ---- Chat row ----
  const renderConversation = ({ item }: { item: ChatConversation }) => {
    const u = item.user;
    const isOnline = onlineIds.has(u.id);
    const unread = item.unread > 0;
    return (
      <Pressable style={styles.row} onPress={() => openChat(u)}>
        <View>
          {avatar(u)}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>
            {fullName(u)}
          </Text>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
            {item.lastMessage?.text ?? "Say hi 👋"}
            {item.lastMessage ? `  ·  ${timeAgo(item.lastMessage.created_at)}` : ""}
          </Text>
        </View>

        {unread ? (
          <View style={styles.unreadDot} />
        ) : (
          <Pressable style={styles.iconBtn} onPress={() => startCall(u)} hitSlop={6}>
            <Feather name="video" size={20} color={Colors.gray} />
          </Pressable>
        )}
      </Pressable>
    );
  };

  // ---- Request row ----
  const renderRequest = ({ item }: { item: ConnectionUser }) => (
    <Pressable style={styles.row} onPress={() => router.push(`/user/${item.id}` as any)}>
      {avatar(item)}
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {fullName(item)}
          {item.age ? `, ${item.age}` : ""}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          Follows you · follow back to unlock chat
        </Text>
      </View>
      <Pressable
        style={styles.followBtn}
        onPress={() => followBack(item)}
        disabled={busyId === item.id}
      >
        {busyId === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.followBtnText}>Follow back</Text>
        )}
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#fff" barStyle="dark-content" />
      <AppHeader title="Messages" />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={17} color={Colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={Colors.gray}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Feather name="x" size={16} color={Colors.gray} />
          </Pressable>
        )}
      </View>

      {/* Active now — tap an avatar to jump straight into the chat */}
      {activeNow.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeWrap}
          contentContainerStyle={styles.activeRow}
        >
          {activeNow.map((u) => (
            <Pressable key={u.id} style={styles.activeItem} onPress={() => openChat(u)}>
              <View>
                {avatar(u, 62)}
                <View style={styles.activeDot} />
              </View>
              <Text style={styles.activeName} numberOfLines={1}>
                {u.firstName ?? ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Messages | Requests */}
      <View style={styles.switchRow}>
        <Pressable onPress={() => setTab("messages")}>
          <Text style={[styles.switchText, tab === "messages" && styles.switchActive]}>Messages</Text>
        </Pressable>
        <Pressable onPress={() => setTab("requests")}>
          <Text style={[styles.switchText, tab === "requests" && styles.switchActive]}>
            Requests{requests.length ? ` (${requests.length})` : ""}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
      ) : tab === "messages" ? (
        <FlatList
          data={shownConversations}
          keyExtractor={(c) => c.user.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {q
                ? "No one matches that search."
                : "No chats yet. Follow someone — when they follow you back, you can chat & video call."}
            </Text>
          }
        />
      ) : (
        <FlatList
          data={shownRequests}
          keyExtractor={(u) => u.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No message requests right now.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // ---- search ----
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f2f2f4",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 0 },

  // ---- active now ----
  activeWrap: { flexGrow: 0 },
  activeRow: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  activeItem: { width: 74, alignItems: "center" },
  activeDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#10b981",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  activeName: { fontSize: 12, color: Colors.darkGray, marginTop: 5 },

  // ---- Messages | Requests ----
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  switchText: { fontSize: 15, fontWeight: "600", color: Colors.gray },
  switchActive: { color: Colors.text, fontWeight: "800" },

  listContent: { paddingHorizontal: 8, paddingBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  avatar: { backgroundColor: "#eee" },
  avatarFallback: { backgroundColor: Colors.lightPrimary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: Colors.primary, fontWeight: "700", fontSize: 20 },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10b981",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  name: { fontSize: 15, color: Colors.text },
  nameUnread: { fontWeight: "700" },
  preview: { fontSize: 13.5, color: Colors.gray, marginTop: 3 },
  previewUnread: { color: Colors.text, fontWeight: "600" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#3b82f6", marginRight: 10 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  followBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 104,
    alignItems: "center",
  },
  followBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { textAlign: "center", color: Colors.gray, marginTop: 40, lineHeight: 20, paddingHorizontal: 20 },
});
