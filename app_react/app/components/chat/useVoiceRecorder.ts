import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceClip {
  uri: string;
  name: string;
  mime: string;
  /** Seconds. */
  duration: number;
}

/**
 * Hold-to-record voice notes.
 *
 * `start()` asks for the mic once and begins recording; `stop()` returns the
 * finished clip (or null if it was cancelled / too short to be intentional).
 */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<Audio.Recording | null>(null);
  const cancelled = useRef(false);

  // Never leave the mic open if the screen goes away mid-recording.
  useEffect(() => {
    return () => {
      ref.current?.stopAndUnloadAsync().catch(() => {});
      ref.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone permission is required to send voice messages.");
        return false;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => setSeconds(Math.floor((status.durationMillis ?? 0) / 1000)),
        250,
      );
      ref.current = rec;
      cancelled.current = false;
      setSeconds(0);
      setRecording(true);
      return true;
    } catch {
      setError("Could not start recording.");
      return false;
    }
  }, []);

  const finish = useCallback(async (): Promise<VoiceClip | null> => {
    const rec = ref.current;
    ref.current = null;
    setRecording(false);
    if (!rec) return null;

    let clip: VoiceClip | null = null;
    try {
      const status = await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const duration = Math.round((status.durationMillis ?? seconds * 1000) / 1000);
      // Under a second is almost always a mis-tap, not a message.
      if (uri && !cancelled.current && duration >= 1) {
        const ext = (uri.split(".").pop() || "m4a").toLowerCase();
        clip = {
          uri,
          name: `voice-${Date.now()}.${ext}`,
          mime: ext === "caf" ? "audio/x-caf" : "audio/m4a",
          duration,
        };
      }
    } catch {
      setError("Recording failed.");
    } finally {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
      setSeconds(0);
    }
    return clip;
  }, [seconds]);

  const cancel = useCallback(async () => {
    cancelled.current = true;
    await finish();
  }, [finish]);

  return { recording, seconds, error, start, stop: finish, cancel };
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
