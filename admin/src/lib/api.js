const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "dating_admin_token";

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = "GET", body } = {}) {
  const token = auth.getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    auth.clear();
    throw new Error("Session expired");
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json; // { success, data, pagination? }
}

const data = (p, o) => request(p, o).then((j) => j.data ?? j);

export const api = {
  // ---- auth ----
  login: (email, password) => data("/admin/auth/login", { method: "POST", body: { email, password } }),
  me: () => data("/admin/auth/me"),

  // ---- users ----
  stats: () => data("/admin/users/stats"),
  listUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/users${q ? "?" + q : ""}`); // returns { data, pagination }
  },
  setUserStatus: (id, status) => data(`/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
  deleteUser: (id) => data(`/admin/users/${id}`, { method: "DELETE" }),

  // ---- CMS: image upload ----
  uploadImage: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const token = auth.getToken();
    const res = await fetch(`${API_URL}/admin/cms/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined, // let the browser set the multipart boundary
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || "Upload failed");
    return (json.data ?? json).url;
  },

  // ---- CMS: banners ----
  listBanners: () => data("/admin/cms/banners"),
  createBanner: (b) => data("/admin/cms/banners", { method: "POST", body: b }),
  updateBanner: (id, b) => data(`/admin/cms/banners/${id}`, { method: "PATCH", body: b }),
  deleteBanner: (id) => data(`/admin/cms/banners/${id}`, { method: "DELETE" }),

  // ---- CMS: pages ----
  listPages: () => data("/admin/cms/pages"),
  createPage: (p) => data("/admin/cms/pages", { method: "POST", body: p }),
  updatePage: (id, p) => data(`/admin/cms/pages/${id}`, { method: "PATCH", body: p }),
  deletePage: (id) => data(`/admin/cms/pages/${id}`, { method: "DELETE" }),

  // ---- CMS: languages ----
  listLanguages: () => data("/admin/cms/languages"),
  createLanguage: (l) => data("/admin/cms/languages", { method: "POST", body: l }),
  updateLanguage: (id, l) => data(`/admin/cms/languages/${id}`, { method: "PATCH", body: l }),
  deleteLanguage: (id) => data(`/admin/cms/languages/${id}`, { method: "DELETE" }),

  // ---- CMS: settings ----
  getSettings: () => data("/admin/cms/settings"),
  updateSettings: (s) => data("/admin/cms/settings", { method: "PUT", body: s }),
};
