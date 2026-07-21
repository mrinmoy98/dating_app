import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from "react-native";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import Button from "../components/Shared/Button";
import DismissKeyboard from "../components/Shared/DismissKeyboard";
import { FieldError } from "../components/Shared/FormField";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmailScreen() {
  const router = useRouter();
  const { registrationToken, setEmail } = useRegistration();
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());

  // Email is optional — skipping goes straight to onboarding (no email on the account).
  const handleSkip = () => {
    setEmail("");
    router.push("/(intro)/QuickIntroScreen");
  };

  const handleSend = async () => {
    // Empty = user chose to skip (email is optional).
    if (!emailInput.trim()) {
      handleSkip();
      return;
    }
    if (!isValid) {
      setError("Please enter a valid email address, or skip this step");
      return;
    }
    if (!registrationToken) {
      setError("Session expired. Please verify your phone number again.");
      router.replace("/(auth)/PhoneScreen");
      return;
    }
    setError(null);
    const email = emailInput.trim().toLowerCase();
    try {
      setLoading(true);
      const res = await api.sendEmailOtp(email, registrationToken);
      setEmail(email);
      if (res.devCode) Alert.alert("Email code (dev mode)", `Your code is ${res.devCode}`);
      router.push("/(auth)/EmailOtpScreen");
    } catch (e: any) {
      setError(e?.message ?? "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <DismissKeyboard>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "height" : "padding"}
        >
          <View style={styles.container}>
            <View style={styles.topRow}>
              <Text style={styles.header}>What's your email?</Text>
              <Pressable onPress={handleSkip} hitSlop={10}>
                <Text style={styles.skipTop}>Skip</Text>
              </Pressable>
            </View>
            <Text style={styles.subtext}>
              Adding an email is optional. If you add one, we'll send a code to verify it.
            </Text>

            <View style={[styles.inputContainer, !!error && styles.inputContainerError]}>
              <Ionicons name="mail-outline" size={20} color="#888" />
              <TextInput
                style={styles.emailInput}
                placeholder="you@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={emailInput}
                onChangeText={(t) => {
                  setEmailInput(t);
                  setError(null);
                }}
              />
            </View>
            <FieldError>{error}</FieldError>
            <View style={{ height: 18 }} />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#555" />
              <Text style={styles.infoText}>
                Your email stays private and won't appear on your profile.
              </Text>
            </View>

            <View style={{ marginTop: "auto" }}>
              {loading ? (
                <ActivityIndicator size="large" color="#b8007e" />
              ) : (
                <>
                  <Button text={emailInput.trim() ? "Send code" : "Skip for now"} onPress={handleSend} />
                  {!!emailInput.trim() && (
                    <Pressable onPress={handleSkip} style={styles.skipBottom}>
                      <Text style={styles.skipBottomText}>Skip for now</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </DismissKeyboard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  topRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 40, marginBottom: 10 },
  header: { fontSize: 24, fontWeight: "700", color: "#111" },
  skipTop: { fontSize: 15, fontWeight: "600", color: "#b8007e" },
  subtext: { fontSize: 14, color: "#666", marginBottom: 30 },
  skipBottom: { alignItems: "center", paddingVertical: 4, marginBottom: 8 },
  skipBottomText: { color: "#888", fontSize: 14, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    paddingBottom: 6,
    gap: 8,
  },
  inputContainerError: { borderColor: "#ef4444", borderBottomWidth: 2 },
  emailInput: { flex: 1, fontSize: 18, fontWeight: "500", color: "#111" },
  infoBox: {
    backgroundColor: "#f3f3f3",
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  infoText: { color: "#555", fontSize: 13, flex: 1, flexWrap: "wrap" },
});
