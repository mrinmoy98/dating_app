import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type ChatMessage } from "../../lib/api";
import { getSocket } from "../../lib/socket";

export default function ChatScreen() {
  const router = useRouter();
  const { authToken, user } = useRegistration();
  const params = useLocalSearchParams<{ id: string; name?: string; photo?: string }>();
  const otherId = String(params.id);
  const myId = String(user?.id ?? "");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const listRef = useRef<FlatList>(null);
  const typingTimer = useRef<any>(null);

  // Load history.
  useEffect(() => {
    if (!authToken || !otherId) return;
    api
      .history(otherId, authToken)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authToken, otherId]);

  // Live updates.
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    socket.emit("chat_read", { withUser: otherId });

    const onNew = (m: ChatMessage) => {
      // Only messages belonging to this conversation.
      if (m.from !== otherId && m.to !== otherId) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.from === otherId) socket.emit("chat_read", { withUser: otherId });
    };
    const onTyping = ({ from, typing: t }: any) => {
      if (from === otherId) setTyping(!!t);
    };
    const onPresence = ({ userId, online: o }: any) => {
      if (userId === otherId) setOnline(!!o);
    };

    socket.on("chat_new", onNew);
    socket.on("chat_typing", onTyping);
    socket.on("presence", onPresence);
    return () => {
      socket.off("chat_new", onNew);
      socket.off("chat_typing", onTyping);
      socket.off("presence", onPresence);
    };
  }, [authToken, otherId]);

  const send = () => {
    const body = text.trim();
    if (!body || !authToken) return;
    getSocket(authToken).emit("chat_send", { to: otherId, text: body });
    setText("");
  };

  const onType = (t: string) => {
    setText(t);
    if (!authToken) return;
    const socket = getSocket(authToken);
    socket.emit("chat_typing", { to: otherId, typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket.emit("chat_typing", { to: otherId, typing: false }),
      1200,
    );
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.from === myId;
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
          <Text style={[styles.time, mine && styles.timeMine]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Pressable style={styles.headerUser} onPress={() => router.push(`/user/${otherId}` as any)}>
          {params.photo ? (
            <Image source={{ uri: String(params.photo) }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(params.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{params.name || "Chat"}</Text>
            <Text style={styles.headerStatus}>
              {typing ? "typing…" : online ? "online" : "offline"}
            </Text>
          </View>
        </Pressable>
        <Pressable
          hitSlop={10}
          onPress={() =>
            router.push({
              pathname: "/call/[id]",
              params: { id: otherId, name: params.name, photo: params.photo },
            } as any)
          }
        >
          <Feather name="video" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Text style={styles.empty}>Say hi 👋 — you're now connected!</Text>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={Colors.gray}
            value={text}
            onChangeText={onType}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Feather name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#eee" },
  avatarFallback: { backgroundColor: Colors.lightPrimary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: Colors.primary, fontWeight: "700" },
  headerName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  headerStatus: { fontSize: 12, color: Colors.gray },

  bubbleRow: { marginBottom: 10, flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#f1f1f4", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.text, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  time: { fontSize: 10, color: Colors.gray, marginTop: 4, alignSelf: "flex-end" },
  timeMine: { color: "rgba(255,255,255,0.75)" },
  empty: { textAlign: "center", color: Colors.gray, marginTop: 40 },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff",
  },
  input: {
    flex: 1, maxHeight: 110, backgroundColor: "#f5f5f7", borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: Colors.text,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.4 },
});
