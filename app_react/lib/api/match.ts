import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { MatchUser, SwipeResult } from "./types";

export const matchApi = {
  swipe(targetId: string, action: "like" | "pass", token: string) {
    return http.post<SwipeResult>(ENDPOINTS.match.swipe, { targetId, action }, token);
  },

  matches(token: string) {
    return http.get<MatchUser[]>(ENDPOINTS.match.matches, token);
  },
};
