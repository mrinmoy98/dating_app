
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
  reels: {
    create: "/api/reels",
    feed: "/api/reels/feed",
    mine: "/api/reels/mine",
    byUser: (id: string) => `/api/reels/user/${id}`,
    like: (id: string) => `/api/reels/${id}/like`,
    view: (id: string) => `/api/reels/${id}/view`,
    remove: (id: string) => `/api/reels/${id}`,
  },
  upload: {
    photos: "/api/upload/photos",
    video: "/api/upload/video",
  },
} as const;
