import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import { FieldError, FieldLabel } from "../components/Shared/FormField";
import IntroNav from "../components/Shared/IntroNav";
import ProgressBar from "../components/Shared/ProgressBar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FaceRevealScreen() {
  const router = useRouter();
  const { data, registrationToken, setAuth } = useRegistration();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const handleFinish = async () => {
    if (!registrationToken) {
      setError("Session expired. Please verify your phone number again.");
      router.replace("/(auth)/PhoneScreen");
      return;
    }
    const uris = images.filter((u): u is string => !!u);
    if (uris.length < 1) {
      setError("This field is required — add at least one photo");
      return;
    }
    setError(null);
    try {
      setSubmitting(true);
      const photoUrls = await api.uploadPhotos(uris, registrationToken);
      const res = await api.register(
        {
          // Forward EVERYTHING collected across the onboarding screens
          // (last_name, city, state, country, latitude/longitude, etc.),
          // then set the required/computed fields.
          ...data,
          first_name: (data.first_name as string) || "New User",
          photos: photoUrls,
        },
        registrationToken,
      );
      setAuth(res.token, res.user);
      router.replace("/(tabs)/Discover");
    } catch (e: any) {
      setError(e?.message ?? "Could not complete registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  //   const pickImage = async (index) => {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       quality: 1,
  //     });

  //     if (!result.canceled) {
  //       const updated = [...images];
  //       updated[index] = result.assets[0].uri;
  //       setImages(updated);
  //     }
  //   };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const updated = [...images];
      updated[index] = result.assets[0].uri;
      setImages(updated);
    }
  };

  const guidelines = [
    "At least 1 photo is required (add up to 4)",
    "Use bright photos that show your smile",
    "Avoid blurry photos",
    "Avoid filters, show others the real you",
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <ProgressBar />
        <Text style={styles.title}>Time for a face reveal!</Text>
        <FieldLabel required>Photos</FieldLabel>

        <View style={styles.grid}>
          {images.map((img, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.imageBox, !!error && !img && styles.imageBoxError]}
              onPress={() => {
                setError(null);
                pickImage(index);
              }}
            >
              {img ? (
                <Image source={{ uri: img }} style={styles.image} />
              ) : (
                <MaterialIcons name="add" size={32} color="#aaa" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <FieldError>{error}</FieldError>

        <View style={styles.guidelines}>
          {guidelines.map((tip, i) => (
            <Text key={i} style={styles.bullet}>
              • {tip}
            </Text>
          ))}
        </View>

        <IntroNav onNext={handleFinish} loading={submitting} />
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 24,

    position: "relative",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageBox: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#eee",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  imageBoxError: {
    borderWidth: 1.5,
    borderColor: "#ef4444",
    backgroundColor: "#fff5f5",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  guidelines: {
    marginTop: 10,
  },
  bullet: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#8e276d",
    padding: 18,
    borderRadius: 30,
    elevation: 5,
  },
});
