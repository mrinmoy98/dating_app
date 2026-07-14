import { useEffect, useState } from "react";
import { api } from "../lib/api";

const FIELDS = [
  { key: "site_name", label: "Site name" },
  { key: "tagline", label: "Tagline" },
  { key: "logo_url", label: "Logo URL" },
  { key: "support_email", label: "Support email" },
  { key: "support_phone", label: "Support phone" },
  { key: "address", label: "Address" },
  { key: "facebook", label: "Facebook URL" },
  { key: "instagram", label: "Instagram URL" },
  { key: "twitter", label: "Twitter / X URL" },
  { key: "android_app_url", label: "Android app URL" },
  { key: "ios_app_url", label: "iOS app URL" },
];

export default function Settings() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { api.getSettings().then(setS).catch(() => {}); }, []);
  if (!s) return <div className="empty">Loading…</div>;

  const set = (k, v) => setS({ ...s, [k]: v });

  const onPickLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      set("logo_url", url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {};
      FIELDS.forEach((f) => (body[f.key] = s[f.key] ?? ""));
      body.min_age = Number(s.min_age) || 18;
      body.maintenance_mode = !!s.maintenance_mode;
      const updated = await api.updateSettings(body);
      setS(updated);
      alert("Settings saved ✅");
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="panel">
      <div className="panel-head"><h3>Site Settings</h3></div>
      <div className="form-body settings-grid">
        {FIELDS.map((f) => (
          <div key={f.key} className="field-col">
            <label>{f.label}</label>
            {f.key === "logo_url" ? (
              <>
                <label className="upload-btn block">
                  {uploading ? "Uploading…" : s.logo_url ? "📤 Change logo" : "📤 Upload logo"}
                  <input type="file" accept="image/*" hidden onChange={onPickLogo} disabled={uploading} />
                </label>
                {s.logo_url && <img src={s.logo_url} alt="" style={{ height: 40, marginTop: 6, borderRadius: 6 }} />}
              </>
            ) : (
              <input value={s[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            )}
          </div>
        ))}
        <div className="field-col">
          <label>Minimum age</label>
          <input type="number" value={s.min_age ?? 18} onChange={(e) => set("min_age", e.target.value)} />
        </div>
        <label className="check" style={{ alignSelf: "end" }}>
          <input type="checkbox" checked={!!s.maintenance_mode} onChange={(e) => set("maintenance_mode", e.target.checked)} /> Maintenance mode
        </label>
      </div>
      <div style={{ padding: "0 18px 18px" }}>
        <button className="btn-sm primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
      </div>
    </div>
  );
}
