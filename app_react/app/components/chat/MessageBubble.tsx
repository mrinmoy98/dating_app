import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "../../../lib/api";
import AudioBubble from "./AudioBubble";
import MessageTicks from "./MessageTicks";
import { formatDuration } from "./useVoiceRecorder";

const MEDIA_WIDTH = 220;

function prettySize(bytes: number) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** One chat bubble, rendered according to the message's `type`. */
export default function MessageBubble({
  message,
  mine,
  onOpenImage,
  onLongPress,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpenImage: (url: string) => void;
  /** Opens the message actions sheet (delete). Only wired up for your own messages. */
  onLongPress?: (message: ChatMessage) => void;
}) {
  const a = message.attachment;
  const mediaOnly = !message.text && message.type !== "text";
  const longPress = onLongPress ? () => onLongPress(message) : undefined;

  const body = () => {
    switch (message.type) {
      case "image":
        return a ? (
          <Pressable onPress={() => onOpenImage(a.url)} onLongPress={longPress}>
            <Image
              source={{ uri: a.url }}
              style={[styles.media, aspect(a.width, a.height)]}
              resizeMode="cover"
            />
          </Pressable>
        ) : null;

      case "video":
        return a ? (
          <View>
            <Video
              source={{ uri: a.url }}
              style={[styles.media, aspect(a.width, a.height)]}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
            {a.duration > 0 && (
              <View style={styles.durationChip}>
                <Feather name="video" size={10} color="#fff" />
                <Text style={styles.durationText}>{formatDuration(a.duration)}</Text>
              </View>
            )}
          </View>
        ) : null;

      case "audio":
        return a ? <AudioBubble uri={a.url} duration={a.duration} mine={mine} /> : null;

      case "file":
        return a ? (
          <Pressable
            style={styles.fileRow}
            onPress={() => Linking.openURL(a.url)}
            onLongPress={longPress}
          >
            <View style={[styles.fileIcon, mine && styles.fileIconMine]}>
              <Feather name="file-text" size={18} color={mine ? "#fff" : Colors.primary} />
            </View>
            <View style={styles.fileMeta}>
              <Text numberOfLines={1} style={[styles.fileName, mine && styles.textMine]}>
                {a.name || "Attachment"}
              </Text>
              <Text style={[styles.fileSize, mine && styles.subTextMine]}>
                {prettySize(a.size)}
              </Text>
            </View>
          </Pressable>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        onLongPress={longPress}
        delayLongPress={350}
        style={({ pressed }) => [
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          mediaOnly && (message.type === "image" || message.type === "video") && styles.bubbleMedia,
          message.failed && styles.bubbleFailed,
          pressed && !!longPress && styles.bubblePressed,
        ]}
      >
        {body()}
        {!!message.text && (
          <Text
            style={[
              styles.text,
              mine && styles.textMine,
              message.type !== "text" && styles.caption,
            ]}
          >
            {message.text}
          </Text>
        )}
        <View style={[styles.footer, mediaOnly && styles.footerOverlay]}>
          <Text style={[styles.time, mine && styles.subTextMine, mediaOnly && styles.timeOverlay]}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {mine && (
            <MessageTicks
              pending={message.pending}
              failed={message.failed}
              delivered={message.delivered}
              read={message.read}
              color={mediaOnly ? "#fff" : "rgba(255,255,255,0.8)"}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

/** Keep the sender's aspect ratio when we know it; otherwise a sane 4:3. */
function aspect(width?: number, height?: number) {
  const ratio = width && height ? width / height : 4 / 3;
  return { width: MEDIA_WIDTH, height: MEDIA_WIDTH / Math.min(Math.max(ratio, 0.6), 1.8) };
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },

  bubble: { maxWidth: "82%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#f1f1f4", borderBottomLeftRadius: 4 },
  // Photos/videos fill the bubble edge to edge.
  bubbleMedia: { padding: 3 },
  bubbleFailed: { opacity: 0.6 },
  bubblePressed: { opacity: 0.75 },

  media: { borderRadius: 14, backgroundColor: "#00000010" },
  durationChip: {
    position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  durationText: { color: "#fff", fontSize: 10 },

  fileRow: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180, paddingVertical: 2 },
  fileIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.lightPrimary,
    alignItems: "center", justifyContent: "center",
  },
  fileIconMine: { backgroundColor: "rgba(255,255,255,0.22)" },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  fileSize: { fontSize: 11, color: Colors.gray, marginTop: 2 },

  text: { fontSize: 15, color: Colors.text, lineHeight: 20 },
  textMine: { color: "#fff" },
  caption: { marginTop: 6, paddingHorizontal: 3 },
  subTextMine: { color: "rgba(255,255,255,0.8)" },

  footer: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", gap: 5, marginTop: 3 },
  footerOverlay: {
    position: "absolute", right: 10, bottom: 10, marginTop: 0,
    backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  time: { fontSize: 10, color: Colors.gray },
  timeOverlay: { color: "#fff" },
});
