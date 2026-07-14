import Colors from "@/data/Colors";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height, width } = Dimensions.get("window");

// Mock reels — swap `media` for an <expo-av Video> source when wiring the backend.
const REELS = [
  {
    id: "1",
    media: "https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg",
    name: "Ananya",
    age: 24,
    verified: true,
    caption: "Golden hour walks 🌇 who's joining?",
    music: "original audio · Ananya",
    likes: 1243,
    comments: 88,
  },
  {
    id: "2",
    media: "https://images.pexels.com/photos/2422293/pexels-photo-2422293.jpeg",
    name: "Rohan",
    age: 27,
    verified: false,
    caption: "Weekend trek vibes ⛰️ tag your adventure buddy",
    music: "trending · Wanderlust",
    likes: 980,
    comments: 41,
  },
  {
    id: "3",
    media: "https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg",
    name: "Meera",
    age: 23,
    verified: true,
    caption: "Coffee + books = perfect date ☕📚",
    music: "original audio · Meera",
    likes: 2100,
    comments: 132,
  },
  {
    id: "4",
    media: "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg",
    name: "Karan",
    age: 29,
    verified: false,
    caption: "Gym → beach → repeat 🏖️",
    music: "trending · Summer Beats",
    likes: 754,
    comments: 27,
  },
];

function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n);
}

function ReelItem({ item }: { item: (typeof REELS)[number] }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <View style={styles.reel}>
      <Image source={{ uri: item.media }} style={styles.media} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.shade} />

      {/* Right action rail */}
      <View style={styles.rail}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: item.media }} style={styles.railAvatar} />
          {!following && (
            <Pressable style={styles.followDot} onPress={() => setFollowing(true)}>
              <Feather name="plus" size={12} color="#fff" />
            </Pressable>
          )}
        </View>

        <Pressable style={styles.railBtn} onPress={() => setLiked((v) => !v)}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={32} color={liked ? Colors.primary : "#fff"} />
          <Text style={styles.railText}>{fmt(item.likes + (liked ? 1 : 0))}</Text>
        </Pressable>

        <Pressable style={styles.railBtn}>
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.railText}>{fmt(item.comments)}</Text>
        </Pressable>

        <Pressable style={styles.railBtn}>
          <Feather name="send" size={28} color="#fff" />
          <Text style={styles.railText}>Share</Text>
        </Pressable>

        <Pressable style={styles.railBtn}>
          <Feather name="more-vertical" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Bottom info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {item.name}, {item.age}
          </Text>
          {item.verified && (
            <View style={styles.verified}><Text style={styles.tick}>✓</Text></View>
          )}
          <Pressable style={styles.sayHi} onPress={() => router.push("/(tabs)/Discover")}>
            <Feather name="heart" size={13} color="#fff" />
            <Text style={styles.sayHiText}>Say hi</Text>
          </Pressable>
        </View>
        <Text style={styles.caption}>{item.caption}</Text>
        <View style={styles.musicRow}>
          <Feather name="music" size={13} color="#fff" />
          <Text style={styles.music} numberOfLines={1}>{item.music}</Text>
        </View>
      </View>
    </View>
  );
}

export default function Reels() {
  const listRef = useRef(null);
  return (
    <View style={styles.container}>
      <View style={styles.topBar} pointerEvents="none">
        <Text style={styles.topTitle}>Reels</Text>
      </View>
      <FlatList
        ref={listRef}
        data={REELS}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <ReelItem item={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 50, alignItems: "center" },
  topTitle: { color: "#fff", fontWeight: "800", fontSize: 18, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  reel: { width, height, justifyContent: "flex-end" },
  media: { ...StyleSheet.absoluteFillObject, width, height, resizeMode: "cover", backgroundColor: "#111" },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.45 },
  rail: { position: "absolute", right: 12, bottom: 130, alignItems: "center", gap: 22 },
  avatarWrap: { marginBottom: 6 },
  railAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#fff" },
  followDot: {
    position: "absolute", bottom: -8, alignSelf: "center", width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff",
  },
  railBtn: { alignItems: "center", gap: 3 },
  railText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  info: { position: "absolute", left: 16, right: 80, bottom: 120 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  name: { color: "#fff", fontSize: 17, fontWeight: "800" },
  verified: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  tick: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  sayHi: {
    flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#fff",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, marginLeft: 4,
  },
  sayHiText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  caption: { color: "#fff", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  musicRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  music: { color: "#fff", fontSize: 12, flex: 1 },
});
