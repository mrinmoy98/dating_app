import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { MatchUser, SwipeResult } from "./types";

/** Like/pass swipes and the resulting matches. */
export const matchApi = {
  /** Like or pass a candidate. Returns { matched } (true when it becomes a match). */
  swipe(targetId: string, action: "like" | "pass", token: string) {
    return http.post<SwipeResult>(ENDPOINTS.match.swipe, { targetId, action }, token);
  },

  /** The current user's matches, newest first. */
  matches(token: string) {
    return http.get<MatchUser[]>(ENDPOINTS.match.matches, token);
  },
};
