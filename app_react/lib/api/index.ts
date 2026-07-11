import { authApi } from "./auth";
import { discoverApi } from "./discover";
import { matchApi } from "./match";
import { profileApi } from "./profile";
import { uploadApi } from "./upload";

// Re-export everything so callers can keep importing from "lib/api".
export * from "./types";
export { authApi } from "./auth";
export { profileApi } from "./profile";
export { discoverApi } from "./discover";
export { matchApi } from "./match";
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
  ...uploadApi,
};
