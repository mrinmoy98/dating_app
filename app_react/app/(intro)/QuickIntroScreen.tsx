import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import IntroNav from "../components/Shared/IntroNav";
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

const EIGHTEEN_YEARS_AGO = new Date(
  new Date().getFullYear() - 18,
  new Date().getMonth(),
  new Date().getDate(),
);

export default function QuickIntroScreen() {
  const router = useRouter();
  const { patch } = useRegistration();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState<string | undefined>();

  // address
  const [location, setLocation] = useState(""); // locality / area
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [postal, setPostal] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const onChangeDate = (_event: any, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setDob(selected);
  };

  const useMyLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location access to auto-fill your address.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const pl = places?.[0];
      if (pl) {
        setLocation([pl.name, pl.street, pl.district].filter(Boolean).join(", ") || pl.city || "");
        setCity(pl.city ?? pl.subregion ?? "");
        setStateName(pl.region ?? "");
        setCountry(pl.country ?? "");
        setPostal(pl.postalCode ?? "");
      }
      Alert.alert("Location captured ✅", "Your address was auto-filled. You can edit it.");
    } catch (e: any) {
      Alert.alert("Could not get location", e?.message ?? "Please try again.");
    } finally {
      setLocating(false);
    }
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
    if (!gender) {
      Alert.alert("Gender required", "Please select your gender.");
      return;
    }
    patch({
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      dob: toIso(dob),
      gender: gender as any,
      location: location.trim() || undefined,
      city: city.trim() || undefined,
      state: stateName.trim() || undefined,
      country: country.trim() || undefined,
      postal_code: postal.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    });
    router.push("/(intro)/AgeConfirmationModal");
  };

  return (
    // <SafeAreaView style={styles.safe}>
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ProgressBar />
        <Text style={styles.title}>Let's start with a{"\n"}quick intro</Text>

        {/* Name */}
        <TextInput style={styles.input} placeholder="First name *" placeholderTextColor="#888" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Last name (optional)" placeholderTextColor="#888" value={lastName} onChangeText={setLastName} />

        {/* DOB */}
        <TouchableOpacity style={styles.input   } activeOpacity={0.7} onPress={() => setShowPicker(true)}>
          <Text style={{ fontSize: 16, color: dob ? "#000" : "#888" }}>
            {dob ? formatDate(dob) : "Date of birth *  (DD / MM / YYYY)"}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={dob ?? EIGHTEEN_YEARS_AGO}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={onChangeDate}
            themeVariant="light"
          />
        )}
        {Platform.OS === "ios" && showPicker && (
          <TouchableOpacity onPress={() => setShowPicker(false)}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        )}

        {/* Gender */}
        <Text style={styles.sectionLabel}>Gender *</Text>
        <View style={styles.genderRow}>
          {["Male", "Female", "Other"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.genderBtn, gender === item && styles.genderBtnSelected]}
              onPress={() => setGender(item)}
            >
              <Text style={[styles.genderText, gender === item && styles.genderTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Address */}
        <Text style={styles.sectionLabel}>Address</Text>
        <TouchableOpacity style={styles.locationBtn} onPress={useMyLocation} disabled={locating} activeOpacity={0.8}>
          {locating ? <ActivityIndicator color="#8d2561" /> : <Feather name="map-pin" size={18} color="#8d2561" />}
          <Text style={styles.locationBtnText}>
            {latitude != null ? "Update current location" : "Use my current location"}
          </Text>
        </TouchableOpacity>
        {latitude != null && <Text style={styles.coordNote}>📍 Coordinates saved — helps find matches near you.</Text>}

        <TextInput style={styles.input} placeholder="Area / locality (optional)" placeholderTextColor="#888" value={location} onChangeText={setLocation} />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.half]} placeholder="City" placeholderTextColor="#888" value={city} onChangeText={setCity} />
          <TextInput style={[styles.input, styles.half]} placeholder="State" placeholderTextColor="#888" value={stateName} onChangeText={setStateName} />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.half]} placeholder="Country" placeholderTextColor="#888" value={country} onChangeText={setCountry} />
          <TextInput style={[styles.input, styles.half]} placeholder="PIN / ZIP" placeholderTextColor="#888" keyboardType="number-pad" value={postal} onChangeText={setPostal} />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#555" />
          <Text style={styles.infoText}>
            Fields marked * are required. Address helps show you people nearby — you can edit it anytime.
          </Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <IntroNav onNext={handleNext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 24 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 20,
    color: "#000",
  },
  row: { flexDirection: "row", gap: 14 },
  half: { flex: 1 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 12, marginTop: 4 },
  doneText: { color: "#8d2561", fontWeight: "700", fontSize: 16, textAlign: "right", marginBottom: 16 },
  genderRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  genderBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: "#ccc" },
  genderBtnSelected: { backgroundColor: "#8d2561", borderColor: "#8d2561" },
  genderText: { color: "#000", fontWeight: "500" },
  genderTextSelected: { color: "#fff" },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#8d2561",
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#fbe9f3",
    marginBottom: 10,
  },
  locationBtnText: { color: "#8d2561", fontWeight: "700", fontSize: 14 },
  coordNote: { fontSize: 12, color: "#8d2561", marginBottom: 14 },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: "#333" },
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
