import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";
import IntroNav from "../components/Shared/IntroNav";
import ProgressBar from "../components/Shared/ProgressBar";

export default function VideoProfileScreen() {
  const router = useRouter();
  const { registrationToken, data, patch } = useRegistration();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
    setVideoUri(uri);

    if (!registrationToken) {
      Alert.alert("Session expired", "Please verify your phone number again.");
      router.replace("/(auth)/PhoneScreen");
      return;
    }
    try {
      setUploading(true);
      const url = await api.uploadVideo(uri, registrationToken);
      patch({ video_url: url }); // stored so the final register call includes it
      Alert.alert("Video uploaded ✅", "Your intro video was added successfully.");
    } catch (e: any) {
      Alert.alert("Video upload failed", e?.message ?? "Please try again.");
      setVideoUri(null);
    } finally {
      setUploading(false);
    }
  };

  const goNext = () => router.push("/(intro)/FaceRevealScreen");

  return (
    <View style={styles.container}>
      <ProgressBar />
      <Text style={styles.title}>Add a video profile</Text>
      <Text style={styles.subtitle}>
        A short intro video helps you stand out. This step is optional — you can skip it.
      </Text>

      <TouchableOpacity style={styles.videoBox} onPress={pickVideo} activeOpacity={0.85}>
        {videoUri ? (
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            isLooping
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="videocam" size={40} color="#8d2561" />
            <Text style={styles.placeholderText}>Tap to record / upload a video</Text>
          </View>
        )}
        {uploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.uploadingText}>Uploading…</Text>
          </View>
        )}
      </TouchableOpacity>

      {!!data.video_url && !uploading && (
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
          <Text style={styles.doneText}>Video uploaded</Text>
        </View>
      )}

      <IntroNav onNext={goNext} nextDisabled={uploading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 90 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 8, color: "#111" },
  subtitle: { fontSize: 15, color: "#777", marginBottom: 24 },
  videoBox: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#f2f2f2",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", gap: 10 },
  placeholderText: { color: "#888", fontSize: 14 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  uploadingText: { color: "#fff", fontWeight: "600" },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  doneText: { color: "#2e7d32", fontWeight: "600" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingBottom: 10,
  },
  skipText: { color: "#8d2561", fontWeight: "600", fontSize: 16 },
  fab: { backgroundColor: "#8e276d", borderRadius: 30, padding: 18, elevation: 5 },
});
