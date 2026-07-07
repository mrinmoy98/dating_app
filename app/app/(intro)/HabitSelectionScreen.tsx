import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Button } from "react-native-paper";
import { useRegistration } from "../../context/RegistrationContext";

export default function HabitSelectionScreen() {
  const router = useRouter();
  const { patch } = useRegistration();
  const [smoking, setSmoking] = useState<string | null>(null);
  const [drinking, setDrinking] = useState<string | null>(null);

  const handleContinue = () => {
    patch({
      smoking: (smoking as any) ?? undefined,
      drinking: (drinking as any) ?? undefined,
    });
    router.push('/(intro)/RelationshipGoalsScreen');
  };

  const renderOptions = (
    selected: string | null,
    setSelected: React.Dispatch<React.SetStateAction<string | null>>,
    type: "smoking" | "drinking"
  ) => {
    const options = ["Regularly", "Sometimes", "Never"];

    return options.map((option) => {
      const isSelected = selected === option;

      return (
        <TouchableOpacity
          key={option}
          activeOpacity={0.8}
          style={[
            styles.optionButton,
            isSelected && styles.selectedOption,
          ]}
          onPress={() => {
            console.log(`${type} selected: ${option}`);
            setSelected(option);
          }}
        >
          <Text
            style={[
              styles.optionText,
              isSelected && styles.selectedText,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.progressBar} />

      <Text style={styles.heading}>Let’s talk about your habits</Text>
      <Text style={styles.subheading}>
        Select the option that resonates with you.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cafe-outline" size={20} color="#8D2561" />
          <Text style={styles.label}>Smoking</Text>
        </View>
        <View style={styles.optionsContainer}>
          {renderOptions(smoking, setSmoking, "smoking")}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="wine-outline" size={20} color="#8D2561" />
          <Text style={styles.label}>Drinking</Text>
        </View>
        <View style={styles.optionsContainer}>
          {renderOptions(drinking, setDrinking, "drinking")}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color="#555" />
        <Text style={styles.infoText}>
          You can always edit this in your profile.
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={handleContinue}
        style={styles.continueButton}
        contentStyle={{ paddingVertical: 10 }}
        labelStyle={{ fontWeight: "bold", fontSize: 16 }}
      >
        Continue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingTop:90
  },
  progressBar: {
    height: 4,
    backgroundColor: "#8D2561",
    width: "30%",
    borderRadius: 4,
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  subheading: {
    color: "#777",
    fontSize: 15,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  selectedOption: {
    backgroundColor: "#8D2561",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 30,
  },
  infoText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 13,
  },
  continueButton: {
    borderRadius: 30,
    backgroundColor: "#8D2561",
  },
});
