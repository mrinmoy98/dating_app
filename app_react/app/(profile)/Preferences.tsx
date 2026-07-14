import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import ProfileSection from "../components/ProfileSection";

const GENDERS = ["Male", "Female", "Other"];
const RELIGIONS = [
  "Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain",
  "Jewish", "Parsi", "Spiritual", "Atheist", "Other",
];
const GOALS = ["Long-term", "Short-term", "Casual", "New friends", "Not sure yet"];
const MARITAL = ["Single", "Never married", "Divorced", "Widowed", "Separated"];

/** Multi-select chip row. */
function MultiChips({
  options, selected, onToggle,
}: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable key={opt} onPress={() => onToggle(opt)} style={[styles.chip, active && styles.chipActive]}>
            {active && <Feather name="check" size={13} color={Colors.primary} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small +/- stepper for numeric values. */
function Stepper({
  value, onChange, min, max, step = 1, suffix,
}: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value - step))}>
        <Feather name="minus" size={18} color={Colors.primary} />
      </Pressable>
      <Text style={styles.stepValue}>{value}{suffix ? ` ${suffix}` : ""}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value + step))}>
        <Feather name="plus" size={18} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const { user, authToken, setAuth } = useRegistration();
  const p = user?.preferences ?? {};

  // Default the "show me" gender to the opposite of the user's own gender.
  const defaultInterested =
    user?.gender === "Male" ? ["Female"] : user?.gender === "Female" ? ["Male"] : [];

  const [interestedIn, setInterestedIn] = useState<string[]>(
    p.interested_in?.length ? p.interested_in : defaultInterested,
  );
  const [ageMin, setAgeMin] = useState<number>(p.age_min ?? 18);
  const [ageMax, setAgeMax] = useState<number>(p.age_max ?? 60);
  const [distance, setDistance] = useState<number>(p.max_distance_km ?? 100);
  const [religions, setReligions] = useState<string[]>(p.preferred_religions ?? []);
  const [goal, setGoal] = useState<string | null>(p.relationship_goal ?? null);
  const [marital, setMarital] = useState<string[]>(p.marital_status ?? []);
  // Height/weight ranges are opt-in so we don't accidentally exclude everyone.
  const [heightOn, setHeightOn] = useState<boolean>(p.min_height_cm != null || p.max_height_cm != null);
  const [minHeight, setMinHeight] = useState<number>(p.min_height_cm ?? 150);
  const [maxHeight, setMaxHeight] = useState<number>(p.max_height_cm ?? 190);
  const [weightOn, setWeightOn] = useState<boolean>(p.min_weight_kg != null || p.max_weight_kg != null);
  const [minWeight, setMinWeight] = useState<number>(p.min_weight_kg ?? 45);
  const [maxWeight, setMaxWeight] = useState<number>(p.max_weight_kg ?? 90);
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const resetAll = () => {
    Alert.alert("Reset preferences?", "All filters go back to default.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setInterestedIn(defaultInterested);
          setAgeMin(18);
          setAgeMax(60);
          setDistance(100);
          setReligions([]);
          setGoal(null);
          setMarital([]);
          setHeightOn(false);
          setMinHeight(150);
          setMaxHeight(190);
          setWeightOn(false);
          setMinWeight(45);
          setMaxWeight(90);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (ageMin > ageMax) {
      Alert.alert("Invalid age range", "Minimum age can't be greater than maximum age.");
      return;
    }
    if (!authToken) {
      Alert.alert("Not signed in", "Please log in again.");
      return;
    }
    if (heightOn && minHeight > maxHeight) {
      Alert.alert("Invalid height range", "Minimum height can't be greater than maximum.");
      return;
    }
    if (weightOn && minWeight > maxWeight) {
      Alert.alert("Invalid weight range", "Minimum weight can't be greater than maximum.");
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        interested_in: interestedIn,
        age_min: ageMin,
        age_max: ageMax,
        max_distance_km: distance,
        preferred_religions: religions,
        relationship_goal: goal ?? undefined,
        marital_status: marital,
        min_height_cm: heightOn ? minHeight : null,
        max_height_cm: heightOn ? maxHeight : null,
        min_weight_kg: weightOn ? minWeight : null,
        max_weight_kg: weightOn ? maxWeight : null,
      };
      const updated = await api.updatePreferences(payload, authToken);
      setAuth(authToken, updated);
      Alert.alert("Preferences saved ✅", "We'll use these to find your matches.");
      router.back();
    } catch (e: any) {
      Alert.alert("Could not save", e?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        translucent={false}
        backgroundColor="#fff"
        barStyle="dark-content"
      />
      <LinearGradient colors={[Colors.primary, "#b8007e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.resetBtn} onPress={resetAll}>
            <Feather name="rotate-ccw" size={16} color="#fff" />
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ProfileSection title="Show me">
          <Text style={styles.hint}>
            {user?.gender
              ? `Defaults to ${user.gender === "Male" ? "Female" : user.gender === "Female" ? "Male" : "everyone"} for you. Tap to change.`
              : "Which genders do you want to see? (none = everyone)"}
          </Text>
          <MultiChips options={GENDERS} selected={interestedIn} onToggle={(v) => toggle(interestedIn, setInterestedIn, v)} />
        </ProfileSection>

        <ProfileSection title="Age range">
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Minimum</Text>
            <Stepper value={ageMin} onChange={setAgeMin} min={18} max={100} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Maximum</Text>
            <Stepper value={ageMax} onChange={setAgeMax} min={18} max={100} />
          </View>
          <Text style={styles.summaryLine}>Between {ageMin} and {ageMax} years</Text>
        </ProfileSection>

        <ProfileSection title="Maximum distance">
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Within</Text>
            <Stepper value={distance} onChange={setDistance} min={1} max={500} step={5} suffix="km" />
          </View>
        </ProfileSection>

        <ProfileSection title="Marital status (optional)">
          <Text style={styles.hint}>Leave empty to match any.</Text>
          <MultiChips options={MARITAL} selected={marital} onToggle={(v) => toggle(marital, setMarital, v)} />
        </ProfileSection>

        <ProfileSection title="Height range (optional)">
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Filter by height</Text>
            <Switch
              value={heightOn}
              onValueChange={setHeightOn}
              trackColor={{ false: "#D1D1D6", true: Colors.lightPrimary }}
              thumbColor={heightOn ? Colors.primary : "#FFFFFF"}
            />
          </View>
          {heightOn && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Minimum</Text>
                <Stepper value={minHeight} onChange={setMinHeight} min={120} max={220} suffix="cm" />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Maximum</Text>
                <Stepper value={maxHeight} onChange={setMaxHeight} min={120} max={220} suffix="cm" />
              </View>
            </>
          )}
        </ProfileSection>

        <ProfileSection title="Weight range (optional)">
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Filter by weight</Text>
            <Switch
              value={weightOn}
              onValueChange={setWeightOn}
              trackColor={{ false: "#D1D1D6", true: Colors.lightPrimary }}
              thumbColor={weightOn ? Colors.primary : "#FFFFFF"}
            />
          </View>
          {weightOn && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Minimum</Text>
                <Stepper value={minWeight} onChange={setMinWeight} min={30} max={150} step={2} suffix="kg" />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Maximum</Text>
                <Stepper value={maxWeight} onChange={setMaxWeight} min={30} max={150} step={2} suffix="kg" />
              </View>
            </>
          )}
        </ProfileSection>

        <ProfileSection title="Relationship goal (optional)">
          <View style={styles.chipRow}>
            {GOALS.map((g) => {
              const active = goal === g;
              return (
                <Pressable key={g} onPress={() => setGoal(active ? null : g)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
        </ProfileSection>

        <ProfileSection title="Preferred religion (optional)">
          <Text style={styles.hint}>Leave empty to match any religion.</Text>
          <MultiChips options={RELIGIONS} selected={religions} onToggle={(v) => toggle(religions, setReligions, v)} />
        </ProfileSection>

        <View style={styles.saveWrap}>
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <><Feather name="check" size={20} color="#fff" /><Text style={styles.saveBtnText}>Save Preferences</Text></>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", },
  // container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerBtn: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  resetText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { fontSize: 12.5, color: Colors.gray, marginBottom: 10 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#e3e3e3", backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: Colors.lightPrimary, borderColor: Colors.primary },
  chipText: { color: Colors.darkGray, fontSize: 14 },
  chipTextActive: { color: Colors.primary, fontWeight: "700" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  rowLabel: { fontSize: 15, color: Colors.text, fontWeight: "600" },
  summaryLine: { fontSize: 13, color: Colors.primary, fontWeight: "600", marginTop: 2 },

  stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.primary,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.lightPrimary,
  },
  stepValue: { fontSize: 16, fontWeight: "700", color: Colors.text, minWidth: 70, textAlign: "center" },

  saveWrap: { paddingHorizontal: 16, marginTop: 20 },
  saveBtn: {
    flexDirection: "row", gap: 8, backgroundColor: Colors.primary, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
