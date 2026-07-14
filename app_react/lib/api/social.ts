import { http } from "./http";
import type { ConnectionUser, UserProfile } from "./types";

/** Profile view + follow/unfollow + follow lists. */
export const socialApi = {
  /** Full public profile of a user (with follow + match status). */
  getProfile: (id: string, token: string) => http.get<UserProfile>(`/api/users/${id}`, token),

  follow: (id: string, token: string) =>
    http.post<{ following: boolean }>(`/api/follow/${id}`, undefined, token),

  unfollow: (id: string, token: string) =>
    http.del<{ following: boolean }>(`/api/follow/${id}`, token),

  /** Users the current user follows. */
  following: (token: string) => http.get<ConnectionUser[]>(`/api/follow/following`, token),

  /** Users who follow the current user. */
  followers: (token: string) => http.get<ConnectionUser[]>(`/api/follow/followers`, token),
};
