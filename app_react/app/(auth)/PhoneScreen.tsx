import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import Button from "../components/Shared/Button";
import { FieldError, FieldLabel } from "../components/Shared/FormField";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PhoneScreen() {
  const router = useRouter();
  const { setPhone } = useRegistration();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetOtp = async () => {
    if (!phoneNumber.trim()) {
      setError("This field is required");
      return;
    }
    if (phoneNumber.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setError(null);
    const fullPhone = `+91${phoneNumber.trim()}`;
    try {
      setLoading(true);
      const res = await api.sendOtp(fullPhone);
      setPhone(fullPhone);
      // Dev mode: surface the generated OTP so testers can continue without SMS.
      if (res.devCode) {
        Alert.alert("OTP (dev mode)", `Your code is ${res.devCode}`);
      }
      router.push("/(auth)/OtpScreen");
    } catch (e: any) {
      setError(e?.message ?? "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "height" : "padding"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <Text style={styles.header}>Please share your number to get started</Text>
              <Text style={styles.subtext}>
                It helps us verify and make Aisle a safe place to foster genuine
                connections.
              </Text>

              <FieldLabel required>Phone number</FieldLabel>
              <View style={[styles.inputContainer, !!error && styles.inputContainerError]}>
                <View style={styles.countryCode}>
                  <Image
                    source={{
                      uri: "https://flagcdn.com/w40/in.png", // 🇮🇳 Flag
                    }}
                    style={styles.flag}
                  />
                  <Text style={styles.codeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(t) => {
                    setPhoneNumber(t);
                    setError(null);
                  }}
                />
              </View>
              <FieldError>{error}</FieldError>
              <View style={{ height: 20 }} />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#555" />
                <Text style={styles.infoText}>
                  Your number is safe with us – it’s private and won’t appear on your
                  profile.
                </Text>
              </View>

              {/* <TouchableOpacity style={styles.otpButton}>
        <Text style={styles.otpText}>Get OTP</Text>
      </TouchableOpacity> */}
              <View style={styles.buttonContainer}
              /* style={{
                marginTop: 500,
              }} */
              >
                {loading ? (
                  <ActivityIndicator size="large" color="#b8007e" />
                ) : (
                  <Button text="Get OTP" onPress={handleGetOtp} />
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    /* flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "flex-start", */
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 10,
    color: "#111",
  },
  subtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  inputContainerError: {
    borderColor: "#ef4444",
    borderBottomWidth: 2,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  flag: {
    width: 24,
    height: 16,
    marginRight: 5,
    borderRadius: 2,
  },
  codeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: "#f3f3f3",
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    // alignItems: "center",
    alignItems: "flex-start",
    // marginBottom: 30,
    marginBottom: 24,
  },
  infoText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 13,
    flex: 1,
    flexWrap: "wrap",
  },
  // otpButton: {
  //   backgroundColor: "#8d2561",
  //   paddingVertical: 14,
  //   borderRadius: 10,
  //   alignItems: "center",
  // },
  // otpText: {
  //   color: "#fff",
  //   fontSize: 16,
  //   fontWeight: "600",
  // },
});
