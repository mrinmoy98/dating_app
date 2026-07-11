/**
 * Every backend endpoint path lives here — one place to see/edit the API surface.
 * Grouped by module (auth, upload).
 */
export const ENDPOINTS = {
  auth: {
    sendOtp: "/api/auth/send-otp",
    verifyOtp: "/api/auth/verify-otp",
    sendEmailOtp: "/api/auth/send-email-otp",
    verifyEmailOtp: "/api/auth/verify-email-otp",
    register: "/api/auth/register",
    me: "/api/auth/me",
    preferences: "/api/auth/preferences",
    discover: "/api/auth/discover",
    loginPassword: "/api/auth/login-password",
    setPassword: "/api/auth/set-password",
  },
  match: {
    swipe: "/api/match/swipe",
    matches: "/api/match/matches",
  },
  upload: {
    photos: "/api/upload/photos",
    video: "/api/upload/video",
  },
} as const;
