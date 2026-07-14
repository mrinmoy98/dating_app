import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { FieldError, FieldLabel } from "../components/Shared/FormField";
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

type Errors = { firstName?: string; dob?: string; gender?: string; location?: string };

export default function QuickIntroScreen() {
  const router = useRouter();
  const { patch } = useRegistration();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState<string | undefined>();

  // address
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [postal, setPostal] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const clear = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  const onChangeDate = (_event: any, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) {
      setDob(selected);
      clear("dob");
    }
  };

  const useMyLocation = async () => {
    clear("location");
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrors((e) => ({ ...e, location: "Location permission denied. You can type your address instead." }));
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
    } catch (e: any) {
      setErrors((err) => ({ ...err, location: e?.message ?? "Could not get your location." }));
    } finally {
      setLocating(false);
    }
  };

  const handleNext = () => {
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = "This field is required";
    if (!dob) next.dob = "This field is required";
    if (!gender) next.gender = "This field is required";

    if (Object.keys(next).length > 0) {
      setErrors(next); // inline red errors — no popups
      return;
    }

    patch({
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      dob: toIso(dob as Date),
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
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ProgressBar />
        <Text style={styles.title}>Let's start with a{"\n"}quick intro</Text>

        {/* First name */}
        <View style={styles.field}>
          <FieldLabel required>First name</FieldLabel>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="Your first name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={(t) => {
              setFirstName(t);
              clear("firstName");
            }}
          />
          <FieldError>{errors.firstName}</FieldError>
        </View>

        {/* Last name */}
        <View style={styles.field}>
          <FieldLabel>Last name</FieldLabel>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* DOB */}
        <View style={styles.field}>
          <FieldLabel required>Date of birth</FieldLabel>
          <TouchableOpacity
            style={[styles.input, errors.dob && styles.inputError]}
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}
          >
            <Text style={{ fontSize: 16, color: dob ? "#000" : "#999" }}>
              {dob ? formatDate(dob) : "DD / MM / YYYY"}
            </Text>
          </TouchableOpacity>
          <FieldError>{errors.dob}</FieldError>
        </View>
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
        <View style={styles.field}>
          <FieldLabel required>Gender</FieldLabel>
          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.genderBtn,
                  gender === item && styles.genderBtnSelected,
                  errors.gender && styles.genderBtnError,
                ]}
                onPress={() => {
                  setGender(item);
                  clear("gender");
                }}
              >
                <Text style={[styles.genderText, gender === item && styles.genderTextSelected]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FieldError>{errors.gender}</FieldError>
        </View>

        {/* Address (all optional) */}
        <FieldLabel style={styles.sectionLabel}>Address</FieldLabel>
        <TouchableOpacity style={styles.locationBtn} onPress={useMyLocation} disabled={locating} activeOpacity={0.8}>
          {locating ? <ActivityIndicator color="#8d2561" /> : <Feather name="map-pin" size={18} color="#8d2561" />}
          <Text style={styles.locationBtnText}>
            {latitude != null ? "Update current location" : "Use my current location"}
          </Text>
        </TouchableOpacity>
        <FieldError>{errors.location}</FieldError>
        {latitude != null && (
          <Text style={styles.coordNote}>📍 Location captured — helps find matches near you.</Text>
        )}

        <View style={styles.field}>
          <FieldLabel>Area / locality</FieldLabel>
          <TextInput style={styles.input} placeholder="Optional" placeholderTextColor="#999" value={location} onChangeText={setLocation} />
        </View>
        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <FieldLabel>City</FieldLabel>
            <TextInput style={styles.input} placeholder="City" placeholderTextColor="#999" value={city} onChangeText={setCity} />
          </View>
          <View style={[styles.field, styles.half]}>
            <FieldLabel>State</FieldLabel>
            <TextInput style={styles.input} placeholder="State" placeholderTextColor="#999" value={stateName} onChangeText={setStateName} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <FieldLabel>Country</FieldLabel>
            <TextInput style={styles.input} placeholder="Country" placeholderTextColor="#999" value={country} onChangeText={setCountry} />
          </View>
          <View style={[styles.field, styles.half]}>
            <FieldLabel>PIN / ZIP</FieldLabel>
            <TextInput style={styles.input} placeholder="PIN" placeholderTextColor="#999" keyboardType="number-pad" value={postal} onChangeText={setPostal} />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#555" />
          <Text style={styles.infoText}>
            Fields marked <Text style={styles.star}>*</Text> are required. Address helps show you people nearby.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <IntroNav onNext={handleNext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 24, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 24 },
  field: { marginBottom: 18 },
  row: { flexDirection: "row", gap: 14 },
  half: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fafafa",
  },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fff5f5" },
  doneText: { color: "#8d2561", fontWeight: "700", fontSize: 16, textAlign: "right", marginBottom: 16 },
  sectionLabel: { fontSize: 15, color: "#111", marginTop: 4 },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: "#ddd" },
  genderBtnError: { borderColor: "#ef4444" },
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
  },
  locationBtnText: { color: "#8d2561", fontWeight: "700", fontSize: 14 },
  coordNote: { fontSize: 12, color: "#8d2561", marginTop: 8 },
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
  star: { color: "#ef4444", fontWeight: "700" },
});
