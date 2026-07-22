import Colors from "@/data/Colors";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Reel } from "../../../lib/api";

interface ReelShareSheetProps {
  reel: Reel | null;
  onClose: () => void;
  /** Only shown for your own reels. */
  onDelete?: (reel: Reel) => void;
}

/** Public link people can open for this reel. */
function reelLink(reel: Reel) {
  return reel.video_url;
}

/** One row of the sheet. */
function Row({
  icon,
  label,
  hint,
  danger,
  busy,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={busy}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        {busy ? <ActivityIndicator size="small" color={Colors.primary} /> : icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {!!hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
    </Pressable>
  );
}

/**
 * The "…" menu on a reel: copy link, save to gallery, send on WhatsApp, post to
 * WhatsApp Status, or delete when it's your own.
 */
export default function ReelShareSheet({ reel, onClose, onDelete }: ReelShareSheetProps) {
  const [busy, setBusy] = useState<string | null>(null);

  /** Pull the remote video into the cache so we can hand a real file to apps. */
  const downloadToCache = async (r: Reel) => {
    const name = r.video_url.split("/").pop()?.split("?")[0] || `reel-${r.id}.mp4`;
    const target = `${FileSystem.cacheDirectory}${name}`;
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists) return target;
    const { uri } = await FileSystem.downloadAsync(r.video_url, target);
    return uri;
  };

  const copyLink = async (r: Reel) => {
    await Clipboard.setStringAsync(reelLink(r));
    onClose();
    Alert.alert("Link copied ✅", "Paste it anywhere to share this reel.");
  };

  const saveToGallery = async (r: Reel) => {
    try {
      setBusy("save");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo access to save reels to your gallery.");
        return;
      }
      const file = await downloadToCache(r);
      await MediaLibrary.saveToLibraryAsync(file);
      onClose();
      Alert.alert("Saved ✅", "The reel is in your gallery.");
    } catch (e: any) {
      Alert.alert("Could not save", e?.message ?? "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  /** Text + link straight into a WhatsApp chat. */
  const whatsappChat = async (r: Reel) => {
    const text = encodeURIComponent(`${r.caption ? `${r.caption}\n\n` : ""}${reelLink(r)}`);
    const url = `whatsapp://send?text=${text}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert("WhatsApp not found", "Install WhatsApp to share this reel there.");
      return;
    }
    onClose();
    Linking.openURL(url);
  };

  /**
   * WhatsApp has no direct "post to status" intent, so we hand the video file to
   * the system sheet — picking WhatsApp there offers "My status".
   */
  const whatsappStatus = async (r: Reel) => {
    try {
      setBusy("status");
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Not supported", "Sharing isn't available on this device.");
        return;
      }
      const file = await downloadToCache(r);
      onClose();
      await Sharing.shareAsync(file, {
        mimeType: "video/mp4",
        dialogTitle: "Share to WhatsApp Status",
        UTI: "public.movie",
      });
    } catch (e: any) {
      Alert.alert("Could not share", e?.message ?? "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={!!reel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Share reel</Text>

          {!!reel && (
            <>
              <Row
                icon={<Feather name="link-2" size={19} color={Colors.primary} />}
                label="Copy link"
                onPress={() => copyLink(reel)}
              />
              <Row
                icon={<Feather name="download" size={19} color={Colors.primary} />}
                label="Save to gallery"
                hint="Downloads the video to your phone"
                busy={busy === "save"}
                onPress={() => saveToGallery(reel)}
              />
              <Row
                icon={<FontAwesome name="whatsapp" size={21} color="#25D366" />}
                label="Share on WhatsApp"
                hint="Send the link in a chat"
                onPress={() => whatsappChat(reel)}
              />
              <Row
                icon={<FontAwesome name="whatsapp" size={21} color="#25D366" />}
                label="WhatsApp Status"
                hint="Pick WhatsApp → My status"
                busy={busy === "status"}
                onPress={() => whatsappStatus(reel)}
              />

              {reel.user.is_me && !!onDelete && (
                <Row
                  icon={<Feather name="trash-2" size={19} color={Colors.error} />}
                  label="Delete reel"
                  danger
                  onPress={() => {
                    onClose();
                    onDelete(reel);
                  }}
                />
              )}
            </>
          )}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: 26,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dcdce0",
    alignSelf: "center",
    marginTop: 9,
  },
  title: { fontSize: 16.5, fontWeight: "800", color: Colors.text, paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 11 },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDanger: { backgroundColor: "#fdecec" },
  rowLabel: { fontSize: 15, fontWeight: "600", color: Colors.text },
  rowLabelDanger: { color: Colors.error },
  rowHint: { fontSize: 12, color: Colors.darkGray, marginTop: 2 },
  cancel: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f2f2f4",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "700", color: Colors.text },
});
