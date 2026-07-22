import Colors from "@/data/Colors";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Dependency-free emoji keyboard. A handful of curated pages beats bundling a
 * full unicode table, and every glyph here renders on both iOS and Android.
 */
const CATEGORIES: { key: string; icon: string; emojis: string[] }[] = [
  {
    key: "smileys",
    icon: "😀",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
      "😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤗","🤭","🤔","🤐","😐","😑",
      "😶","😏","😒","🙄","😬","😮","😴","😪","😔","😕","🙁","☹️","😣","😖","😫","😩",
      "🥺","😢","😭","😤","😠","😡","🤯","😳","🥵","🥶","😱","😨","😰","😥","🤗","🤠",
    ],
  },
  {
    key: "love",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖",
      "💘","💝","💟","♥️","😻","💋","👩‍❤️‍👨","👩‍❤️‍💋‍👨","🌹","🌷","💐","🥀","💍","💌","🫶","🤞",
    ],
  },
  {
    key: "gestures",
    icon: "👍",
    emojis: [
      "👍","👎","👌","✌️","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖",
      "👋","🤝","🙏","💪","🦾","👏","🙌","👐","🤲","✍️","💅","🤳","🕺","💃","🧘","🚶",
    ],
  },
  {
    key: "fun",
    icon: "🎉",
    emojis: [
      "🎉","🎊","🎈","🎁","🎂","🍰","🧁","🍫","🍬","🍭","🍕","🍔","🍟","🌮","🍿","🍩",
      "☕","🍵","🥤","🍺","🍻","🥂","🍷","🍾","🔥","✨","⭐","🌟","💫","⚡","🌈","☀️",
      "🌙","🎵","🎶","🎧","🎮","⚽","🏀","🎯","🏆","🚀","✈️","🏖️","🌸","🌻","🐶","🐱",
    ],
  },
];

export default function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [tab, setTab] = useState(0);
  const category = CATEGORIES[tab];

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {CATEGORIES.map((c, i) => (
          <Pressable
            key={c.key}
            onPress={() => setTab(i)}
            style={[styles.tab, i === tab && styles.tabActive]}
          >
            <Text style={styles.tabIcon}>{c.icon}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        key={category.key}
        data={category.emojis}
        keyExtractor={(e, i) => `${category.key}-${i}`}
        numColumns={8}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable style={styles.cell} onPress={() => onPick(item)}>
            <Text style={styles.emoji}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 260, backgroundColor: "#fafafb", borderTopWidth: 1, borderTopColor: "#eee" },
  tabs: { flexDirection: "row", paddingHorizontal: 8, paddingTop: 6, gap: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  tabActive: { backgroundColor: Colors.lightPrimary },
  tabIcon: { fontSize: 18 },
  grid: { padding: 8, paddingBottom: 16 },
  cell: { flex: 1 / 8, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  emoji: { fontSize: 24 },
});
