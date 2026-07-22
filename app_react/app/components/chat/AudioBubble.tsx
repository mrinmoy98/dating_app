import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { formatDuration } from "./useVoiceRecorder";

/** Voice note player: play/pause, a progress bar and the elapsed time. */
export default function AudioBubble({
  uri,
  duration,
  mine,
}: {
  uri: string;
  duration?: number;
  mine: boolean;
}) {
  const sound = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  useEffect(() => {
    return () => {
      sound.current?.unloadAsync().catch(() => {});
      sound.current = null;
    };
  }, []);

  const toggle = async () => {
    try {
      if (sound.current) {
        const status = await sound.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.current.pauseAsync();
          setPlaying(false);
        } else {
          await sound.current.playAsync();
          setPlaying(true);
        }
        return;
      }

      setLoading(true);
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: s } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPosition(Math.floor((status.positionMillis ?? 0) / 1000));
          if (status.durationMillis) setTotal(Math.floor(status.durationMillis / 1000));
          setPlaying(!!status.isPlaying);
          if (status.didJustFinish) {
            // Rewind so the next tap replays from the start.
            s.setPositionAsync(0).catch(() => {});
            setPlaying(false);
            setPosition(0);
          }
        },
      );
      sound.current = s;
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const tint = mine ? "#fff" : "#333";
  const track = mine ? "rgba(255,255,255,0.35)" : "#d9d9e0";
  const progress = total > 0 ? Math.min(1, position / total) : 0;

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} style={[styles.btn, { borderColor: tint }]} hitSlop={8}>
        {loading ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Feather name={playing ? "pause" : "play"} size={16} color={tint} />
        )}
      </Pressable>
      <View style={styles.meter}>
        <View style={[styles.track, { backgroundColor: track }]}>
          <View style={[styles.fill, { backgroundColor: tint, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.time, { color: tint }]}>
          {formatDuration(playing || position ? position : total)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180 },
  btn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  meter: { flex: 1, gap: 5 },
  track: { height: 4, borderRadius: 2, overflow: "hidden" },
  fill: { height: 4, borderRadius: 2 },
  time: { fontSize: 11, opacity: 0.9 },
});
