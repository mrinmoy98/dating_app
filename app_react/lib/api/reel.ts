import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { Reel } from "./types";

export const reelApi = {
  /** Feed for the Reels tab — people you follow first. */
  reelsFeed: (token: string) => http.get<Reel[]>(ENDPOINTS.reels.feed, token),

  /** Reels posted by one user — the grid on their profile. */
  reelsByUser: (userId: string, token: string) =>
    http.get<Reel[]>(ENDPOINTS.reels.byUser(userId), token),

  myReels: (token: string) => http.get<Reel[]>(ENDPOINTS.reels.mine, token),

  /** Post a reel after uploading the video with `uploadVideo`. */
  createReel: (
    body: { video_url: string; thumbnail_url?: string; caption?: string; music?: string },
    token: string,
  ) => http.post<Reel>(ENDPOINTS.reels.create, body, token),

  likeReel: (id: string, token: string) =>
    http.post<{ liked: boolean; likes_count: number }>(ENDPOINTS.reels.like(id), undefined, token),

  viewReel: (id: string, token: string) =>
    http.post<{ success: boolean }>(ENDPOINTS.reels.view(id), undefined, token),

  deleteReel: (id: string, token: string) =>
    http.del<{ deleted: boolean; id: string }>(ENDPOINTS.reels.remove(id), token),
};
