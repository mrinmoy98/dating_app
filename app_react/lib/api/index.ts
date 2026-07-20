import { authApi } from "./auth";
import { chatApi } from "./chat";
import { cmsApi } from "./cms";
import { discoverApi } from "./discover";
import { matchApi } from "./match";
import { notificationApi } from "./notification";
import { profileApi } from "./profile";
import { socialApi } from "./social";
import { uploadApi } from "./upload";

// Re-export everything so callers can keep importing from "lib/api".
export * from "./types";
export { authApi } from "./auth";
export { profileApi } from "./profile";
export { discoverApi } from "./discover";
export { matchApi } from "./match";
export { socialApi } from "./social";
export { chatApi } from "./chat";
export { notificationApi } from "./notification";
export { cmsApi } from "./cms";
export { uploadApi } from "./upload";
export { http } from "./http";
export { ENDPOINTS } from "./endpoints";

/**
 * Flat facade combining every module — lets existing callers keep using
 * `api.sendOtp(...)`, `api.me(...)`, `api.discover(...)`, etc.
 *
 * New code can also import a single module: `import { authApi } from "lib/api"`.
 */
export const api = {
  ...authApi,
  ...profileApi,
  ...discoverApi,
  ...matchApi,
  ...socialApi,
  ...chatApi,
  ...notificationApi,
  ...cmsApi,
  ...uploadApi,
};
