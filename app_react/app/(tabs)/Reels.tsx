import Colors from "@/data/Colors";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Audio, ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRegistration } from "../../context/RegistrationContext";
import { api, type Reel } from "../../lib/api";
import { confirmAction } from "../../lib/confirm";
import AppHeader from "../components/Shared/AppHeader";
import PressableScale from "../components/Shared/PressableScale";
import ReelShareSheet from "../components/Shared/ReelShareSheet";

const { height, width } = Dimensions.get("window");

function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n);
}

function ReelItem({
  item,
  active,
  muted,
  onToggleMute,
  onLike,
  onMenu,
}: {
  item: Reel;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLike: (r: Reel) => void;
  onMenu: (r: Reel) => void;
}) {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [paused, setPaused] = useState(false);
  const name = [item.user.firstName, item.user.lastName].filter(Boolean).join(" ");

  // A reel that scrolls off screen always resumes from "playing" next time.
  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);

  // Belt and braces: `shouldPlay` alone can leave audio running when the screen
  // unmounts or the tab changes, so stop the player explicitly too.
  useEffect(() => {
    if (!active) videoRef.current?.stopAsync().catch(() => {});
  }, [active]);

  useEffect(() => {
    const player = videoRef.current;
    return () => {
      player?.stopAsync().catch(() => {});
      player?.unloadAsync().catch(() => {});
    };
  }, []);

  return (
    <View style={styles.reel}>
      {/* Tap anywhere on the video to pause / resume */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((p) => !p)}>
        <Video
          ref={videoRef}
          source={{ uri: item.video_url }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          shouldPlay={active && !paused}
          isLooping
          isMuted={muted}
          volume={1.0}
        />
      </Pressable>
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.shade} pointerEvents="none" />

      {/* Pause indicator */}
      {active && paused && (
        <View style={styles.pauseBadge} pointerEvents="none">
          <Ionicons name="play" size={34} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      {/* Mute / unmute */}
      <PressableScale style={styles.muteBtn} ripple={null} onPress={onToggleMute}>
        <Ionicons name={muted ? "volume-mute" : "volume-high"} size={19} color="#fff" />
      </PressableScale>

      {/* Right action rail */}
      <View style={styles.rail}>
        <PressableScale
          style={styles.avatarWrap}
          ripple={null}
          onPress={() => router.push(`/user/${item.user.id}` as any)}
        >
          {item.user.photoUrl ? (
            <Image source={{ uri: item.user.photoUrl }} style={styles.railAvatar} />
          ) : (
            <View style={[styles.railAvatar, styles.railAvatarFallback]}>
              <Text style={styles.railAvatarInitial}>
                {(item.user.firstName || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </PressableScale>

        <PressableScale
          style={styles.railBtn}
          scaleTo={0.82}
          ripple={null}
          onPress={() => onLike(item)}
        >
          <Ionicons
            name={item.liked ? "heart" : "heart-outline"}
            size={32}
            color={item.liked ? Colors.primary : "#fff"}
          />
          <Text style={styles.railText}>{fmt(item.likes_count)}</Text>
        </PressableScale>

        <View style={styles.railBtn}>
          <Feather name="eye" size={27} color="#fff" />
          <Text style={styles.railText}>{fmt(item.views)}</Text>
        </View>

        {/* "…" → copy link, save to gallery, WhatsApp share / status */}
        <PressableScale style={styles.railBtn} ripple={null} onPress={() => onMenu(item)}>
          <Feather name="more-vertical" size={26} color="#fff" />
        </PressableScale>
      </View>

      {/* Bottom info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Pressable onPress={() => router.push(`/user/${item.user.id}` as any)}>
            <Text style={styles.name}>{name || "Someone"}</Text>
          </Pressable>
          {item.user.verified && (
            <View style={styles.verified}>
              <Text style={styles.tick}>✓</Text>
            </View>
          )}
          {!item.user.is_me && (
            <Pressable style={styles.sayHi} onPress={() => router.push(`/user/${item.user.id}` as any)}>
              <Feather name="heart" size={13} color="#fff" />
              <Text style={styles.sayHiText}>Say hi</Text>
            </Pressable>
          )}
        </View>
        {!!item.caption && <Text style={styles.caption}>{item.caption}</Text>}
        <View style={styles.musicRow}>
          <Feather name="music" size={13} color="#fff" />
          <Text style={styles.music} numberOfLines={1}>
            {item.music}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Reels() {
  const { authToken } = useRegistration();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [menuFor, setMenuFor] = useState<Reel | null>(null);
  // Playback (and its audio) stops as soon as you leave the Reels tab.
  const focused = useIsFocused();
  const listRef = useRef<FlatList<Reel>>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const seen = useRef<Set<string>>(new Set());
  const busyLikes = useRef<Set<string>>(new Set());

  // Play sound even when the phone's silent switch is on (iOS).
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  const load = useCallback(
    (pullToRefresh = false) => {
      if (!authToken) return;
      if (pullToRefresh) setRefreshing(true);
      else setLoading(true);
      api
        .reelsFeed(authToken)
        .then((r) => {
          setReels(r || []);
          if (pullToRefresh) {
            // Jump back to the first reel of the new set, like Instagram.
            setActiveIndex(0);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [authToken],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const first = viewableItems?.[0];
    if (first) setActiveIndex(first.index ?? 0);
  }).current;

  // Tell the server each reel was watched, and bump the number on screen so the
  // counter isn't stale. The server only counts a user's first watch, and uses
  // the same record to keep already-seen reels out of the next feed.
  useEffect(() => {
    const current = reels[activeIndex];
    if (!current || !authToken || !focused || seen.current.has(current.id)) return;
    seen.current.add(current.id);
    setReels((prev) =>
      prev.map((r) => (r.id === current.id ? { ...r, views: r.views + 1 } : r)),
    );
    api.viewReel(current.id, authToken).catch(() => {});
  }, [activeIndex, reels, authToken, focused]);

  const like = async (reel: Reel) => {
    if (!authToken || busyLikes.current.has(reel.id)) return; // ignore double taps
    busyLikes.current.add(reel.id);

    // Optimistic flip…
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, liked: !r.liked, likes_count: Math.max(0, r.likes_count + (r.liked ? -1 : 1)) }
          : r,
      ),
    );
    try {
      // …then take the server's authoritative count (other people like it too).
      const res = await api.likeReel(reel.id, authToken);
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id ? { ...r, liked: res.liked, likes_count: res.likes_count } : r,
        ),
      );
    } catch {
      load();
    } finally {
      busyLikes.current.delete(reel.id);
    }
  };

  const remove = (reel: Reel) =>
    confirmAction({
      title: "Delete this reel?",
      message: "It will be removed from the feed and your profile.",
      successMessage: "Your reel was deleted.",
      onConfirm: async () => {
        if (!authToken) return;
        await api.deleteReel(reel.id, authToken);
        setReels((prev) => prev.filter((r) => r.id !== reel.id));
      },
    });

  return (
    <View style={styles.container}>
      {/* Floating header over the black feed: + upload · Reels · ♡ notifications */}
      <AppHeader title="Reels" dark floating onUploaded={load} />

      {loading && reels.length === 0 ? (
        <ActivityIndicator style={{ marginTop: height / 2.4 }} color="#fff" />
      ) : (
        <FlatList
          ref={listRef}
          data={reels}
          keyExtractor={(r) => r.id}
          renderItem={({ item, index }) => (
            <ReelItem
              item={item}
              active={index === activeIndex && focused && !menuFor}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onLike={like}
              onMenu={setMenuFor}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            // Pull down from the top for a fresh set of suggested reels.
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#fff"
              colors={["#fff"]}
              progressBackgroundColor="#222"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="videocam-outline" size={46} color="#666" />
              <Text style={styles.emptyText}>No reels yet.</Text>
              <Text style={styles.emptySub}>Tap ＋ at the top-left to post the first one.</Text>
            </View>
          }
        />
      )}

      <ReelShareSheet reel={menuFor} onClose={() => setMenuFor(null)} onDelete={remove} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  reel: { width, height, justifyContent: "flex-end" },
  media: { ...StyleSheet.absoluteFillObject, width, height, backgroundColor: "#111" },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.45 },
  pauseBadge: {
    position: "absolute",
    alignSelf: "center",
    top: "46%",
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  muteBtn: {
    position: "absolute",
    right: 16,
    top: 108,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  rail: { position: "absolute", right: 12, bottom: 130, alignItems: "center", gap: 22 },
  avatarWrap: { marginBottom: 6 },
  railAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#fff" },
  railAvatarFallback: { backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  railAvatarInitial: { color: "#fff", fontWeight: "800", fontSize: 18 },
  railBtn: { alignItems: "center", gap: 3 },
  railText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  info: { position: "absolute", left: 16, right: 80, bottom: 120 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  name: { color: "#fff", fontSize: 17, fontWeight: "800" },
  verified: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  tick: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  sayHi: {
    flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#fff",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, marginLeft: 4,
  },
  sayHiText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  caption: { color: "#fff", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  musicRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  music: { color: "#fff", fontSize: 12, flex: 1 },
  empty: { height, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 40 },
  emptyText: { color: "#ddd", fontSize: 16, fontWeight: "700" },
  emptySub: { color: "#888", fontSize: 13, textAlign: "center" },
});
