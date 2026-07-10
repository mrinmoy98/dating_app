import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";

export default function SetPasswordScreen() {
  const router = useRouter();
  const { authToken, user } = useRegistration();
  const hasPassword = !!user?.has_password;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (!authToken) {
      Alert.alert("Not signed in", "Please log in again.");
      return;
    }
    try {
      setSaving(true);
      await api.setPassword(password, authToken);
      Alert.alert("Password saved ✅", "You can now log in with your email/phone + password.");
      router.back();
    } catch (e: any) {
      Alert.alert("Could not save", e?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient colors={[Colors.primary, "#b8007e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{hasPassword ? "Change Password" : "Set Password"}</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          {hasPassword
            ? "Update your password. Use at least 8 characters."
            : "Add a password so you can log in without an OTP. Use at least 8 characters."}
        </Text>

        <View style={styles.inputBox}>
          <Feather name="lock" size={18} color={Colors.gray} />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={Colors.gray}
            secureTextEntry={!show}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShow((s) => !s)}>
            <Feather name={show ? "eye-off" : "eye"} size={18} color={Colors.gray} />
          </Pressable>
        </View>

        <View style={styles.inputBox}>
          <Feather name="lock" size={18} color={Colors.gray} />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={Colors.gray}
            secureTextEntry={!show}
            value={confirm}
            onChangeText={setConfirm}
          />
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <><Feather name="check" size={20} color="#fff" /><Text style={styles.saveText}>Save Password</Text></>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBtn: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  body: { padding: 20 },
  subtitle: { fontSize: 14, color: Colors.darkGray, marginBottom: 24 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#e3e3e3", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, backgroundColor: "#fff",
  },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  saveBtn: {
    flexDirection: "row", gap: 8, backgroundColor: Colors.primary, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
