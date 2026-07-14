import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type UserProfile } from "../../lib/api";

const { width } = Dimensions.get("window");

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authToken } = useRegistration();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!authToken || !id) return;
    setLoading(true);
    api
      .getProfile(String(id), authToken)
      .then(setProfile)
      .catch((e) => Alert.alert("Could not load profile", e?.message ?? "Try again."))
      .finally(() => setLoading(false));
  }, [authToken, id]);

  const toggleFollow = async () => {
    if (!profile || !authToken) return;
    setBusy(true);
    const wasFollowing = profile.is_following;
    try {
      if (wasFollowing) await api.unfollow(profile.id, authToken);
      else await api.follow(profile.id, authToken);
      setProfile({
        ...profile,
        is_following: !wasFollowing,
        followers_count: profile.followers_count + (wasFollowing ? -1 : 1),
      });
    } catch (e: any) {
      Alert.alert("Something went wrong", e?.message ?? "Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!profile) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: Colors.darkGray }}>Profile not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: Colors.primary, marginTop: 10, fontWeight: "600" }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const photos = profile.photos?.length ? profile.photos : profile.photoUrl ? [profile.photoUrl] : [];
  const details = [
    profile.occupation && { icon: "briefcase", text: profile.occupation },
    profile.education && { icon: "book", text: profile.education },
    profile.location && { icon: "map-pin", text: profile.location },
    profile.height_label && { icon: "trending-up", text: profile.height_label },
    profile.religion && { icon: "sunrise", text: profile.religion },
  ].filter(Boolean) as { icon: any; text: string }[];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View>
          <Image source={{ uri: photos[photoIndex] }} style={styles.cover} />
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <Pressable key={i} onPress={() => setPhotoIndex(i)} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}
          <SafeAreaView edges={["top"]} style={styles.topBar}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </Pressable>
            {profile.is_matched && (
              <View style={styles.matchPill}>
                <Feather name="heart" size={12} color="#fff" />
                <Text style={styles.matchPillText}>Matched</Text>
              </View>
            )}
          </SafeAreaView>
        </View>

        {/* Info */}
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.firstName} {profile.lastName || ""}
              {profile.age ? `, ${profile.age}` : ""}
            </Text>
            {profile.verified && (
              <View style={styles.verified}><Text style={styles.verifiedTick}>✓</Text></View>
            )}
          </View>

          {/* Counts */}
          <View style={styles.counts}>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{profile.followers_count}</Text>
              <Text style={styles.countLabel}>Followers</Text>
            </View>
            <View style={styles.countDivider} />
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{profile.following_count}</Text>
              <Text style={styles.countLabel}>Following</Text>
            </View>
          </View>

          {/* Follow button */}
          {!profile.is_me && (
            <Pressable
              style={[styles.followBtn, profile.is_following && styles.followingBtn]}
              onPress={toggleFollow}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={profile.is_following ? Colors.primary : "#fff"} />
              ) : (
                <>
                  <Feather
                    name={profile.is_following ? "user-check" : "user-plus"}
                    size={18}
                    color={profile.is_following ? Colors.primary : "#fff"}
                  />
                  <Text style={[styles.followText, profile.is_following && styles.followingText]}>
                    {profile.is_following ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* About */}
          {!!profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          )}

          {/* Details */}
          {details.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              {details.map((d, i) => (
                <View key={i} style={styles.detailRow}>
                  <Feather name={d.icon} size={16} color={Colors.primary} />
                  <Text style={styles.detailText}>{d.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.chips}>
                {profile.interests.map((it, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{it}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  cover: { width, height: width * 1.1, backgroundColor: "#eee" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  matchPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, alignSelf: "center" },
  matchPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  dots: { position: "absolute", bottom: 14, width: "100%", flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#fff", width: 20 },
  body: { padding: 20 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 24, fontWeight: "800", color: Colors.text },
  verified: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  verifiedTick: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  counts: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 16 },
  countItem: { alignItems: "center", paddingRight: 24 },
  countDivider: { width: 1, height: 30, backgroundColor: "#eee", marginRight: 24 },
  countValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  countLabel: { fontSize: 12, color: Colors.darkGray },
  followBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, paddingVertical: 13, borderRadius: 12 },
  followingBtn: { backgroundColor: Colors.lightPrimary },
  followText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  followingText: { color: Colors.primary },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  bio: { fontSize: 14, lineHeight: 22, color: Colors.text },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  detailText: { fontSize: 14, color: Colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: Colors.lightPrimary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
});
