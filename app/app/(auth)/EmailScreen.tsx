import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import Button from "../components/Shared/Button";

export default function EmailScreen() {
  const router = useRouter();
  const { registrationToken, setEmail } = useRegistration();
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());

  const handleSend = async () => {
    if (!isValid) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (!registrationToken) {
      Alert.alert("Session expired", "Please verify your phone number again.");
      router.replace("/(auth)/PhoneScreen");
      return;
    }
    const email = emailInput.trim().toLowerCase();
    try {
      setLoading(true);
      const res = await api.sendEmailOtp(email, registrationToken);
      setEmail(email);
      if (res.devCode) Alert.alert("Email code (dev mode)", `Your code is ${res.devCode}`);
      router.push("/(auth)/EmailOtpScreen");
    } catch (e: any) {
      Alert.alert("Could not send code", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>What's your email?</Text>
      <Text style={styles.subtext}>
        We'll send a verification code to make sure it's really you.
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" />
        <TextInput
          style={styles.emailInput}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={emailInput}
          onChangeText={setEmailInput}
        />
      </View>

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
          <Button text="Send code" onPress={handleSend} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "700", marginTop: 40, marginBottom: 10, color: "#111" },
  subtext: { fontSize: 14, color: "#666", marginBottom: 30 },
  inputContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    paddingBottom: 6,
    marginBottom: 25,
    gap: 8,
  },
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
