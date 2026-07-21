import { http } from "./http";
import type { ConnectionUser, UserProfile } from "./types";

export const socialApi = {
  getProfile: (id: string, token: string) => http.get<UserProfile>(`/api/users/${id}`, token),

  follow: (id: string, token: string) =>
    http.post<{ following: boolean; is_friend?: boolean }>(`/api/follow/${id}`, undefined, token),

  unfollow: (id: string, token: string) =>
    http.del<{ following: boolean; is_friend?: boolean }>(`/api/follow/${id}`, token),

  following: (token: string) => http.get<ConnectionUser[]>(`/api/follow/following`, token),

  followers: (token: string) => http.get<ConnectionUser[]>(`/api/follow/followers`, token),

  /** Another user's follow lists — opened from their profile. */
  followersOf: (id: string, token: string) =>
    http.get<ConnectionUser[]>(`/api/users/${id}/followers`, token),

  followingOf: (id: string, token: string) =>
    http.get<ConnectionUser[]>(`/api/users/${id}/following`, token),
};
