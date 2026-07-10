import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

interface IntroNavProps {
  /** Called when the user taps Next (bottom-right). */
  onNext: () => void;
  /** Called when the user taps Previous (bottom-left). Defaults to router.back(). */
  onPrev?: () => void;
  /** Show a spinner in the Next button (e.g. while submitting). */
  loading?: boolean;
  /** Disable the Next button. */
  nextDisabled?: boolean;
  /** Hide the Previous button (e.g. the very first step). */
  hidePrev?: boolean;
}

/**
 * Consistent registration navigation: a Previous button at the bottom-left and
 * a Next button at the bottom-right. Drop it as the last child of a full-screen
 * container (a View/SafeAreaView with flex:1).
 */
export default function IntroNav({ onNext, onPrev, loading, nextDisabled, hidePrev }: IntroNavProps) {
  const router = useRouter();
  const disabled = nextDisabled || loading;

  return (
    <>
      {!hidePrev && (
        <TouchableOpacity
          style={styles.prev}
          activeOpacity={0.8}
          onPress={onPrev ?? (() => router.back())}
        >
          <Feather name="arrow-left" size={24} color="#8d2561" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.next, disabled && styles.disabled]}
        activeOpacity={0.8}
        onPress={onNext}
        disabled={disabled}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Feather name="arrow-right" size={24} color="#fff" />}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  prev: {
    position: "absolute",
    bottom: 28,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#8d2561",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  next: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8d2561",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  disabled: { opacity: 0.5 },
});
