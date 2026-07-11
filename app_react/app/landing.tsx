import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  View
} from "react-native";
import Button from "./components/Shared/Button";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  const router = useRouter()
  return (
    // <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
    <View style={styles.container}>
      <Video
        source={{
          uri: "https://videos.pexels.com/video-files/9431531/9431531-uhd_1440_2560_24fps.mp4",
        }} // Replace with your own video URL
        rate={1.0}
        volume={0.0}
        isMuted
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        style={[{ ...StyleSheet.absoluteFillObject, opacity: 0.3 }]}
      />

      <View style={styles.overlay}>
        <Text style={styles.logo}>aisle</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>4.5</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>20M+</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Curated Profiles</Text>
          </View>
        </View>

        <Text style={styles.title}>Nothing casual about this dating app</Text>

        {/* <Button text="Get Started" onPress={()=> router.push('/(auth)/PhoneScreen')} /> */}
        <View style={styles.buttonContainer}>
          <Button
            text="Get Started"
            onPress={() => router.push("/(auth)/PhoneScreen")}
          />
        </View>

        <Text style={styles.loginLink} onPress={() => router.push('/(auth)/PasswordLoginScreen')}>
          Already have an account? <Text style={styles.loginLinkBold}>Log in</Text>
        </Text>

        <Text style={styles.disclaimer}>
          By signing up, you agree to our{" "}
          <Text style={styles.link} onPress={() => Linking.openURL("#")}>
            Terms
          </Text>
          . See how we use your data in our{" "}
          <Text style={styles.link} onPress={() => Linking.openURL("#")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  buttonContainer: {
    width: "100%",
    marginVertical: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textTransform: "lowercase",
    fontFamily: "sans-serif-condensed",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 15,
  },
  loginLink: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
  },
  loginLinkBold: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  disclaimer: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    textDecorationLine: "underline",
    color: "#fff",
  },
});
