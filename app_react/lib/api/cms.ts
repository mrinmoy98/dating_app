import { http } from "./http";
import type { Banner, CmsPage, Language, SiteSettings } from "./types";

/**
 * Public CMS content managed by the admin panel (no auth needed).
 * Languages drive the registration + profile language pickers.
 */
export const cmsApi = {
  /** Active languages, ordered by the admin's sequence. */
  languages: () => http.get<Language[]>("/api/cms/languages"),

  /** Active promo banners. */
  banners: () => http.get<Banner[]>("/api/cms/banners"),

  /** A published page, e.g. "privacy-policy" / "terms-of-service". */
  page: (slug: string) => http.get<CmsPage>(`/api/cms/pages/${slug}`),

  /** Global site settings. */
  settings: () => http.get<SiteSettings>("/api/cms/settings"),
};
