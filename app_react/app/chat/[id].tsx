import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, chatApi, type ChatMessage, type ChatUpload } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import EmojiPicker from "../components/chat/EmojiPicker";
import MessageBubble from "../components/chat/MessageBubble";
import { formatDuration, useVoiceRecorder } from "../components/chat/useVoiceRecorder";

/** Merge a message into the list by id, replacing any optimistic twin. */
function upsert(list: ChatMessage[], next: ChatMessage, replaceId?: string) {
  const without = list.filter((m) => m.id !== next.id && m.id !== replaceId);
  const at = replaceId ? list.findIndex((m) => m.id === replaceId) : -1;
  if (at === -1) return [...without, next];
  const copy = [...without];
  copy.splice(Math.min(at, copy.length), 0, next);
  return copy;
}

export default function ChatScreen() {
  const router = useRouter();
  const { authToken, user } = useRegistration();
  const params = useLocalSearchParams<{ id: string; name?: string; photo?: string }>();
  const otherId = String(params.id);
  const myId = String(user?.id ?? "");
  const [inputHeight, setInputHeight] = useState(70);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  // Where the caret is, so emojis land where you're typing instead of at the end.
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  // Only set right after an insert. Keeping `selection` controlled permanently
  // makes the Android caret jump while typing, so we hand control straight back.
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | null>(
    null,
  );
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimer = useRef<any>(null);
  const voice = useVoiceRecorder();

  // Load history + the friend's current online state.
  useEffect(() => {
    if (!authToken || !otherId) return;
    api
      .history(otherId, authToken)
      .then(setMessages)
      .catch(() => { })
      .finally(() => setLoading(false));
    chatApi
      .presence(otherId, authToken)
      .then((p) => setOnline(!!p.online))
      .catch(() => { });
  }, [authToken, otherId]);

  // Live updates.
  useEffect(() => {
    if (!authToken) return;
    const socket = getSocket(authToken);
    socket.emit("chat_read", { withUser: otherId });
    socket.emit("presence_query", { userIds: [otherId] });

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
    // They came online — every single tick in this thread becomes a double tick.
    const onDelivered = ({ by, messageIds }: any) => {
      if (by !== otherId) return;
      const ids = new Set<string>(messageIds ?? []);
      setMessages((prev) =>
        prev.map((m) => (ids.has(m.id) ? { ...m, delivered: true } : m)),
      );
    };
    // They opened the thread — double ticks turn blue.
    const onRead = ({ by, messageIds }: any) => {
      if (by !== otherId) return;
      const ids: string[] | undefined = messageIds;
      setMessages((prev) =>
        prev.map((m) =>
          m.from === myId && (!ids || ids.includes(m.id))
            ? { ...m, delivered: true, read: true }
            : m,
        ),
      );
    };

    // Either side deleted a message — drop the bubble everywhere.
    const onDeleted = ({ id }: any) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    socket.on("chat_new", onNew);
    socket.on("chat_deleted", onDeleted);
    socket.on("chat_typing", onTyping);
    socket.on("presence", onPresence);
    socket.on("chat_delivered", onDelivered);
    socket.on("chat_read", onRead);
    return () => {
      socket.off("chat_new", onNew);
      socket.off("chat_deleted", onDeleted);
      socket.off("chat_typing", onTyping);
      socket.off("presence", onPresence);
      socket.off("chat_delivered", onDelivered);
      socket.off("chat_read", onRead);
    };
  }, [authToken, otherId, myId]);

  const send = () => {
    const body = text.trim();
    if (!body || !authToken) return;
    getSocket(authToken).emit("chat_send", { to: otherId, text: body, type: "text" });
    setText("");
    setSelection({ start: 0, end: 0 });
    setShowEmoji(false);
  };

  /**
   * Long-pressing your own bubble offers to delete it. The message is removed
   * for both participants, and any uploaded media is deleted server-side too.
   */
  const confirmDelete = useCallback(
    (message: ChatMessage) => {
      if (message.from !== myId || !authToken) return;

      // Never reached the server — just drop the failed bubble locally.
      if (message.pending || message.failed || message.id.startsWith("tmp-")) {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        return;
      }

      Alert.alert("Delete message", "This removes it for both of you.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const snapshot = messages;
            setMessages((prev) => prev.filter((m) => m.id !== message.id));
            try {
              await chatApi.deleteMessage(message.id, authToken);
            } catch (e: any) {
              setMessages(snapshot); // put it back — the server said no
              Alert.alert("Could not delete", e?.message ?? "Please try again.");
            }
          },
        },
      ]);
    },
    [authToken, messages, myId],
  );

  /**
   * Splice the emoji into the caret position (replacing any selected text) and
   * park the caret just after it, so you can keep typing mid-sentence.
   */
  const insertEmoji = (emoji: string) => {
    const start = Math.min(selection.start, text.length);
    const end = Math.min(Math.max(selection.end, start), text.length);
    const next = text.slice(0, start) + emoji + text.slice(end);
    const caret = start + emoji.length;
    setText(next);
    setSelection({ start: caret, end: caret });
    setForcedSelection({ start: caret, end: caret });
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

  /**
   * Upload an attachment as multipart/form-data. An optimistic bubble shows a
   * clock tick straight away and is swapped for the server's message on success.
   */
  const sendAttachment = useCallback(
    async (
      file: ChatUpload,
      type: ChatMessage["type"],
      extra?: { duration?: number; width?: number; height?: number },
      caption?: string,
    ) => {
      if (!authToken) return;
      const tempId = `tmp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        from: myId,
        to: otherId,
        text: caption ?? "",
        type,
        attachment: {
          url: file.uri,
          name: file.name ?? "",
          mime: file.mime ?? "",
          size: 0,
          duration: extra?.duration ?? 0,
          width: extra?.width ?? 0,
          height: extra?.height ?? 0,
        },
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const saved = await chatApi.sendMedia(otherId, file, authToken, caption);
        setMessages((prev) => upsert(prev, saved, tempId));
      } catch (e: any) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
        );
        Alert.alert("Upload failed", e?.message ?? "Could not send the attachment.");
      }
    },
    [authToken, myId, otherId],
  );

  const pickMedia = async (source: "library" | "camera", kind: "images" | "videos") => {
    setShowAttach(false);
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: [kind],
      quality: kind === "images" ? 0.85 : undefined,
      videoMaxDuration: 60,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fallback = kind === "images" ? "photo.jpg" : "video.mp4";
    await sendAttachment(
      {
        uri: asset.uri,
        name: asset.fileName || asset.uri.split("/").pop() || fallback,
        mime: asset.mimeType,
      },
      kind === "images" ? "image" : "video",
      {
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? Math.round(asset.duration / 1000) : 0,
      },
    );
  };

  const stopAndSendVoice = async () => {
    const clip = await voice.stop();
    if (!clip) return;
    await sendAttachment(
      { uri: clip.uri, name: clip.name, mime: clip.mime },
      "audio",
      { duration: clip.duration },
    );
  };

  const startVoice = async () => {
    const ok = await voice.start();
    if (!ok && voice.error) Alert.alert("Voice message", voice.error);
  };

  const hasText = !!text.trim();

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
    });
  }, [messages]);


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
            <View style={styles.statusRow}>
              {!typing && <View style={[styles.dot, online ? styles.dotOn : styles.dotOff]} />}
              <Text style={styles.headerStatus}>
                {typing ? "typing…" : online ? "online" : "offline"}
              </Text>
            </View>
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
        style={{ flex: 1, marginBottom: 0 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            keyboardDismissMode="interactive"
            ref={listRef}
            data={messages}
            // keyboardDismissMode="on-drag"
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                mine={item.from === myId}
                onOpenImage={setViewerUrl}
                // Only the sender can delete, so only they get the long-press menu.
                onLongPress={item.from === myId ? confirmDelete : undefined}
              />
            )}
            // contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: inputHeight + 10,
            }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>Say hi 👋 — you&apos;re now connected!</Text>
            }
          />
        )}

        {/* Attachment menu */}
        {showAttach && (
          <View style={styles.attachSheet}>
            <AttachOption icon="image" label="Photo" onPress={() => pickMedia("library", "images")} />
            <AttachOption icon="film" label="Video" onPress={() => pickMedia("library", "videos")} />
            <AttachOption icon="camera" label="Camera" onPress={() => pickMedia("camera", "images")} />
            <AttachOption
              icon="video"
              label="Record"
              onPress={() => pickMedia("camera", "videos")}
            />
          </View>
        )}

        {voice.recording ? (
          <View style={styles.recordBar}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>Recording {formatDuration(voice.seconds)}</Text>
            <Pressable onPress={voice.cancel} hitSlop={8} style={styles.recCancel}>
              <Feather name="trash-2" size={18} color={Colors.error} />
            </Pressable>
            <Pressable onPress={stopAndSendVoice} style={styles.sendBtn}>
              <Feather name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputBar} onLayout={(e) => {
            setInputHeight(e.nativeEvent.layout.height);
          }}>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setShowAttach((v) => !v);
                setShowEmoji(false);
              }}
            >
              <Feather name="paperclip" size={22} color={Colors.gray} />
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setShowEmoji((v) => !v);
                setShowAttach(false);
              }}
            >
              <Feather name="smile" size={22} color={showEmoji ? Colors.primary : Colors.gray} />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Message…"
              placeholderTextColor={Colors.gray}
              value={text}
              onChangeText={onType}
              selection={forcedSelection ?? undefined}
              onSelectionChange={(e) => {
                setSelection(e.nativeEvent.selection);
                if (forcedSelection) setForcedSelection(null);
              }}
              onFocus={() => setShowEmoji(false)}
              multiline
            />
            <Pressable
              style={styles.sendBtn}
              onPress={hasText ? send : startVoice}
              onLongPress={hasText ? undefined : startVoice}
            >
              <Feather name={hasText ? "send" : "mic"} size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        {showEmoji && !voice.recording && <EmojiPicker onPick={insertEmoji} />}
      </KeyboardAvoidingView>

      {/* Full-screen photo viewer */}
      <Modal visible={!!viewerUrl} transparent animationType="fade">
        <Pressable style={styles.viewer} onPress={() => setViewerUrl(null)}>
          {!!viewerUrl && (
            <Image source={{ uri: viewerUrl }} style={styles.viewerImage} resizeMode="contain" />
          )}
          <View style={styles.viewerClose}>
            <Feather name="x" size={26} color="#fff" />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function AttachOption({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.attachOption} onPress={onPress}>
      <View style={styles.attachIcon}>
        <Feather name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.attachLabel}>{label}</Text>
    </Pressable>
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
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOn: { backgroundColor: Colors.success },
  dotOff: { backgroundColor: Colors.lightGray },
  headerStatus: { fontSize: 12, color: Colors.gray },

  empty: { textAlign: "center", color: Colors.gray, marginTop: 40 },

  attachSheet: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fafafb",
  },
  attachOption: { alignItems: "center", gap: 6 },
  attachIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.lightPrimary,
    alignItems: "center", justifyContent: "center",
  },
  attachLabel: { fontSize: 12, color: Colors.darkGray },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff",
  },
  // input: {
  //   flex: 1, maxHeight: 110, backgroundColor: "#f5f5f7", borderRadius: 22,
  //   paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: Colors.text,
  // },
  input: {
  flex: 1,
  maxHeight: 110,
  backgroundColor: "#f5f5f7",
  borderRadius: 22,
  paddingHorizontal: 16,
  paddingVertical: 10,
  fontSize: 15,
  color: Colors.text,
  textAlignVertical: "center", // Android
},
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },

  recordBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff",
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  recText: { flex: 1, fontSize: 14, color: Colors.text },
  recCancel: { padding: 8 },

  viewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerImage: { width: "100%", height: "80%" },
  viewerClose: { position: "absolute", top: 50, right: 24 },
});
