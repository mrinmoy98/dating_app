import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type ConnectionUser } from "../../lib/api";

export default function ConnectionsScreen() {
  const router = useRouter();
  const { authToken } = useRegistration();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<"following" | "followers">(
    params.tab === "followers" ? "followers" : "following",
  );
  const [following, setFollowing] = useState<ConnectionUser[]>([]);
  const [followers, setFollowers] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!authToken) return;
    setLoading(true);
    Promise.all([api.following(authToken), api.followers(authToken)])
      .then(([f1, f2]) => {
        setFollowing(f1 || []);
        setFollowers(f2 || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const unfollow = async (u: ConnectionUser) => {
    if (!authToken) return;
    setFollowing((prev) => prev.filter((x) => x.id !== u.id));
    await api.unfollow(u.id, authToken).catch(() => load());
  };

  const data = tab === "following" ? following : followers;

  const renderItem = ({ item }: { item: ConnectionUser }) => (
    <Pressable style={styles.row} onPress={() => router.push(`/user/${item.id}` as any)}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{(item.firstName || "?").charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>
          {item.firstName} {item.lastName || ""}
          {item.age ? `, ${item.age}` : ""}
        </Text>
        {!!item.location && <Text style={styles.rowSub}>{item.location}</Text>}
      </View>
      {tab === "following" ? (
        <Pressable style={styles.unfollowBtn} onPress={() => unfollow(item)}>
          <Text style={styles.unfollowText}>Following</Text>
        </Pressable>
      ) : (
        <Feather name="chevron-right" size={20} color={Colors.gray} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient colors={[Colors.primary, "#b8007e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <View style={styles.tabs}>
        {(["following", "followers"] as const).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "following" ? `Following (${following.length})` : `Followers (${followers.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === "following" ? "You're not following anyone yet." : "No followers yet."}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  headerBtn: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { color: Colors.darkGray, fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", padding: 12, borderRadius: 14, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#eee" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.lightPrimary },
  avatarInitial: { color: Colors.primary, fontWeight: "700", fontSize: 20 },
  rowName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  rowSub: { fontSize: 13, color: Colors.darkGray, marginTop: 2 },
  unfollowBtn: { borderWidth: 1, borderColor: Colors.primary, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  unfollowText: { color: Colors.primary, fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", color: Colors.darkGray, marginTop: 40 },
});
