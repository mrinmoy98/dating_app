import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { DiscoverCard, Preferences } from "./types";

export const discoverApi = {
  updatePreferences(prefs: Preferences, token: string) {
    return http.patch<any>(ENDPOINTS.auth.preferences, prefs, token);
  },

  discover(token: string) {
    return http.get<DiscoverCard[]>(ENDPOINTS.auth.discover, token);
  },
};
