import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

export const ERROR_RED = "#ef4444";

/**
 * Field label. Pass `required` to append a red asterisk.
 * Keeps every registration screen consistent.
 */
export function FieldLabel({
  children,
  required,
  style,
}: {
  children: React.ReactNode;
  required?: boolean;
  style?: TextStyle;
}) {
  return (
    <Text style={[styles.label, style]}>
      {children}
      {required ? <Text style={styles.req}> *</Text> : null}
    </Text>
  );
}

/**
 * Inline validation error, shown in red directly UNDER the field.
 * Renders nothing when there's no error — we never use popups for validation.
 */
export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  req: { color: ERROR_RED, fontWeight: "700" },
  error: { color: ERROR_RED, fontSize: 12.5, marginTop: 6, fontWeight: "500" },
});
