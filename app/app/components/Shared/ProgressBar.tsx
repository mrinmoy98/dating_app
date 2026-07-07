import React from "react";
import { StyleSheet, View } from "react-native";

export default function ProgressBar() {
  return (
    <View style={styles.progressBar}>
      <View style={styles.progressIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
 
  progressBar: {
    height: 4,
    backgroundColor: "#eee",
    width: "100%",
    borderRadius: 2,
    marginBottom: 16,
  },
  progressIndicator: {
    width: "10%",
    backgroundColor: "#000",
    height: "100%",
    borderRadius: 2,
  }
});
