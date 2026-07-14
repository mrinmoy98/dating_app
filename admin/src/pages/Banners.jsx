import { useEffect, useState } from "react";
import { api } from "../lib/api";

const EMPTY = { title: "", image_url: "", link_url: "", position: 0, is_active: true };

export default function Banners() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null); // banner object or null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const load = () => api.listBanners().then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing({}); };
  const openEdit = (b) => { setForm({ ...EMPTY, ...b }); setEditing(b); };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.image_url.trim()) return alert("Please upload an image first.");
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        image_url: form.image_url.trim(),
        link_url: form.link_url,
        position: Number(form.position) || 0,
        is_active: !!form.is_active,
      };
      if (editing._id) await api.updateBanner(editing._id, payload);
      else await api.createBanner(payload);
      close();
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (b) => {
    if (!confirm("Delete this banner?")) return;
    await api.deleteBanner(b._id).catch((e) => alert(e.message));
    load();
  };
  const toggle = async (b) => {
    await api.updateBanner(b._id, { is_active: !b.is_active }).catch((e) => alert(e.message));
    load();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Banners</h3>
        <button className="btn-sm primary" onClick={openNew}>+ Add banner</button>
      </div>

      <div className="banner-grid">
        {rows.length === 0 && <div className="empty">No banners yet.</div>}
        {rows.map((b) => (
          <div className="banner-card" key={b._id}>
            <div className="banner-img" style={{ backgroundImage: `url(${b.image_url})` }}>
              <span className={"badge " + (b.is_active ? "active" : "banned")}>{b.is_active ? "Active" : "Hidden"}</span>
            </div>
            <div className="banner-body">
              <b>{b.title || "Untitled"}</b>
              <span className="muted small">#{b.position} · {b.link_url || "no link"}</span>
              <div className="act" style={{ marginTop: 8 }}>
                <button onClick={() => openEdit(b)}>Edit</button>
                <button className={b.is_active ? "ban" : "activate"} onClick={() => toggle(b)}>{b.is_active ? "Hide" : "Show"}</button>
                <button className="del" onClick={() => remove(b)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing._id ? "Edit banner" : "New banner"}</h3>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summer promo" />
            <label>Image *</label>
            <label className="upload-btn block">
              {uploading ? "Uploading…" : form.image_url ? "📤 Change image" : "📤 Upload image"}
              <input type="file" accept="image/*" hidden onChange={onPickImage} disabled={uploading} />
            </label>
            {form.image_url && <div className="banner-preview" style={{ backgroundImage: `url(${form.image_url})` }} />}
            <label>Link URL</label>
            <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://…" />
            <div className="row2">
              <div>
                <label>Position</label>
                <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <label className="check">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={close}>Cancel</button>
              <button className="btn-sm primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
