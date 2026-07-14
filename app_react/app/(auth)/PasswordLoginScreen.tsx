import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";

export default function PasswordLoginScreen() {
  const router = useRouter();
  const { setAuth } = useRegistration();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("Missing info", "Enter your email/phone and password.");
      return;
    }
    try {
      setLoading(true);
      const res = await api.loginPassword(identifier.trim(), password);
      setAuth(res.token, res.user); // token persists + navigation guard sends us into the app
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // return (
  //   <SafeAreaView style={styles.container}>
  //     <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
  //       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
  //         <View style={styles.body}>
  //           <Pressable style={styles.back} onPress={() => router.back()}>
  //             <Feather name="arrow-left" size={24} color={Colors.text} />
  //           </Pressable>

  //           <Text style={styles.title}>Welcome back</Text>
  //           <Text style={styles.subtitle}>Log in with your email or phone and password.</Text>

  //           <View style={styles.inputBox}>
  //             <Feather name="user" size={18} color={Colors.gray} />
  //             <TextInput
  //               style={styles.input}
  //               placeholder="Email or phone (+91…)"
  //               placeholderTextColor={Colors.gray}
  //               autoCapitalize="none"
  //               autoCorrect={false}
  //               value={identifier}
  //               onChangeText={setIdentifier}
  //             />
  //           </View>

  //           <View style={styles.inputBox}>
  //             <Feather name="lock" size={18} color={Colors.gray} />
  //             <TextInput
  //               style={styles.input}
  //               placeholder="Password"
  //               placeholderTextColor={Colors.gray}
  //               secureTextEntry={!show}
  //               value={password}
  //               onChangeText={setPassword}
  //             />
  //             <Pressable onPress={() => setShow((s) => !s)}>
  //               <Feather name={show ? "eye-off" : "eye"} size={18} color={Colors.gray} />
  //             </Pressable>
  //           </View>

  //           <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
  //             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>Log in</Text>}
  //           </Pressable>

  //           <Pressable style={styles.otpLink} onPress={() => router.replace("/(auth)/PhoneScreen")}>
  //             <Text style={styles.otpLinkText}>Use OTP instead</Text>
  //           </Pressable>
  //         </View>
  //       </KeyboardAvoidingView>
  //     </TouchableWithoutFeedback>
  //   </SafeAreaView>
  // );
  return (
  <SafeAreaView style={styles.container}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.body}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </Pressable>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Log in with your email or phone and password.
          </Text>

          <View style={styles.inputBox}>
            <Feather name="user" size={18} color={Colors.gray} />
            <TextInput
              style={styles.input}
              placeholder="Email or phone (+91…)"
              placeholderTextColor={Colors.gray}
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <View style={styles.inputBox}>
            <Feather name="lock" size={18} color={Colors.gray} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.gray}
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShow((s) => !s)}>
              <Feather
                name={show ? "eye-off" : "eye"}
                size={18}
                color={Colors.gray}
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Log in</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.otpLink}
            onPress={() => router.replace("/(auth)/PhoneScreen")}
          >
            <Text style={styles.otpLinkText}>Use OTP instead</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  back: { width: 44, height: 44, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, marginTop: 20 },
  subtitle: { fontSize: 14, color: Colors.darkGray, marginTop: 8, marginBottom: 30 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#e3e3e3", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, backgroundColor: "#fafafa",
  },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  loginBtn: {
    backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 12,
    alignItems: "center", marginTop: 8,
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  otpLink: { alignItems: "center", marginTop: 20 },
  otpLinkText: { color: Colors.primary, fontWeight: "600", fontSize: 15 },
});
