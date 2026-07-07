import React from "react";
import { Text, TouchableOpacity } from "react-native";

type ButtonProps = {
  text: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress: () => void;
};

export default function Button({ text,variant = 'primary', onPress }: ButtonProps) {
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
}
