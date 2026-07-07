import { API_BASE_URL } from "../config";

/**
 * Thin fetch wrapper around the Dating App backend.
 * The backend wraps every response as { success, data } / { success:false, message }.
 */

export type Gender = "Male" | "Female" | "Other";
export type Habit = "Regularly" | "Sometimes" | "Never";

export interface SendOtpResult {
  target: string;
  message: string;
  expiresInMinutes: number;
  devCode?: string; // present only in dev mode
}

export interface VerifyOtpResult {
  isNewUser: boolean;
  registrationToken?: string; // when new user → continue onboarding
  token?: string; // when existing user → logged in
  user?: any;
}

export interface VerifyEmailResult {
  emailVerified: boolean;
  registrationToken: string; // upgraded token carrying the verified email
}

export interface RegisterPayload {
  first_name: string;
  dob?: string;
  gender?: Gender;
  location?: string;
  latitude?: number;
  longitude?: number;
  height_cm?: number;
  height_label?: string;
  relationship_status?: string;
  religion?: string;
  mother_tongue?: string;
  other_languages?: string[];
  smoking?: Habit;
  drinking?: Habit;
  relationship_goal?: string;
  photos?: string[];
  video_url?: string;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: any; token?: string } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

export const api = {
  sendOtp(phone: string) {
    return request<SendOtpResult>("/api/auth/send-otp", {
      method: "POST",
      body: { phone },
    });
  },

  verifyOtp(phone: string, code: string) {
    return request<VerifyOtpResult>("/api/auth/verify-otp", {
      method: "POST",
      body: { phone, code },
    });
  },

  sendEmailOtp(email: string, registrationToken: string) {
    return request<SendOtpResult>("/api/auth/send-email-otp", {
      method: "POST",
      body: { email },
      token: registrationToken,
    });
  },

  verifyEmailOtp(email: string, code: string, registrationToken: string) {
    return request<VerifyEmailResult>("/api/auth/verify-email-otp", {
      method: "POST",
      body: { email, code },
      token: registrationToken,
    });
  },

  register(payload: RegisterPayload, registrationToken: string) {
    return request<{ token: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: payload,
      token: registrationToken,
    });
  },

  me(token: string) {
    return request<any>("/api/auth/me", { token });
  },

  /**
   * Upload local image URIs (from expo-image-picker) as multipart/form-data.
   * Returns the public URLs to store on the profile.
   */
  async uploadPhotos(uris: string[], token: string): Promise<string[]> {
    const form = new FormData();
    uris.forEach((uri, i) => {
      const name = uri.split("/").pop() || `photo-${i}.jpg`;
      const ext = (name.split(".").pop() || "jpg").toLowerCase();
      form.append("files", {
        uri,
        name,
        type: `image/${ext === "jpg" ? "jpeg" : ext}`,
      } as any);
    });

    const res = await fetch(`${API_BASE_URL}/api/upload/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // let fetch set the multipart boundary
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || "Photo upload failed");
    }
    return (json?.data?.urls ?? json?.urls ?? []) as string[];
  },

  /** Upload a single intro video (local URI) and return its public URL. */
  async uploadVideo(uri: string, token: string): Promise<string> {
    const name = uri.split("/").pop() || "video.mp4";
    const ext = (name.split(".").pop() || "mp4").toLowerCase();
    const form = new FormData();
    form.append("file", {
      uri,
      name,
      type: `video/${ext === "mov" ? "quicktime" : ext}`,
    } as any);

    const res = await fetch(`${API_BASE_URL}/api/upload/video`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || "Video upload failed");
    }
    return (json?.data?.url ?? json?.url ?? "") as string;
  },
};
