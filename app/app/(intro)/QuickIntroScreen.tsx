import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Alert, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRegistration } from "../../context/RegistrationContext";
import ProgressBar from "../components/Shared/ProgressBar";

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd} / ${mm} / ${d.getFullYear()}`;
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// Default the picker to an 18-years-ago date.
const EIGHTEEN_YEARS_AGO = new Date(
  new Date().getFullYear() - 18,
  new Date().getMonth(),
  new Date().getDate(),
);

export default function QuickIntroScreen() {
  const router = useRouter();
  const { patch } = useRegistration();

  const [firstName, setFirstName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState<string | undefined>();

  const onChangeDate = (_event: any, selected?: Date) => {
    // On Android the picker is a modal that closes on select; on iOS it stays inline.
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setDob(selected);
  };

  const handleNext = () => {
    if (!firstName.trim()) {
      Alert.alert("First name required", "Please enter your first name.");
      return;
    }
    if (!dob) {
      Alert.alert("Date of birth required", "Please pick your date of birth.");
      return;
    }
    patch({
      first_name: firstName.trim(),
      dob: toIso(dob),
      location: location.trim() || undefined,
      gender: gender as any,
    });
    router.push("/(intro)/AgeConfirmationModal");
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Progress bar */}
          <ProgressBar />
          {/* <View style={styles.progressBar}>
            <View style={styles.progressIndicator} />
          </View> */}
    
          <Text style={styles.title}>Let's start with a{"\n"}quick intro</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TouchableOpacity
            style={styles.input}
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}
          >
            <Text style={{ fontSize: 16, color: dob ? "#000" : "#888" }}>
              {dob ? formatDate(dob) : "DD  /  MM  /  YYYY"}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dob ?? EIGHTEEN_YEARS_AGO}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
          )}
          {Platform.OS === "ios" && showPicker && (
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor="#888"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.genderRow}>
            {["Male", "Female"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.genderBtn,
                  gender === item && styles.genderBtnSelected,
                ]}
                onPress={() => setGender(item)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === item && styles.genderTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#555"
            />
            <Text style={styles.infoText}>
              You can choose to hide your first name after verifying yourself.
            </Text>
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Ionicons name="arrow-forward" size={28} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    justifyContent: "flex-start",
    height:'100%'
  },
//   progressBar: {
//     height: 4,
//     backgroundColor: "#eee",
//     width: "100%",
//     borderRadius: 2,
//     marginBottom: 16,
//   },
//   progressIndicator: {
//     width: "10%",
//     backgroundColor: "#000",
//     height: "100%",
//     borderRadius: 2,
//   },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 24,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 24,
    color: "#000",
  },
  doneText: {
    color: "#8d2561",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "right",
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  genderBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  genderBtnSelected: {
    backgroundColor: "#8d2561",
    borderColor: "#8d2561",
  },
  genderText: {
    color: "#000",
    fontWeight: "500",
  },
  genderTextSelected: {
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  nextBtn: {
    backgroundColor: "#8d2561",
    borderRadius: 30,
    padding: 16,
    position: "absolute",
    bottom: 24,
    right: 24,
    elevation: 5,
  },
});
