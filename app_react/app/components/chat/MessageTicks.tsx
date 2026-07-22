import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * WhatsApp-style delivery state, shown only on your own bubbles:
 *
 *   clock         still uploading / not acknowledged by the server
 *   ✓  (single)   saved on the server, recipient is offline
 *   ✓✓ (grey)     recipient is online and has the message
 *   ✓✓ (blue)     recipient opened the conversation
 */
export default function MessageTicks({
  pending,
  failed,
  delivered,
  read,
  color = "rgba(255,255,255,0.8)",
}: {
  pending?: boolean;
  failed?: boolean;
  delivered?: boolean;
  read?: boolean;
  color?: string;
}) {
  if (failed) return <Feather name="alert-circle" size={13} color="#FFD5D5" />;
  if (pending) return <ActivityIndicator size="small" color={color} style={styles.spinner} />;

  const tint = read ? "#4FC3F7" : color;
  if (!delivered) return <Feather name="check" size={14} color={tint} />;

  // Two overlapping checks so they read as a single double-tick glyph.
  return (
    <View style={styles.double}>
      <Feather name="check" size={14} color={tint} />
      <Feather name="check" size={14} color={tint} style={styles.second} />
    </View>
  );
}

const styles = StyleSheet.create({
  double: { flexDirection: "row", width: 18 },
  second: { marginLeft: -8 },
  spinner: { transform: [{ scale: 0.6 }] },
});
