import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api } from "../../lib/api";

type Tab = "sent" | "received";

export default function LikesScreen() {
  const router = useRouter();
  const { authToken } = useRegistration();
  const [tab, setTab] = useState<Tab>("sent");
  const [sent, setSent] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!authToken) return;
    setLoading(true);
    Promise.all([
      api.myLikes(authToken).catch(() => []),
      api.likedMe(authToken).catch(() => []),
    ])
      .then(([s, r]) => {
        setSent(s || []);
        setReceived(r || []);
      })
      .finally(() => setLoading(false));
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  const data = tab === "sent" ? sent : received;

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => router.push(`/user/${item.id}` as any)}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Text style={styles.initial}>{(item.firstName || "?").charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.shade}>
        <Text style={styles.name} numberOfLines={1}>
          {item.firstName}
          {item.age ? `, ${item.age}` : ""}
        </Text>
        {!!item.location && (
          <Text style={styles.loc} numberOfLines={1}>
            {item.location}
          </Text>
        )}
      </LinearGradient>
      {tab === "received" && (
        <View style={styles.likeBadge}>
          <Feather name="heart" size={12} color="#fff" />
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={[Colors.primary, "#b8007e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Likes</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <View style={styles.tabs}>
        {(["sent", "received"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "sent" ? `I liked (${sent.length})` : `Liked me (${received.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(u, i) => `${u.id}-${i}`}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === "sent"
                ? "You haven't liked anyone yet. Swipe right in Discover!"
                : "No one has liked you yet — keep your profile fresh!"}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { color: Colors.darkGray, fontWeight: "600", fontSize: 13.5 },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },

  card: { flex: 1, aspectRatio: 3 / 4, borderRadius: 14, overflow: "hidden", backgroundColor: "#eee" },
  photo: { width: "100%", height: "100%" },
  photoFallback: { backgroundColor: Colors.lightPrimary, alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 40, fontWeight: "800", color: Colors.primary },
  shade: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 30 },
  name: { color: "#fff", fontWeight: "700", fontSize: 14 },
  loc: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
  likeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { textAlign: "center", color: Colors.gray, marginTop: 50, paddingHorizontal: 30, lineHeight: 20 },
});
