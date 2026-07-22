import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import type { ChatConversation, ChatMessage, ConnectionUser } from "./types";

/** What the picker/recorder hands us for one attachment. */
export interface ChatUpload {
  uri: string;
  /** Falls back to the file name in the uri. */
  name?: string;
  /** Falls back to a guess from the extension. */
  mime?: string;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
  "3gp": "video/3gpp",
  m4a: "audio/m4a",
  mp3: "audio/mpeg",
  aac: "audio/aac",
  wav: "audio/wav",
  caf: "audio/x-caf",
};

function guessMime(name: string) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export const chatApi = {
  conversations: (token: string) =>
    http.get<ChatConversation[]>(ENDPOINTS.chat.conversations, token),

  history: (userId: string, token: string) =>
    http.get<ChatMessage[]>(ENDPOINTS.chat.history(userId), token),

  /** Online state when the thread opens; live changes arrive on the `presence` event. */
  presence: (userId: string, token: string) =>
    http.get<{ userId: string; online: boolean }>(ENDPOINTS.chat.presence(userId), token),

  /** Only the sender may delete; the bubble disappears for both sides. */
  deleteMessage: (messageId: string, token: string) =>
    http.del<{ deleted: boolean; id: string }>(ENDPOINTS.chat.message(messageId), token),

  markRead: (userId: string, token: string) =>
    http.post<{ updated: number }>(ENDPOINTS.chat.read(userId), undefined, token),

  /**
   * Send an image / video / voice note as `multipart/form-data`. The server
   * uploads it, saves the message and pushes `chat_new` to both sides — so the
   * bubble also arrives over the socket, exactly like a text message.
   */
  sendMedia: (
    to: string,
    file: ChatUpload,
    token: string,
    text?: string,
  ): Promise<ChatMessage> => {
    const name = file.name || file.uri.split("/").pop() || "upload";
    const form = new FormData();
    form.append("file", {
      uri: file.uri,
      name,
      type: file.mime || guessMime(name),
    } as any);
    form.append("to", to);
    if (text?.trim()) form.append("text", text.trim());
    return http.upload<ChatMessage>(ENDPOINTS.chat.send, form, token);
  },

  friends: (token: string) => http.get<ConnectionUser[]>("/api/follow/friends", token),

  newUsers: (token: string) => http.get<ConnectionUser[]>("/api/users/new", token),

  byInterest: (token: string) => http.get<ConnectionUser[]>("/api/users/by-interest", token),
};
