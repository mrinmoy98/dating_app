import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { RegisterPayload } from "./types";

export const profileApi = {
  me(token: string) {
    return http.get<any>(ENDPOINTS.auth.me, token);
  },

  updateProfile(payload: Partial<RegisterPayload>, token: string) {
    return http.patch<any>(ENDPOINTS.auth.me, payload, token);
  },
};
