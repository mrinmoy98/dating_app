import Colors from "@/data/Colors";
import { Feather } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type ConnectionUser, type Reel, type UserProfile } from "../../lib/api";
import { confirmAction } from "../../lib/confirm";
import PressableScale from "../components/Shared/PressableScale";

const { width } = Dimensions.get("window");
const GRID_GAP = 8;
const CELL = (width - 32 - GRID_GAP * 2) / 3;

type Tab = "reels" | "photos" | "about";
type ListKind = "followers" | "following" | null;

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

/** Tappable stat tile — Reels / Followers / Following. */
function StatTile({
  icon,
  value,
  label,
  onPress,
}: {
  icon: any;
  value: number | string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      style={[styles.stat, !onPress && styles.statFlat]}
      scaleTo={0.94}
      onPress={onPress}
      disabled={!onPress}
    >
      <Feather name={icon} size={15} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </PressableScale>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authToken } = useRegistration();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("reels");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState<Reel | null>(null);
  const [muted, setMuted] = useState(false);
  const likeBusy = useRef<Set<string>>(new Set());
  const viewed = useRef<Set<string>>(new Set());

  // Follower / following sheet
  const [listKind, setListKind] = useState<ListKind>(null);
  const [listUsers, setListUsers] = useState<ConnectionUser[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const load = useCallback(() => {
    if (!authToken || !id) return;
    setLoading(true);
    Promise.all([
      api.getProfile(String(id), authToken),
      api.reelsByUser(String(id), authToken).catch(() => [] as Reel[]),
    ])
      .then(([p, r]) => {
        setProfile(p);
        setReels(r || []);
      })
      .catch((e) => Alert.alert("Could not load profile", e?.message ?? "Try again."))
      .finally(() => setLoading(false));
  }, [authToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  const openList = async (kind: Exclude<ListKind, null>) => {
    if (!authToken || !profile) return;
    setListKind(kind);
    setListUsers([]);
    setListLoading(true);
    try {
      const rows =
        kind === "followers"
          ? await api.followersOf(profile.id, authToken)
          : await api.followingOf(profile.id, authToken);
      setListUsers(rows || []);
    } catch {
      setListUsers([]);
    } finally {
      setListLoading(false);
    }
  };

  const applyFollow = async (unfollowing: boolean) => {
    if (!profile || !authToken) return;
    setBusy(true);
    try {
      if (unfollowing) await api.unfollow(profile.id, authToken);
      else await api.follow(profile.id, authToken);
      // Re-fetch so is_friend / counts stay correct.
      const fresh = await api.getProfile(profile.id, authToken);
      setProfile(fresh);
    } finally {
      setBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (!profile || !authToken) return;

    // Unfollowing is destructive (it locks chat & calls) — always confirm first.
    if (profile.is_following) {
      await confirmAction({
        title: "Unfollow?",
        message: `You will stop following ${profile.firstName ?? "this user"}. Chat & video call between you will be locked.`,
        confirmLabel: "Unfollow",
        successMessage: `You unfollowed ${profile.firstName ?? "this user"}.`,
        onConfirm: () => applyFollow(true),
      });
      return;
    }

    try {
      await applyFollow(false);
    } catch (e: any) {
      Alert.alert("Something went wrong", e?.message ?? "Try again.");
    }
  };

  /** Open the player and count one view (once per reel per visit). */
  const openReel = (reel: Reel) => {
    setPlaying(reel);
    if (!authToken || viewed.current.has(reel.id)) return;
    viewed.current.add(reel.id);
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, views: r.views + 1 } : r)));
    api.viewReel(reel.id, authToken).catch(() => {});
  };

  const likeReel = async (reel: Reel) => {
    if (!authToken || likeBusy.current.has(reel.id)) return; // ignore double taps
    likeBusy.current.add(reel.id);

    const current = reels.find((r) => r.id === reel.id) ?? reel;
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, liked: !current.liked, likes_count: Math.max(0, r.likes_count + (current.liked ? -1 : 1)) }
          : r,
      ),
    );
    try {
      // Trust the server's count — other people are liking it too.
      const res = await api.likeReel(reel.id, authToken);
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id ? { ...r, liked: res.liked, likes_count: res.likes_count } : r,
        ),
      );
    } catch {
      load();
    } finally {
      likeBusy.current.delete(reel.id);
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

  // Cover banner: their uploaded cover, else a second photo, else just the gradient.
  const coverSource = profile.coverUrl || photos[1] || photos[0] || null;
  // Live copy of the reel being played, so like/view counts update in the player.
  const live = playing ? reels.find((r) => r.id === playing.id) : null;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const place = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const languages = [profile.mother_tongue, ...(profile.other_languages ?? [])]
    .filter(Boolean)
    .join(", ");
  const weight = profile.weight_kg ? `${profile.weight_kg} kg` : null;

  const openMessage = () =>
    router.push({
      pathname: "/chat/[id]",
      params: { id: profile.id, name: fullName, photo: profile.photoUrl ?? "" },
    } as any);

  const openCall = () =>
    router.push({
      pathname: "/call/[id]",
      params: { id: profile.id, name: fullName, photo: profile.photoUrl ?? "" },
    } as any);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ---------- Cover: their banner (or a photo) behind a brand tint ---------- */}
        <View style={styles.cover}>
          {!!coverSource && (
            <Image source={{ uri: coverSource }} style={styles.coverImg} blurRadius={12} />
          )}
          <LinearGradient
            colors={
              coverSource
                ? ["rgba(214,0,144,0.55)", "rgba(123,47,247,0.72)"]
                : [Colors.primary, "#7b2ff7"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top"]} style={styles.coverBar}>
            <Pressable style={styles.coverBtn} onPress={() => router.back()} hitSlop={8}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.coverTitle} numberOfLines={1}>
              {fullName}
            </Text>
            <View style={styles.coverBtn}>
              {profile.is_matched && <Feather name="heart" size={20} color="#fff" />}
            </View>
          </SafeAreaView>
        </View>

        {/* ---------- Identity card (overlaps the cover) ---------- */}
        <View style={styles.idCard}>
          <Pressable
            style={styles.avatarWrap}
            onPress={() => photos.length > 0 && setViewerIndex(0)}
          >
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(profile.firstName || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {/* Tap hint — makes it obvious the photo opens full screen */}
            <View style={styles.zoomDot}>
              <Feather name="maximize-2" size={12} color="#fff" />
            </View>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={11} color="#fff" />
              </View>
            )}
          </Pressable>

          <Text style={styles.name}>
            {fullName}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
          {!!(place || profile.location) && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={Colors.darkGray} />
              <Text style={styles.locationText}>{place || profile.location}</Text>
            </View>
          )}
          {!!profile.occupation && <Text style={styles.occupation}>{profile.occupation}</Text>}
          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Stat tiles — followers / following open a list */}
          <View style={styles.statRow}>
            <StatTile icon="film" value={reels.length} label="Reels" onPress={() => setTab("reels")} />
            <StatTile
              icon="users"
              value={profile.followers_count}
              label="Followers"
              onPress={() => openList("followers")}
            />
            <StatTile
              icon="user-check"
              value={profile.following_count}
              label="Following"
              onPress={() => openList("following")}
            />
          </View>

          {/* ---------- Actions ---------- */}
          {!profile.is_me && (
            <>
              <View style={styles.actionRow}>
                <PressableScale
                  style={[styles.followBtn, profile.is_following && styles.followBtnGhost]}
                  onPress={toggleFollow}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={profile.is_following ? Colors.primary : "#fff"} />
                  ) : (
                    <>
                      <Feather
                        name={profile.is_following ? "user-check" : "user-plus"}
                        size={16}
                        color={profile.is_following ? Colors.primary : "#fff"}
                      />
                      <Text style={[styles.followText, profile.is_following && styles.followTextGhost]}>
                        {profile.is_following
                          ? "Following"
                          : profile.follows_me
                            ? "Follow back"
                            : "Follow"}
                      </Text>
                    </>
                  )}
                </PressableScale>

                <PressableScale
                  style={[styles.iconAction, !profile.is_friend && styles.disabled]}
                  onPress={profile.is_friend ? openMessage : undefined}
                >
                  <Feather name="message-circle" size={19} color={Colors.primary} />
                </PressableScale>
                <PressableScale
                  style={[styles.iconAction, !profile.is_friend && styles.disabled]}
                  onPress={profile.is_friend ? openCall : undefined}
                >
                  <Feather name="video" size={19} color={Colors.primary} />
                </PressableScale>
              </View>

              {!profile.is_friend && (
                <View style={styles.lockRow}>
                  <Feather name="lock" size={12} color={Colors.gray} />
                  <Text style={styles.lockNote}>
                    {profile.follows_me
                      ? "They follow you — follow back to unlock chat & call."
                      : "Chat & video call unlock when you follow each other."}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ---------- Segmented control ---------- */}
        <View style={styles.segment}>
          {(
            [
              { key: "reels", label: "Reels", icon: "film" },
              { key: "photos", label: "Photos", icon: "image" },
              { key: "about", label: "About", icon: "info" },
            ] as const
          ).map((t) => (
            <PressableScale
              key={t.key}
              style={[styles.segmentBtn, tab === t.key && styles.segmentBtnActive]}
              scaleTo={0.95}
              onPress={() => setTab(t.key)}
            >
              <Feather name={t.icon} size={15} color={tab === t.key ? "#fff" : Colors.darkGray} />
              <Text style={[styles.segmentText, tab === t.key && styles.segmentTextActive]}>
                {t.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* ---------- Reels ---------- */}
        {tab === "reels" &&
          (reels.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="film" size={34} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No reels yet</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {reels.map((r) => (
                <Pressable key={r.id} style={styles.cell} onPress={() => openReel(r)}>
                  {r.thumbnail_url ? (
                    <Image source={{ uri: r.thumbnail_url }} style={styles.cellMedia} />
                  ) : (
                    <Video
                      source={{ uri: r.video_url }}
                      style={styles.cellMedia}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isMuted
                    />
                  )}
                  <View style={styles.cellBadge}>
                    <Feather name="play" size={10} color="#fff" />
                    <Text style={styles.cellBadgeText}>{r.views}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}

        {/* ---------- Photos ---------- */}
        {tab === "photos" &&
          (photos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="image" size={34} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No photos yet</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {photos.map((p, i) => (
                <Pressable key={`${p}-${i}`} style={styles.cell} onPress={() => setViewerIndex(i)}>
                  <Image source={{ uri: p }} style={styles.cellMedia} />
                </Pressable>
              ))}
            </View>
          ))}

        {/* ---------- About ---------- */}
        {tab === "about" && (
          <View style={styles.aboutBody}>
            <Section title="Basics">
              <DetailRow icon="user" label="Gender" value={profile.gender} />
              <DetailRow icon="heart" label="Status" value={profile.relationship_status} />
              <DetailRow icon="target" label="Looking for" value={profile.relationship_goal} />
              <DetailRow icon="trending-up" label="Height" value={profile.height_label} />
              <DetailRow icon="activity" label="Weight" value={weight} />
              <DetailRow icon="droplet" label="Blood group" value={profile.blood_group} />
            </Section>

            {(profile.occupation || profile.education) && (
              <Section title="Work & Education">
                <DetailRow icon="briefcase" label="Work" value={profile.occupation} />
                <DetailRow icon="book-open" label="Education" value={profile.education} />
              </Section>
            )}

            {(profile.religion || languages || profile.diet || profile.smoking || profile.drinking) && (
              <Section title="Lifestyle">
                <DetailRow icon="sunrise" label="Religion" value={profile.religion} />
                <DetailRow icon="message-square" label="Languages" value={languages} />
                <DetailRow icon="coffee" label="Diet" value={profile.diet} />
                <DetailRow icon="wind" label="Smoking" value={profile.smoking} />
                <DetailRow icon="droplet" label="Drinking" value={profile.drinking} />
              </Section>
            )}

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
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ---------- Followers / Following sheet ---------- */}
      <Modal visible={listKind !== null} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setListKind(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>
                {listKind === "followers" ? "Followers" : "Following"}
                {listUsers.length ? ` · ${listUsers.length}` : ""}
              </Text>
              <Pressable onPress={() => setListKind(null)} hitSlop={8}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>

            {listLoading ? (
              <ActivityIndicator style={{ marginVertical: 30 }} color={Colors.primary} />
            ) : (
              <FlatList
                data={listUsers}
                keyExtractor={(u) => u.id}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.listRow}
                    onPress={() => {
                      setListKind(null);
                      if (item.id !== profile.id) router.push(`/user/${item.id}` as any);
                    }}
                  >
                    {item.photoUrl ? (
                      <Image source={{ uri: item.photoUrl }} style={styles.listAvatar} />
                    ) : (
                      <View style={[styles.listAvatar, styles.avatarFallback]}>
                        <Text style={styles.listInitial}>
                          {(item.firstName || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName} numberOfLines={1}>
                        {[item.firstName, item.lastName].filter(Boolean).join(" ")}
                        {item.age ? `, ${item.age}` : ""}
                      </Text>
                      {!!item.location && (
                        <Text style={styles.listSub} numberOfLines={1}>
                          {item.location}
                        </Text>
                      )}
                    </View>
                    {item.is_friend ? (
                      <View style={styles.tagFriend}>
                        <Text style={styles.tagFriendText}>Friends</Text>
                      </View>
                    ) : item.is_following ? (
                      <View style={styles.tagFollowing}>
                        <Text style={styles.tagFollowingText}>Following</Text>
                      </View>
                    ) : null}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.sheetEmpty}>
                    {listKind === "followers" ? "No followers yet." : "Not following anyone yet."}
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ---------- Full-screen photo viewer ---------- */}
      <Modal visible={viewerIndex !== null} transparent animationType="fade">
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={() => setViewerIndex(null)} hitSlop={10}>
            <Feather name="x" size={26} color="#fff" />
          </Pressable>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(u, i) => `${u}-${i}`}
            renderItem={({ item }) => (
              <View style={styles.viewerPage}>
                <Image source={{ uri: item }} style={styles.viewerImg} resizeMode="contain" />
              </View>
            )}
          />
          {photos.length > 1 && (
            <Text style={styles.viewerHint}>Swipe to see more photos</Text>
          )}
        </View>
      </Modal>

      {/* ---------- Reel player (counts read from `reels` so they stay live) ---------- */}
      <Modal visible={!!playing} transparent animationType="slide">
        <View style={styles.playerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={() => setPlaying(null)} hitSlop={10}>
            <Feather name="x" size={26} color="#fff" />
          </Pressable>
          {!!playing && (
            <>
              <Video
                source={{ uri: playing.video_url }}
                style={styles.player}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
                isMuted={muted}
                volume={1.0}
              />

              {/* Mute / unmute */}
              <Pressable style={styles.muteBtn} onPress={() => setMuted((m) => !m)} hitSlop={8}>
                <Feather name={muted ? "volume-x" : "volume-2"} size={18} color="#fff" />
              </Pressable>

              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{fullName}</Text>
                {!!playing.caption && <Text style={styles.playerCaption}>{playing.caption}</Text>}
                <View style={styles.playerActions}>
                  <Pressable style={styles.playerAction} onPress={() => likeReel(playing)}>
                    <Feather
                      name="heart"
                      size={22}
                      color={live?.liked ? Colors.primary : "#fff"}
                    />
                    <Text style={styles.playerActionText}>{live?.likes_count ?? 0}</Text>
                  </Pressable>
                  <View style={styles.playerAction}>
                    <Feather name="eye" size={21} color="#fff" />
                    <Text style={styles.playerActionText}>{live?.views ?? playing.views}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f6f8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", gap: 8 },
  backLink: { color: Colors.primary, marginTop: 10, fontWeight: "600" },

  // ---- cover ----
  cover: {
    height: 168,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    backgroundColor: Colors.primary,
  },
  coverImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 6 },
  coverBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  coverTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 17, fontWeight: "700" },

  // ---- identity card ----
  idCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -58,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatarWrap: { marginTop: -44 },
  avatar: { width: 96, height: 96, borderRadius: 30, borderWidth: 4, borderColor: "#fff", backgroundColor: "#eee" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.lightPrimary },
  avatarInitial: { fontSize: 36, fontWeight: "800", color: Colors.primary },
  zoomDot: {
    position: "absolute",
    left: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
  },

  name: { fontSize: 20, fontWeight: "800", color: Colors.text, marginTop: 10, textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  locationText: { color: Colors.darkGray, fontSize: 13 },
  occupation: { color: Colors.text, fontSize: 13.5, marginTop: 6, fontWeight: "600" },
  bio: { color: Colors.darkGray, fontSize: 13.5, lineHeight: 20, marginTop: 8, textAlign: "center" },

  // ---- stat tiles ----
  statRow: { flexDirection: "row", gap: 8, marginTop: 16, alignSelf: "stretch" },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#faf7fb",
    borderWidth: 1,
    borderColor: "#f0ecf3",
  },
  statFlat: { opacity: 1 },
  statValue: { fontSize: 17, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 11.5, color: Colors.darkGray },

  // ---- actions ----
  actionRow: { flexDirection: "row", gap: 9, marginTop: 14, alignSelf: "stretch" },
  followBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  followBtnGhost: { backgroundColor: Colors.lightPrimary },
  followText: { color: "#fff", fontWeight: "700", fontSize: 14.5 },
  followTextGhost: { color: Colors.primary },
  iconAction: {
    width: 48,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 4 },
  lockNote: { flex: 1, fontSize: 12, color: Colors.gray, lineHeight: 17 },

  // ---- segmented control ----
  segment: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 5,
    borderRadius: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 13.5, fontWeight: "600", color: Colors.darkGray },
  segmentTextActive: { color: "#fff", fontWeight: "700" },

  // ---- grids ----
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cell: {
    width: CELL,
    height: CELL * 1.35,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#ececed",
  },
  cellMedia: { width: "100%", height: "100%" },
  cellBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cellBadgeText: { color: "#fff", fontSize: 10.5, fontWeight: "600" },
  emptyBox: { alignItems: "center", paddingVertical: 46, gap: 10 },
  emptyText: { color: Colors.gray, fontSize: 14 },

  // ---- about ----
  aboutBody: { paddingHorizontal: 16 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 15.5, fontWeight: "700", color: Colors.text, marginBottom: 9 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14 },
  detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  detailLabel: { fontSize: 13.5, color: Colors.darkGray, width: 96 },
  detailValue: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: Colors.lightPrimary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },

  // ---- follower / following sheet ----
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: 26,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dcdce0",
    alignSelf: "center",
    marginTop: 9,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  sheetTitle: { fontSize: 16.5, fontWeight: "800", color: Colors.text },
  sheetEmpty: { textAlign: "center", color: Colors.gray, paddingVertical: 30 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9 },
  listAvatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#eee" },
  listInitial: { color: Colors.primary, fontWeight: "700", fontSize: 18 },
  listName: { fontSize: 14.5, fontWeight: "600", color: Colors.text },
  listSub: { fontSize: 12.5, color: Colors.darkGray, marginTop: 2 },
  tagFriend: { backgroundColor: Colors.lightPrimary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagFriendText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  tagFollowing: { backgroundColor: "#f1f1f4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagFollowingText: { color: Colors.darkGray, fontSize: 11, fontWeight: "700" },

  // ---- viewers ----
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 46, right: 18, zIndex: 5, padding: 6 },
  viewerPage: { width, alignItems: "center", justifyContent: "center" },
  viewerImg: { width, height: "80%" },
  viewerHint: { position: "absolute", bottom: 40, alignSelf: "center", color: "#999", fontSize: 12 },
  muteBtn: {
    position: "absolute",
    top: 46,
    left: 18,
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerBackdrop: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  player: { width: "100%", height: "80%" },
  playerInfo: { position: "absolute", left: 18, right: 18, bottom: 50 },
  playerName: { color: "#fff", fontWeight: "800", fontSize: 16 },
  playerCaption: { color: "#fff", fontSize: 14, marginTop: 6, lineHeight: 19 },
  playerActions: { flexDirection: "row", gap: 22, marginTop: 14 },
  playerAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  playerActionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
