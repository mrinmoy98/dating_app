import Colors from "@/data/Colors";
import { mockMatches } from "@/utils/mockData";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type ConnectionUser } from "../../lib/api";
import { confirmAction } from "../../lib/confirm";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchMatches } from "../../store/slices/matchSlice";
import MatchCard from "../components/MatchCard";
import AppHeader from "../components/Shared/AppHeader";
import PressableScale from "../components/Shared/PressableScale";
import Typography from "../components/Shared/Typography";

interface MatchItem {
  id: number | string;
  photoUrl: string;
  firstName: string;
  matchedOn?: string;
  // add other fields if needed
}

type Tab = "matches" | "following" | "followers" | "new" | "interest";

const TABS: { key: Tab; label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
  { key: "new", label: "New" },
  { key: "interest", label: "Interests" },
];

export default function MatchesScreen() {
  const dispatch = useAppDispatch();
  const { authToken } = useRegistration();
  const { matches, loading } = useAppSelector((s) => s.match);

  const [tab, setTab] = useState<Tab>("matches");
  const [following, setFollowing] = useState<ConnectionUser[]>([]);
  const [followers, setFollowers] = useState<ConnectionUser[]>([]);
  const [newUsers, setNewUsers] = useState<ConnectionUser[]>([]);
  const [interest, setInterest] = useState<ConnectionUser[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Load real matches whenever we're logged in (refreshes on focus via re-mount).
  useEffect(() => {
    if (authToken) dispatch(fetchMatches(authToken));
  }, [authToken, dispatch]);

  /** Follow list, follower list and the two discovery lists. */
  const loadPeople = useCallback(() => {
    if (!authToken) return;
    setPeopleLoading(true);
    Promise.all([
      api.following(authToken).catch(() => []),
      api.followers(authToken).catch(() => []),
      api.newUsers(authToken).catch(() => []),
      api.byInterest(authToken).catch(() => []),
    ])
      .then(([f1, f2, n, i]) => {
        setFollowing(f1 || []);
        setFollowers(f2 || []);
        setNewUsers(n || []);
        setInterest(i || []);
      })
      .finally(() => setPeopleLoading(false));
  }, [authToken]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Real matches when logged in; mock data for dev preview.
  const allMatches: any[] = authToken ? matches : mockMatches;

  const follow = async (u: ConnectionUser) => {
    if (!authToken) return;
    setBusyId(u.id);
    try {
      await api.follow(u.id, authToken);
      loadPeople(); // may become a friend if they already followed you
    } finally {
      setBusyId(null);
    }
  };

  const unfollow = (u: ConnectionUser) =>
    confirmAction({
      title: "Unfollow?",
      message: `You will stop following ${u.firstName ?? "this user"}. Chat & calls between you will be locked.`,
      confirmLabel: "Unfollow",
      successMessage: `You unfollowed ${u.firstName ?? "this user"}.`,
      onConfirm: async () => {
        if (!authToken) return;
        await api.unfollow(u.id, authToken);
        setFollowing((prev) => prev.filter((x) => x.id !== u.id));
      },
    });

  /** Remove someone from my followers — they stop following me. */
  const removeFollower = (u: ConnectionUser) =>
    confirmAction({
      title: "Remove follower?",
      message: `${u.firstName ?? "This user"} will no longer follow you.`,
      confirmLabel: "Remove",
      successMessage: `${u.firstName ?? "This user"} was removed from your followers.`,
      onConfirm: async () => {
        if (!authToken) return;
        await api.removeFollower(u.id, authToken);
        setFollowers((prev) => prev.filter((x) => x.id !== u.id));
      },
    });

  const renderNewMatch = ({ item }: { item: MatchItem }) => (
    <Pressable style={styles.newMatchItem} onPress={() => router.push(`/user/${item.id}` as any)}>
      <View style={styles.newMatchImageContainer}>
        <Image source={{ uri: item.photoUrl }} style={styles.newMatchImage} />
      </View>
      <Typography style={styles.newMatchName}>{item.firstName}</Typography>
    </Pressable>
  );

  const renderMatch = ({ item }: { item: MatchItem }) => (
    <MatchCard match={item} onPress={() => router.push(`/user/${item.id}` as any)} />
  );

  /** One row of the Following / Followers / New / Interests lists. */
  const renderPerson = ({ item }: { item: ConnectionUser }) => (
    <Pressable style={styles.row} onPress={() => router.push(`/user/${item.id}` as any)}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{(item.firstName || "?").charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.nameLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.firstName} {item.lastName || ""}
            {item.age ? `, ${item.age}` : ""}
          </Text>
          {item.is_friend && (
            <View style={styles.friendPill}>
              <Feather name="message-circle" size={10} color={Colors.primary} />
              <Text style={styles.friendPillText}>Friends</Text>
            </View>
          )}
        </View>
        {tab === "interest" && item.shared_interests?.length ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            ❤️ {item.shared_interests.slice(0, 3).join(", ")}
          </Text>
        ) : (
          !!item.location && (
            <Text style={styles.rowSub} numberOfLines={1}>
              {item.location}
            </Text>
          )
        )}
      </View>

      {tab === "following" ? (
        <Pressable style={styles.followingBtn} onPress={() => unfollow(item)}>
          <Text style={styles.followingText}>Following</Text>
        </Pressable>
      ) : tab === "followers" ? (
        item.is_following ? (
          <Pressable style={styles.removeBtn} onPress={() => removeFollower(item)}>
            <Feather name="user-minus" size={14} color={Colors.error} />
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.followBtn} onPress={() => follow(item)} disabled={busyId === item.id}>
            {busyId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.followBtnText}>Follow back</Text>
            )}
          </Pressable>
        )
      ) : (
        <Pressable style={styles.followBtn} onPress={() => follow(item)} disabled={busyId === item.id}>
          {busyId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.followBtnText}>Follow</Text>
          )}
        </Pressable>
      )}
    </Pressable>
  );

  // Filter for new matches (last 24 hours)
  const newMatches = allMatches.filter((match) => {
    if (!match.matchedOn) return false;
    const matchDate = new Date(match.matchedOn);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return matchDate > oneDayAgo;
  });

  const peopleData =
    tab === "following" ? following : tab === "followers" ? followers : tab === "new" ? newUsers : interest;

  const emptyPeopleText =
    tab === "following"
      ? "You're not following anyone yet."
      : tab === "followers"
        ? "No followers yet."
        : tab === "new"
          ? "No new members right now."
          : "Add interests to your profile to find people who share them.";

  const countFor = (key: Tab) =>
    key === "matches"
      ? allMatches.length
      : key === "following"
        ? following.length
        : key === "followers"
          ? followers.length
          : key === "new"
            ? newUsers.length
            : interest.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#fff" barStyle="dark-content" />
      <AppHeader title="Matches" />

      {/* Matches · Following · Followers · New · Interests */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsWrap}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          const n = countFor(t.key);
          return (
            <PressableScale
              key={t.key}
              style={[styles.chip, active && styles.chipActive]}
              scaleTo={0.94}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t.label}
                {n > 0 ? ` ${n}` : ""}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {tab === "matches" ? (
        <>
          {loading && allMatches.length === 0 && (
            <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
          )}

          {!loading && allMatches.length === 0 && (
            <View style={styles.empty}>
              <Typography style={styles.emptyText}>
                No matches yet. Keep swiping in Discover to find your people! 💫
              </Typography>
            </View>
          )}

          {newMatches.length > 0 && (
            <View style={styles.newMatchesSection}>
              <Typography variant="subtitle" style={styles.sectionTitle}>
                New Matches
              </Typography>
              <FlatList
                data={newMatches}
                renderItem={renderNewMatch}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newMatchesList}
              />
            </View>
          )}

          <View style={styles.allMatchesSection}>
            <Typography variant="subtitle" style={styles.sectionTitle}>
              All Matches
            </Typography>
            <FlatList
              data={allMatches}
              renderItem={renderMatch}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.matchesList}
            />
          </View>
        </>
      ) : peopleLoading && peopleData.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={peopleData}
          keyExtractor={(u) => u.id}
          renderItem={renderPerson}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={loadPeople} />}
          ListEmptyComponent={<Text style={styles.emptyPeople}>{emptyPeopleText}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f5f5f5",
    backgroundColor: "#fff",
  },

  // ---- tab chips ----
  chipsWrap: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: "#f0f0f2" },
  chips: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#f3f3f5",
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.darkGray },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  newMatchesSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  newMatchesList: {
    paddingHorizontal: 8,
  },
  newMatchItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 80,
  },
  newMatchImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: "hidden",
  },
  newMatchImage: {
    width: "100%",
    height: "100%",
  },
  newMatchName: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 12,
  },
  allMatchesSection: {
    flex: 1,
    marginTop: 8,
  },
  matchesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: Colors.darkGray,
    lineHeight: 22,
  },

  // ---- people rows (following / followers / new / interests) ----
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f2",
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#eee" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.lightPrimary },
  avatarInitial: { color: Colors.primary, fontWeight: "700", fontSize: 20 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowName: { fontSize: 15, fontWeight: "600", color: Colors.text, flexShrink: 1 },
  rowSub: { fontSize: 13, color: Colors.darkGray, marginTop: 2 },
  friendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.lightPrimary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  friendPillText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  followBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 96,
    alignItems: "center",
  },
  followBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  followingBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  followingText: { color: Colors.primary, fontWeight: "600", fontSize: 13 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeText: { color: Colors.error, fontWeight: "600", fontSize: 13 },
  emptyPeople: { textAlign: "center", color: Colors.gray, marginTop: 40, lineHeight: 20, paddingHorizontal: 20 },
});
