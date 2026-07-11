import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { RegisterPayload } from "./types";

/** The logged-in user's own profile. */
export const profileApi = {
  /** Current user (drives the Profile screen). */
  me(token: string) {
    return http.get<any>(ENDPOINTS.auth.me, token);
  },

  /** Update the profile (PATCH — only the keys you pass change). */
  updateProfile(payload: Partial<RegisterPayload>, token: string) {
    return http.patch<any>(ENDPOINTS.auth.me, payload, token);
  },
};
