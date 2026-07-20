import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

interface Props {
  value: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function fmt(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd} / ${mm} / ${d.getFullYear()}`;
}

/** yyyy-mm-dd for the web <input type="date"> value. */
function toInputValue(d: Date | null) {
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const DEFAULT_18 = new Date(
  new Date().getFullYear() - 18,
  new Date().getMonth(),
  new Date().getDate(),
);

/**
 * Cross-platform date field.
 *
 * `@react-native-community/datetimepicker` has no web implementation — tapping
 * it does nothing in a browser. On web we render a real <input type="date">
 * (styled to match), and keep the native picker on iOS/Android.
 */
export default function DatePickerField({
  value,
  onChange,
  placeholder = "DD / MM / YYYY",
  maximumDate,
  minimumDate,
  style,
  textStyle,
}: Props) {
  const [show, setShow] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.input, style]}>
        {/* React Native Web passes unknown props straight to the DOM node. */}
        {React.createElement("input", {
          type: "date",
          value: toInputValue(value),
          max: toInputValue(maximumDate ?? new Date()),
          min: minimumDate ? toInputValue(minimumDate) : undefined,
          onChange: (e: any) => {
            const v = e.target.value;
            if (!v) return;
            const [y, m, d] = v.split("-").map(Number);
            onChange(new Date(y, m - 1, d));
          },
          style: {
            border: "none",
            outline: "none",
            background: "transparent",
            font: "inherit",
            fontSize: 16,
            color: value ? "#000" : "#999",
            width: "100%",
          },
        })}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={[styles.input, style]} activeOpacity={0.7} onPress={() => setShow(true)}>
        <Text style={[{ fontSize: 16, color: value ? "#000" : "#999" }, textStyle]}>
          {value ? fmt(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value ?? DEFAULT_18}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={maximumDate ?? new Date()}
          minimumDate={minimumDate}
          themeVariant="light"
          onChange={(event, selected) => {
            if (Platform.OS === "android") setShow(false);
            if (event.type === "dismissed") return;
            if (selected) onChange(selected);
          }}
        />
      )}

      {Platform.OS === "ios" && show && (
        <TouchableOpacity onPress={() => setShow(false)}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    justifyContent: "center",
  },
  done: { color: "#8d2561", fontWeight: "700", fontSize: 16, textAlign: "right", marginBottom: 16 },
});
