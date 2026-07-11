import React from "react";
// import { Text, TouchableOpacity } from "react-native";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";

type ButtonProps = {
  text: string;
  variant?: "primary" | "secondary" | "outline";
  onPress: () => void;
  style?: ViewStyle;
};

/* export default function Button({ text,variant = 'primary', onPress }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#b8007e",
        paddingVertical: 15,
        paddingHorizontal: 140,
        borderRadius: 9,
        marginBottom: 20,
        
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "600",
          fontSize: 16,
          // styles[`${variant}Text`],
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
} */
export default function Button({
  text,
  variant = "primary",
  onPress,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.button, style]}
    >
      <Text numberOfLines={1} style={styles.text}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: "#b8007e",
    paddingVertical: 15,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});