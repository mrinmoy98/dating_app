import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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
const PHOTO_HEIGHT = width * 1.15;

/** One "label: value" row inside a details card. */
function DetailRow({ icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={16} color={Colors.primary} style={{ width: 22 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authToken } = useRegistration();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

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
      // Re-fetch so is_friend / counts stay correct.
      const fresh = await api.getProfile(profile.id, authToken);
      setProfile(fresh);
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
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const photos = profile.photos?.length
    ? profile.photos
    : profile.photoUrl
      ? [profile.photoUrl]
      : [];

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const place = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const languages = [profile.mother_tongue, ...(profile.other_languages ?? [])]
    .filter(Boolean)
    .join(", ");
  const weight = profile.weight_kg ? `${profile.weight_kg} kg` : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ---------- Swipeable photo carousel ---------- */}
        <View>
          {photos.length > 0 ? (
            <FlatList
              ref={listRef}
              data={photos}
              keyExtractor={(u, i) => `${u}-${i}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
              )}
            />
          ) : (
            <View style={[styles.photo, styles.photoFallback]}>
              <Text style={styles.photoInitial}>
                {(profile.firstName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Slide indicator bars */}
          {photos.length > 1 && (
            <View style={styles.bars}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.bar, i === photoIndex && styles.barActive]} />
              ))}
            </View>
          )}

          {/* Photo counter */}
          {photos.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {photoIndex + 1}/{photos.length}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={styles.topShade}
            pointerEvents="none"
          />
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

        {/* ---------- Header info ---------- */}
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {fullName}
              {profile.age ? `, ${profile.age}` : ""}
            </Text>
            {profile.verified && (
              <View style={styles.verified}>
                <Text style={styles.verifiedTick}>✓</Text>
              </View>
            )}
          </View>
          {!!(place || profile.location) && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={Colors.darkGray} />
              <Text style={styles.locationText}>{place || profile.location}</Text>
            </View>
          )}

          {/* Follower counts */}
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

          {/* Follow + friend actions */}
          {!profile.is_me && (
            <>
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

              {profile.is_friend ? (
                <View style={styles.friendRow}>
                  <Pressable
                    style={styles.friendBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/chat/[id]",
                        params: { id: profile.id, name: fullName, photo: profile.photoUrl ?? "" },
                      } as any)
                    }
                  >
                    <Feather name="message-circle" size={18} color={Colors.primary} />
                    <Text style={styles.friendBtnText}>Message</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.friendBtn, styles.friendBtnFilled]}
                    onPress={() =>
                      router.push({
                        pathname: "/call/[id]",
                        params: { id: profile.id, name: fullName, photo: profile.photoUrl ?? "" },
                      } as any)
                    }
                  >
                    <Feather name="video" size={18} color="#fff" />
                    <Text style={[styles.friendBtnText, { color: "#fff" }]}>Video call</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.lockNote}>
                  {profile.follows_me
                    ? "They follow you — follow back to unlock chat & video call."
                    : "Chat & video call unlock when you follow each other."}
                </Text>
              )}
            </>
          )}

          {/* ---------- About ---------- */}
          {!!profile.bio && (
            <Section title="About">
              <Text style={styles.bio}>{profile.bio}</Text>
            </Section>
          )}

          {/* ---------- Basics ---------- */}
          <Section title="Basics">
            <DetailRow icon="user" label="Gender" value={profile.gender} />
            <DetailRow icon="heart" label="Status" value={profile.relationship_status} />
            <DetailRow icon="target" label="Looking for" value={profile.relationship_goal} />
            <DetailRow icon="trending-up" label="Height" value={profile.height_label} />
            <DetailRow icon="activity" label="Weight" value={weight} />
            <DetailRow icon="droplet" label="Blood group" value={profile.blood_group} />
          </Section>

          {/* ---------- Work & education ---------- */}
          {(profile.occupation || profile.education) && (
            <Section title="Work & Education">
              <DetailRow icon="briefcase" label="Work" value={profile.occupation} />
              <DetailRow icon="book-open" label="Education" value={profile.education} />
            </Section>
          )}

          {/* ---------- Lifestyle ---------- */}
          {(profile.religion || languages || profile.diet || profile.smoking || profile.drinking) && (
            <Section title="Lifestyle">
              <DetailRow icon="sunrise" label="Religion" value={profile.religion} />
              <DetailRow icon="message-square" label="Languages" value={languages} />
              <DetailRow icon="coffee" label="Diet" value={profile.diet} />
              <DetailRow icon="wind" label="Smoking" value={profile.smoking} />
              <DetailRow icon="droplet" label="Drinking" value={profile.drinking} />
            </Section>
          )}

          {/* ---------- Interests ---------- */}
          {profile.interests?.length > 0 && (
            <Section title="Interests">
              <View style={styles.chips}>
                {profile.interests.map((it, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{it}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", gap: 8 },
  backLink: { color: Colors.primary, marginTop: 10, fontWeight: "600" },

  photo: { width, height: PHOTO_HEIGHT, backgroundColor: "#eee" },
  photoFallback: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.lightPrimary },
  photoInitial: { fontSize: 80, fontWeight: "800", color: Colors.primary },
  bars: { position: "absolute", top: 10, left: 12, right: 12, flexDirection: "row", gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" },
  barActive: { backgroundColor: "#fff" },
  counter: {
    position: "absolute", bottom: 14, right: 14,
    backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  matchPill: {
    flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
  },
  matchPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  body: { padding: 20 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 24, fontWeight: "800", color: Colors.text },
  verified: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  verifiedTick: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  locationText: { color: Colors.darkGray, fontSize: 14 },

  counts: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 16 },
  countItem: { alignItems: "center", paddingRight: 24 },
  countDivider: { width: 1, height: 30, backgroundColor: "#eee", marginRight: 24 },
  countValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  countLabel: { fontSize: 12, color: Colors.darkGray },

  followBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 13, borderRadius: 12,
  },
  followingBtn: { backgroundColor: Colors.lightPrimary },
  followText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  followingText: { color: Colors.primary },
  friendRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  friendBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 12,
  },
  friendBtnFilled: { backgroundColor: Colors.primary },
  friendBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  lockNote: { marginTop: 10, fontSize: 12.5, color: Colors.gray, textAlign: "center", lineHeight: 18 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  card: {
    backgroundColor: "#fafafb", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#f0f0f2",
  },
  bio: { fontSize: 14, lineHeight: 22, color: Colors.text },
  detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  detailLabel: { fontSize: 13.5, color: Colors.darkGray, width: 96 },
  detailValue: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: Colors.lightPrimary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
});
