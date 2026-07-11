import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { DiscoverCard, Preferences } from "./types";

/** Partner preferences + preference-based discovery. */
export const discoverApi = {
  /** Update partner-search preferences. Returns the fresh user object. */
  updatePreferences(prefs: Preferences, token: string) {
    return http.patch<any>(ENDPOINTS.auth.preferences, prefs, token);
  },

  /** Candidate partners matching the current user's preferences. */
  discover(token: string) {
    return http.get<DiscoverCard[]>(ENDPOINTS.auth.discover, token);
  },
};
