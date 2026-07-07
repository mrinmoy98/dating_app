import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Base URL of the NestJS backend (see /backend).
 *
 * In Expo dev, the app derives the dev machine's LAN IP from the Metro bundler
 * host (Constants.expoConfig.hostUri) so it "just works" on a physical phone on
 * the same Wi-Fi. Android emulators reach the host via 10.0.2.2. For a
 * production build, set EXPO_PUBLIC_API_URL and it takes priority.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const PORT = 4000;
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.hostUri ??
    "";
  const host = hostUri.split(":")[0];

  if (host) return `http://${host}:${PORT}`;

  // Fallbacks when the host can't be inferred.
  if (Platform.OS === "android") return `http://10.0.2.2:${PORT}`;
  return `http://localhost:${PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();
