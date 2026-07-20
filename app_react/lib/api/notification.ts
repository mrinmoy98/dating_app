import { http } from "./http";
import type { AppNotification } from "./types";

export const notificationApi = {
  notifications: (token: string) => http.get<AppNotification[]>("/api/notifications", token),

  unreadCount: (token: string) =>
    http.get<{ count: number }>("/api/notifications/unread-count", token),

  markAllRead: (token: string) =>
    http.patch<{ success: boolean }>("/api/notifications/read", undefined, token),

  markRead: (id: string, token: string) =>
    http.patch<{ success: boolean }>(`/api/notifications/${id}/read`, undefined, token),

  deleteNotification: (id: string, token: string) =>
    http.del<{ deleted: boolean }>(`/api/notifications/${id}`, token),

  // ---- likes ----
  /** People I liked (swiped right). */
  myLikes: (token: string) => http.get<any[]>("/api/match/likes", token),
  /** People who liked me. */
  likedMe: (token: string) => http.get<any[]>("/api/match/liked-me", token),

  /** Remove someone from my followers. */
  removeFollower: (id: string, token: string) =>
    http.del<{ removed: boolean }>(`/api/followers/${id}`, token),
};
