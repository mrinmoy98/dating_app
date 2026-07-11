import Colors from "@/data/Colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type Gender } from "../../lib/api";
import { useAppDispatch } from "../../store/hooks";
import { setUser } from "../../store/slices/authSlice";
import ProfileSection from "../components/ProfileSection";

const GENDERS: Gender[] = ["Male", "Female", "Other"];
const RELIGIONS = [
  "Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain",
  "Jewish", "Parsi", "Spiritual", "Atheist", "Prefer not to say", "Other",
];
const LANGUAGES = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati",
  "Kannada", "Malayalam", "Punjabi", "Urdu", "Odia", "Assamese", "Nepali",
  "Spanish", "French", "German", "Arabic", "Chinese", "Japanese",
];
const DIETS = ["Vegetarian", "Non-vegetarian", "Vegan", "Eggetarian", "Jain"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const COMPLEXIONS = ["Fair", "Wheatish", "Dusky", "Dark"];
const HEALTH_OPTIONS = ["No health problem", "Diabetes", "Low BP", "High BP", "Heart ailment", "Thyroid", "Other"];
const INTERESTS = [
  "Travel", "Music", "Movies", "Reading", "Fitness", "Cooking", "Photography",
  "Gaming", "Art", "Dancing", "Sports", "Foodie", "Yoga", "Hiking", "Coffee",
  "Pets", "Fashion", "Technology", "Nature", "Writing",
];

// ---- unit helpers ----
const cmToFtIn = (cm: number | null) => {
  if (!cm) return { ft: 0, inch: 0 };
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round(totalInches - ft * 12);
  return inch === 12 ? { ft: ft + 1, inch: 0 } : { ft, inch };
};
const ftInToCm = (ft: number, inch: number) => Math.round((ft * 12 + inch) * 2.54);
const round1 = (n: number) => Math.round(n * 10) / 10;
const heightLabelFrom = (cm: number | null) => {
  if (!cm) return "";
  const { ft, inch } = cmToFtIn(cm);
  return `${ft}'${inch}" (${cm} cm)`;
};

/** A row of single-select chips. */
function ChipRow<T extends string>({
  options, value, onSelect,
}: { options: readonly T[]; value?: T | null; onSelect: (v: T) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable key={opt} onPress={() => onSelect(opt)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A labelled text field. */
function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: "default" | "numeric"; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

/** Accordion-style dropdown (single select). */
function Dropdown({
  label, value, options, placeholder, onSelect,
}: {
  label: string; value: string; options: readonly string[];
  placeholder: string; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.dropdown} onPress={() => setOpen((o) => !o)}>
        <Text style={[styles.dropdownText, !value && { color: Colors.gray }]}>{value || placeholder}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={20} color={Colors.darkGray} />
      </Pressable>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.dropdownItem}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemActive]}>{opt}</Text>
                {value === opt && <Feather name="check" size={18} color={Colors.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/** Two-way unit toggle (e.g. cm/ft, kg/lbs). */
function UnitToggle<T extends string>({
  units, value, onChange,
}: { units: readonly T[]; value: T; onChange: (u: T) => void }) {
  return (
    <View style={styles.unitToggle}>
      {units.map((u) => (
        <Pressable key={u} onPress={() => onChange(u)} style={[styles.unitBtn, value === u && styles.unitBtnActive]}>
          <Text style={[styles.unitText, value === u && styles.unitTextActive]}>{u}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Pill action button used inside the full-screen photo viewer. */
function ActionPill({
  icon, label, onPress, danger,
}: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.actionPill} onPress={onPress}>
      <View style={[styles.actionPillIcon, danger && styles.actionPillIconDanger]}>
        <Feather name={icon} size={20} color={danger ? "#fff" : Colors.primary} />
      </View>
      <Text style={styles.actionPillLabel}>{label}</Text>
    </Pressable>
  );
}

/** A read-only summary row (label + value) shown inside a section card. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, value === "—" && { color: Colors.gray }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, authToken, setAuth } = useRegistration();
  const dispatch = useAppDispatch();

  // ---- committed profile state ----
  const [firstName, setFirstName] = useState<string>(user?.first_name ?? "");
  const [dobDate, setDobDate] = useState<Date | null>(user?.dob ? new Date(user.dob) : null);
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [location, setLocation] = useState<string>(user?.location ?? "");
  const [bio, setBio] = useState<string>(user?.bio ?? "");
  const [heightCm, setHeightCm] = useState<number | null>(user?.height_cm ?? null);
  const [weightKg, setWeightKg] = useState<number | null>(user?.weight_kg ?? null);
  const [religion, setReligion] = useState<string>(user?.religion ?? "");
  const [languages, setLanguages] = useState<string[]>(user?.other_languages ?? []);
  const [occupation, setOccupation] = useState<string>(user?.occupation ?? "");
  const [education, setEducation] = useState<string>(user?.education ?? "");
  const [diet, setDiet] = useState<string>(user?.diet ?? "");
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [lastName, setLastName] = useState<string>(user?.last_name ?? "");
  const [bloodGroup, setBloodGroup] = useState<string>(user?.blood_group ?? "");
  const [complexion, setComplexion] = useState<string>(user?.complexion ?? "");
  const [healthInfo, setHealthInfo] = useState<string>(user?.health_info ?? "");
  // address / coordinates
  const [city, setCity] = useState<string>(user?.address?.city ?? "");
  const [stateName, setStateName] = useState<string>(user?.address?.state ?? "");
  const [country, setCountry] = useState<string>(user?.address?.country ?? "");
  const [latitude, setLatitude] = useState<number | null>(user?.latitude ?? user?.address?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(user?.longitude ?? user?.address?.longitude ?? null);
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location access to auto-fill your city.");
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
        setCity(pl.city ?? pl.subregion ?? "");
        setStateName(pl.region ?? "");
        setCountry(pl.country ?? "");
        const loc = [pl.city ?? pl.subregion, pl.region].filter(Boolean).join(", ");
        if (loc) setLocation(loc);
      }
      Alert.alert("Location captured ✅", "Your city and coordinates were set. Tap Save to keep them.");
    } catch (e: any) {
      Alert.alert("Could not get location", e?.message ?? "Please try again.");
    } finally {
      setLocating(false);
    }
  };
  const [photos, setPhotos] = useState<string[]>((user?.photos ?? []).map((p: any) => p.url));

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // On open, load the latest profile from the backend and (re)fill every field,
  // so the form always reflects what's actually saved (not a stale cached user).
  useEffect(() => {
    if (!authToken) return;
    let active = true;
    api
      .me(authToken)
      .then((u: any) => {
        if (!active || !u) return;
        setFirstName(u.first_name ?? "");
        setLastName(u.last_name ?? "");
        setDobDate(u.dob ? new Date(u.dob) : null);
        setGender(u.gender ?? null);
        setLocation(u.location ?? "");
        setBio(u.bio ?? "");
        setHeightCm(u.height_cm ?? null);
        setWeightKg(u.weight_kg ?? null);
        setReligion(u.religion ?? "");
        setLanguages(u.other_languages ?? []);
        setOccupation(u.occupation ?? "");
        setEducation(u.education ?? "");
        setDiet(u.diet ?? "");
        setInterests(u.interests ?? []);
        setBloodGroup(u.blood_group ?? "");
        setComplexion(u.complexion ?? "");
        setHealthInfo(u.health_info ?? "");
        setCity(u.address?.city ?? "");
        setStateName(u.address?.state ?? "");
        setCountry(u.address?.country ?? "");
        setLatitude(u.latitude ?? u.address?.latitude ?? null);
        setLongitude(u.longitude ?? u.address?.longitude ?? null);
        setPhotos((u.photos ?? []).map((p: any) => p.url));
        dispatch(setUser(u)); // keep the store fresh for the rest of the app
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authToken, dispatch]);

  // ---- DOB calendar ----
  const [showDatePicker, setShowDatePicker] = useState(false);
  const onChangeDate = (event: any, selected?: Date) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
    if (event?.type === "dismissed") return;
    if (selected) setDobDate(selected);
  };

  // ---- Bio modal ----
  const [bioModal, setBioModal] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const openBio = () => { setBioDraft(bio); setBioModal(true); };
  const saveBio = () => {
    setBio(bioDraft.trim());
    persist({ bio: bioDraft.trim() }, () => setBioModal(false));
  };

  // ---- Lifestyle modal ----
  const [lifeModal, setLifeModal] = useState(false);
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [cmText, setCmText] = useState("");
  const [ftText, setFtText] = useState("");
  const [inText, setInText] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [weightText, setWeightText] = useState("");
  const [religionDraft, setReligionDraft] = useState("");
  const [langDraft, setLangDraft] = useState<string[]>([]);
  const [occDraft, setOccDraft] = useState("");
  const [eduDraft, setEduDraft] = useState("");
  const [dietDraft, setDietDraft] = useState("");
  const [interestsDraft, setInterestsDraft] = useState<string[]>([]);
  const [bgDraft, setBgDraft] = useState("");
  const [complexionDraft, setComplexionDraft] = useState("");
  const [healthDraft, setHealthDraft] = useState("");
  const toggleInterest = (v: string) =>
    setInterestsDraft((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const openLifestyle = () => {
    setHeightUnit("cm");
    setCmText(heightCm ? String(heightCm) : "");
    const { ft, inch } = cmToFtIn(heightCm);
    setFtText(heightCm ? String(ft) : "");
    setInText(heightCm ? String(inch) : "");
    setWeightUnit("kg");
    setWeightText(weightKg ? String(weightKg) : "");
    setReligionDraft(religion);
    setLangDraft(languages);
    setOccDraft(occupation);
    setEduDraft(education);
    setDietDraft(diet);
    setInterestsDraft(interests);
    setBgDraft(bloodGroup);
    setComplexionDraft(complexion);
    setHealthDraft(healthInfo);
    setLifeModal(true);
  };

  const toggleLang = (lang: string) => {
    setLangDraft((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  const saveLifestyle = () => {
    // height
    let hcm: number | null = null;
    if (heightUnit === "cm") {
      const n = parseFloat(cmText);
      if (isFinite(n) && n > 0) hcm = Math.round(n);
    } else {
      const f = parseInt(ftText, 10) || 0;
      const i = parseInt(inText, 10) || 0;
      if (f || i) hcm = ftInToCm(f, i);
    }
    // weight
    let wkg: number | null = null;
    const w = parseFloat(weightText);
    if (isFinite(w) && w > 0) wkg = weightUnit === "kg" ? round1(w) : round1(w / 2.20462);

    setHeightCm(hcm);
    setWeightKg(wkg);
    setReligion(religionDraft);
    setLanguages(langDraft);
    setOccupation(occDraft);
    setEducation(eduDraft);
    setDiet(dietDraft);
    setInterests(interestsDraft);
    setBloodGroup(bgDraft);
    setComplexion(complexionDraft);
    setHealthInfo(healthDraft);

    persist(
      {
        height_cm: hcm,
        height_label: heightLabelFrom(hcm),
        weight_kg: wkg,
        religion: religionDraft,
        other_languages: langDraft,
        mother_tongue: langDraft[0] ?? null,
        occupation: occDraft.trim(),
        education: eduDraft.trim(),
        diet: dietDraft || undefined,
        interests: interestsDraft,
        blood_group: bgDraft || undefined,
        complexion: complexionDraft || undefined,
        health_info: healthDraft || undefined,
      },
      () => setLifeModal(false),
    );
  };

  /** Persist a partial patch to the backend and refresh the cached user. */
  const persist = async (partial: any, onDone?: () => void) => {
    if (!authToken) { onDone?.(); return; }
    try {
      setSaving(true);
      const updated = await api.updateProfile(partial, authToken);
      setAuth(authToken, updated);
      onDone?.();
    } catch (e: any) {
      Alert.alert("Could not save", e?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---- photo modals ----
  const [pickerVisible, setPickerVisible] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const openAdd = () => {
    if (photos.length >= 6) { Alert.alert("Limit reached", "You can have up to 6 photos."); return; }
    setReplaceIndex(null);
    setPickerVisible(true);
  };
  const openReplace = (index: number) => { setViewerIndex(null); setReplaceIndex(index); setPickerVisible(true); };

  const pickFrom = async (source: "camera" | "gallery") => {
    setPickerVisible(false);
    if (!authToken) { Alert.alert("Not signed in", "Please log in again."); return; }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"], allowsEditing: true, aspect: [3, 4], quality: 0.9,
    };
    let result: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission needed", "Allow camera access to take a photo."); return; }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (result.canceled) { setReplaceIndex(null); return; }
    const wasReplace = replaceIndex != null;
    try {
      setUploading(true);
      const urls = await api.uploadPhotos([result.assets[0].uri], authToken);
      setPhotos((prev) => {
        if (replaceIndex != null) { const next = [...prev]; next[replaceIndex] = urls[0]; return next; }
        return [...prev, ...urls];
      });
      Alert.alert(
        wasReplace ? "Photo replaced ✅" : "Photo uploaded ✅",
        "Looks great! Tap Save to keep your changes.",
      );
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
    } finally {
      setUploading(false);
      setReplaceIndex(null);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert("Delete photo?", "This photo will be removed from your profile. Save your changes to make it permanent.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { setPhotos((prev) => prev.filter((_, i) => i !== index)); setViewerIndex(null); } },
    ]);
  };
  const makePrimary = (index: number) => {
    setPhotos((prev) => { const next = [...prev]; const [pic] = next.splice(index, 1); next.unshift(pic); return next; });
    setViewerIndex(0);
  };

  const handleSave = async () => {
    if (!authToken) { Alert.alert("Not signed in", "Please log in again to edit your profile."); return; }
    if (!firstName.trim()) { Alert.alert("Name required", "Please enter your name."); return; }
    const payload: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      dob: dobDate ? dobDate.toISOString() : undefined,
      location: location.trim(),
      city: city.trim(),
      state: stateName.trim(),
      country: country.trim(),
      photos,
    };
    if (gender) payload.gender = gender;
    if (latitude != null) payload.latitude = latitude;
    if (longitude != null) payload.longitude = longitude;
    await persist(payload, () => { Alert.alert("Saved", "Your profile has been updated."); router.back(); });
  };

  // ---- display summaries ----
  const heightSummary = heightCm ? heightLabelFrom(heightCm) : "—";
  const weightSummary = weightKg ? `${weightKg} kg (${round1(weightKg * 2.20462)} lbs)` : "—";
  const langSummary = languages.length ? languages.join(", ") : "—";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient colors={[Colors.primary, "#b8007e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable style={styles.headerBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
        </Pressable>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* --- Photos --- */}
        <ProfileSection title="My Photos">
          <Text style={styles.hint}>Tap a photo to view, crop or set as cover.</Text>
          <View style={styles.photoGrid}>
            {photos.map((url, index) => (
              <Pressable key={`${url}-${index}`} style={styles.photoItem} onPress={() => setViewerIndex(index)}>
                <Image source={{ uri: url }} style={styles.photo} />
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Feather name="star" size={11} color="#fff" />
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                )}
              </Pressable>
            ))}
            {photos.length < 6 && (
              <Pressable style={[styles.photoItem, styles.addPhoto]} onPress={openAdd} disabled={uploading}>
                {uploading ? <ActivityIndicator color={Colors.primary} /> : (
                  <><Feather name="plus" size={26} color={Colors.primary} /><Text style={styles.addPhotoText}>Add</Text></>
                )}
              </Pressable>
            )}
          </View>
        </ProfileSection>

        {/* --- Basic Info (DOB via calendar) --- */}
        <ProfileSection title="Basic Info">
          <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <Pressable style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dropdownText, !dobDate && { color: Colors.gray }]}>
                {dobDate ? formatDob(dobDate) : "Select date"}
              </Text>
              <Feather name="calendar" size={20} color={Colors.primary} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipRow options={GENDERS} value={gender} onSelect={setGender} />

          <Pressable style={styles.locationBtn} onPress={useMyLocation} disabled={locating}>
            {locating ? <ActivityIndicator color={Colors.primary} /> : <Feather name="map-pin" size={18} color={Colors.primary} />}
            <Text style={styles.locationBtnText}>
              {latitude != null ? "Update current location" : "Use my current location"}
            </Text>
          </Pressable>
          {latitude != null && (
            <Text style={styles.coordNote}>📍 Coordinates saved — distance search will work.</Text>
          )}

          <Field label="Location" value={location} onChangeText={setLocation} placeholder="City, area" />
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Field label="City" value={city} onChangeText={setCity} placeholder="City" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State" value={stateName} onChangeText={setStateName} placeholder="State" />
            </View>
          </View>
          <Field label="Country" value={country} onChangeText={setCountry} placeholder="Country" />
        </ProfileSection>

        {/* --- About Me (edit icon → modal) --- */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Pressable style={styles.editIcon} onPress={openBio}>
              <Feather name="edit-2" size={16} color={Colors.primary} />
            </Pressable>
          </View>
          <Text style={[styles.bioPreview, !bio && { color: Colors.gray }]}>
            {bio || "Add a bio to tell others about yourself."}
          </Text>
        </View>

        {/* --- Lifestyle & Details (edit icon → modal) --- */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Lifestyle & Details</Text>
            <Pressable style={styles.editIcon} onPress={openLifestyle}>
              <Feather name="edit-2" size={16} color={Colors.primary} />
            </Pressable>
          </View>
          <SummaryRow label="Height" value={heightSummary} />
          <SummaryRow label="Weight" value={weightSummary} />
          <SummaryRow label="Work" value={occupation || "—"} />
          <SummaryRow label="Education" value={education || "—"} />
          <SummaryRow label="Diet" value={diet || "—"} />
          <SummaryRow label="Religion" value={religion || "—"} />
          <SummaryRow label="Languages" value={langSummary} />
          <SummaryRow label="Interests" value={interests.length ? interests.join(", ") : "—"} />
        </View>

        <View style={styles.saveWrap}>
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.saveBtnText}>Save Changes</Text></>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* ===== DOB picker (Android inline dialog / iOS spinner modal) ===== */}
      {showDatePicker && Platform.OS !== "ios" && (
        <DateTimePicker
          value={dobDate ?? new Date(2000, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          onChange={onChangeDate}
        />
      )}
      <Modal visible={showDatePicker && Platform.OS === "ios"} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Date of birth</Text>
            <DateTimePicker
              value={dobDate ?? new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
            <Pressable style={styles.modalPrimaryBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.modalPrimaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ===== Bio modal ===== */}
      <Modal visible={bioModal} transparent animationType="slide" onRequestClose={() => setBioModal(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>About Me</Text>
            <Text style={styles.sheetSub}>Write a short bio others will see</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { marginTop: 8 }]}
              value={bioDraft}
              onChangeText={setBioDraft}
              placeholder="e.g. Coffee lover, weekend traveller, foodie…"
              placeholderTextColor={Colors.gray}
              multiline
              maxLength={500}
              autoFocus
            />
            <Text style={styles.counter}>{bioDraft.length}/500</Text>
            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalGhostBtn} onPress={() => setBioModal(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryBtn} onPress={saveBio} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalPrimaryText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== Lifestyle modal (full screen) ===== */}
      <Modal visible={lifeModal} animationType="slide" onRequestClose={() => setLifeModal(false)}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          <LinearGradient colors={[Colors.primary, "#b8007e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <Pressable style={styles.headerBtn} onPress={() => setLifeModal(false)}>
              <Feather name="x" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Lifestyle & Details</Text>
            <Pressable style={styles.headerBtn} onPress={saveLifestyle} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
            </Pressable>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            {/* Height */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Height</Text>
                <UnitToggle units={["cm", "ft"] as const} value={heightUnit} onChange={setHeightUnit} />
              </View>
              {heightUnit === "cm" ? (
                <TextInput
                  style={styles.input}
                  value={cmText}
                  onChangeText={setCmText}
                  keyboardType="numeric"
                  placeholder="e.g. 173"
                  placeholderTextColor={Colors.gray}
                />
              ) : (
                <View style={styles.twoCol}>
                  <View style={styles.colInput}>
                    <TextInput style={styles.input} value={ftText} onChangeText={setFtText} keyboardType="numeric" placeholder="feet" placeholderTextColor={Colors.gray} />
                    <Text style={styles.unitSuffix}>ft</Text>
                  </View>
                  <View style={styles.colInput}>
                    <TextInput style={styles.input} value={inText} onChangeText={setInText} keyboardType="numeric" placeholder="inches" placeholderTextColor={Colors.gray} />
                    <Text style={styles.unitSuffix}>in</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Weight */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Weight</Text>
                <UnitToggle units={["kg", "lbs"] as const} value={weightUnit} onChange={setWeightUnit} />
              </View>
              <View style={styles.colInput}>
                <TextInput
                  style={styles.input}
                  value={weightText}
                  onChangeText={setWeightText}
                  keyboardType="numeric"
                  placeholder={weightUnit === "kg" ? "e.g. 68" : "e.g. 150"}
                  placeholderTextColor={Colors.gray}
                />
                <Text style={styles.unitSuffix}>{weightUnit}</Text>
              </View>
            </View>

            {/* Religion dropdown */}
            <Dropdown label="Religion" value={religionDraft} options={RELIGIONS} placeholder="Select religion" onSelect={setReligionDraft} />

            {/* Languages multi-select */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Languages you speak (select multiple)</Text>
              <View style={styles.chipRow}>
                {LANGUAGES.map((lang) => {
                  const active = langDraft.includes(lang);
                  return (
                    <Pressable key={lang} onPress={() => toggleLang(lang)} style={[styles.chip, active && styles.chipActive]}>
                      {active && <Feather name="check" size={13} color={Colors.primary} style={{ marginRight: 4 }} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {langDraft.length > 0 && <Text style={styles.counter}>{langDraft.length} selected</Text>}
            </View>

            {/* Occupation & education */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Occupation</Text>
              <TextInput style={styles.input} value={occDraft} onChangeText={setOccDraft} placeholder="e.g. Software Engineer" placeholderTextColor={Colors.gray} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Education</Text>
              <TextInput style={styles.input} value={eduDraft} onChangeText={setEduDraft} placeholder="e.g. Jadavpur University" placeholderTextColor={Colors.gray} />
            </View>

            {/* Diet */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Diet</Text>
              <View style={styles.chipRow}>
                {DIETS.map((d) => {
                  const active = dietDraft === d;
                  return (
                    <Pressable key={d} onPress={() => setDietDraft(active ? "" : d)} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Interests */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Interests (select a few)</Text>
              <View style={styles.chipRow}>
                {INTERESTS.map((it) => {
                  const active = interestsDraft.includes(it);
                  return (
                    <Pressable key={it} onPress={() => toggleInterest(it)} style={[styles.chip, active && styles.chipActive]}>
                      {active && <Feather name="check" size={13} color={Colors.primary} style={{ marginRight: 4 }} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{it}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {interestsDraft.length > 0 && <Text style={styles.counter}>{interestsDraft.length} selected</Text>}
            </View>

            {/* Blood group */}
            <Dropdown label="Blood group" value={bgDraft} options={BLOOD_GROUPS} placeholder="Select blood group" onSelect={setBgDraft} />

            {/* Complexion */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Complexion</Text>
              <View style={styles.chipRow}>
                {COMPLEXIONS.map((c) => {
                  const active = complexionDraft === c;
                  return (
                    <Pressable key={c} onPress={() => setComplexionDraft(active ? "" : c)} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Health */}
            <Dropdown label="Health" value={healthDraft} options={HEALTH_OPTIONS} placeholder="Any health info" onSelect={setHealthDraft} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ===== Add/Replace photo bottom-sheet ===== */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{replaceIndex != null ? "Replace photo" : "Add a photo"}</Text>
            <Text style={styles.sheetSub}>You can crop it after you choose ✂️</Text>
            <View style={styles.sheetOptions}>
              <Pressable style={styles.optionCard} onPress={() => pickFrom("camera")}>
                <LinearGradient colors={["#F43F5E", "#b8007e"]} style={styles.optionIcon}>
                  <Feather name="camera" size={26} color="#fff" />
                </LinearGradient>
                <Text style={styles.optionText}>Camera</Text>
              </Pressable>
              <Pressable style={styles.optionCard} onPress={() => pickFrom("gallery")}>
                <LinearGradient colors={["#8B5CF6", "#06B6D4"]} style={styles.optionIcon}>
                  <Feather name="image" size={26} color="#fff" />
                </LinearGradient>
                <Text style={styles.optionText}>Gallery</Text>
              </Pressable>
            </View>
            <Pressable style={styles.sheetCancel} onPress={() => setPickerVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== Full-screen photo viewer ===== */}
      <Modal visible={viewerIndex != null} transparent animationType="fade" onRequestClose={() => setViewerIndex(null)}>
        <View style={styles.viewerBackdrop}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.viewerHeader}>
              {viewerIndex === 0 && (
                <View style={styles.primaryPill}>
                  <Feather name="star" size={12} color="#fff" />
                  <Text style={styles.primaryPillText}>Cover photo</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)}>
                <Feather name="x" size={24} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.viewerImageWrap}>
              {viewerIndex != null && <Image source={{ uri: photos[viewerIndex] }} style={styles.viewerImage} resizeMode="contain" />}
            </View>
            <View style={styles.viewerActions}>
              {viewerIndex !== 0 && <ActionPill icon="star" label="Make cover" onPress={() => makePrimary(viewerIndex!)} />}
              <ActionPill icon="crop" label="Replace" onPress={() => openReplace(viewerIndex!)} />
              <ActionPill icon="trash-2" label="Delete" danger onPress={() => removePhoto(viewerIndex!)} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Show a Date as DD/MM/YYYY. */
function formatDob(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBtn: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { fontSize: 12.5, color: Colors.gray, marginBottom: 12 },

  field: { marginBottom: 16 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  fieldLabel: { fontSize: 13, color: Colors.darkGray, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#e3e3e3", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.text, backgroundColor: "#fafafa",
  },
  inputMultiline: { minHeight: 110, textAlignVertical: "top" },
  counter: { fontSize: 12, color: Colors.gray, marginTop: 6, textAlign: "right" },
  locationBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 10,
    paddingVertical: 12, backgroundColor: Colors.lightPrimary, marginBottom: 10,
  },
  locationBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  coordNote: { fontSize: 12, color: Colors.primary, marginBottom: 12 },

  // chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#e3e3e3", backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: Colors.lightPrimary, borderColor: Colors.primary },
  chipText: { color: Colors.darkGray, fontSize: 14 },
  chipTextActive: { color: Colors.primary, fontWeight: "700" },

  // dropdown
  dropdown: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#e3e3e3", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#fafafa",
  },
  dropdownText: { fontSize: 15, color: Colors.text },
  dropdownList: {
    borderWidth: 1, borderColor: "#eee", borderRadius: 10, marginTop: 6,
    backgroundColor: "#fff", overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f2f2f2",
  },
  dropdownItemText: { fontSize: 15, color: Colors.text },
  dropdownItemActive: { color: Colors.primary, fontWeight: "700" },

  // unit toggle
  unitToggle: { flexDirection: "row", backgroundColor: "#eee", borderRadius: 20, padding: 3 },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 18 },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitText: { fontSize: 13, fontWeight: "600", color: Colors.darkGray },
  unitTextActive: { color: "#fff" },
  twoCol: { flexDirection: "row", gap: 12 },
  colInput: { flex: 1, position: "relative", justifyContent: "center" },
  unitSuffix: { position: "absolute", right: 12, color: Colors.gray, fontWeight: "600" },

  // section card with edit icon
  sectionCard: {
    backgroundColor: "#fff", padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  editIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.lightPrimary,
    alignItems: "center", justifyContent: "center",
  },
  bioPreview: { fontSize: 14, lineHeight: 21, color: Colors.text },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f4f4f4", gap: 12,
  },
  summaryLabel: { fontSize: 14, color: Colors.darkGray, fontWeight: "600" },
  summaryValue: { fontSize: 14, color: Colors.text, flexShrink: 1, textAlign: "right" },

  // photo grid
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  photoItem: { width: "33.33%", aspectRatio: 3 / 4, padding: 4, position: "relative" },
  photo: { width: "100%", height: "100%", borderRadius: 12 },
  coverBadge: {
    position: "absolute", left: 8, bottom: 8, flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  coverBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  addPhoto: {
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: "dashed", borderRadius: 12,
    justifyContent: "center", alignItems: "center", backgroundColor: Colors.lightPrimary,
  },
  addPhotoText: { color: Colors.primary, fontWeight: "700", fontSize: 12, marginTop: 2 },

  // save button
  saveWrap: { paddingHorizontal: 16, marginTop: 20 },
  saveBtn: {
    flexDirection: "row", gap: 8, backgroundColor: Colors.primary, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // shared modal / bottom sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32,
  },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#e0e0e0", marginBottom: 18 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: Colors.text, textAlign: "center" },
  sheetSub: { fontSize: 13, color: Colors.gray, textAlign: "center", marginTop: 4, marginBottom: 8 },
  sheetOptions: { flexDirection: "row", justifyContent: "center", gap: 40, marginTop: 14, marginBottom: 8 },
  optionCard: { alignItems: "center", gap: 10 },
  optionIcon: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  optionText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  sheetCancel: { marginTop: 22, paddingVertical: 12, alignItems: "center" },
  sheetCancelText: { color: Colors.gray, fontWeight: "600", fontSize: 15 },

  modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  modalGhostBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#f2f2f2" },
  modalGhostText: { color: Colors.darkGray, fontWeight: "700", fontSize: 15 },
  modalPrimaryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.primary, marginTop: 8,
  },
  modalPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // full-screen viewer
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)" },
  viewerHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  primaryPill: {
    flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  primaryPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  viewerClose: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  viewerImageWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  viewerImage: { width: "100%", height: "100%", borderRadius: 14 },
  viewerActions: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 22, paddingHorizontal: 24 },
  actionPill: { alignItems: "center", gap: 8 },
  actionPillIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
  actionPillIconDanger: { backgroundColor: Colors.error },
  actionPillLabel: { color: "#fff", fontSize: 12.5, fontWeight: "600" },
});
