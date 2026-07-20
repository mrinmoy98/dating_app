import { http } from "./http";
import type { Banner, CmsPage, Language, SiteSettings } from "./types";

export const cmsApi = {
  languages: () => http.get<Language[]>("/api/cms/languages"),

  banners: () => http.get<Banner[]>("/api/cms/banners"),

  page: (slug: string) => http.get<CmsPage>(`/api/cms/pages/${slug}`),

  settings: () => http.get<SiteSettings>("/api/cms/settings"),
};
