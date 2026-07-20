import { http } from "./http";
import type { ChatConversation, ChatMessage, ConnectionUser } from "./types";

export const chatApi = {
  conversations: (token: string) =>
    http.get<ChatConversation[]>("/api/chat/conversations", token),

  history: (userId: string, token: string) =>
    http.get<ChatMessage[]>(`/api/chat/with/${userId}`, token),

  friends: (token: string) => http.get<ConnectionUser[]>("/api/follow/friends", token),

  newUsers: (token: string) => http.get<ConnectionUser[]>("/api/users/new", token),

  byInterest: (token: string) => http.get<ConnectionUser[]>("/api/users/by-interest", token),
};
