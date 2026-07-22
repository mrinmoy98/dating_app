import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Pages() {
  const [rows, setRows] = useState([]);
  const [sel, setSel] = useState(null); // selected page for editing
  const [form, setForm] = useState({ title: "", content: "", is_published: true });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPage, setNewPage] = useState({ slug: "", title: "" });

  const load = () => api.listPages().then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);

  const select = (p) => {
    setSel(p);
    setForm({ title: p.title, content: p.content || "", is_published: p.is_published });
  };

  const save = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await api.updatePage(sel._id, form);
      await load();
      alert("Saved ✅");
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!newPage.slug.trim() || !newPage.title.trim()) return alert("Slug and title required.");
    try {
      await api.createPage({ slug: newPage.slug.trim().toLowerCase().replace(/\s+/g, "-"), title: newPage.title.trim() });
      setCreating(false);
      setNewPage({ slug: "", title: "" });
      load();
    } catch (e) { alert(e.message); }
  };

  const remove = async (p) => {
    if (!confirm(`Delete page "${p.title}"?`)) return;
    try {
      await api.deletePage(p._id);
      alert(`"${p.title}" deleted ✅`);
    } catch (e) {
      alert(e.message);
    }
    if (sel?._id === p._id) setSel(null);
    load();
  };

  return (
    <div className="pages-wrap">
      <div className="panel pages-list">
        <div className="panel-head">
          <h3>Pages</h3>
          <button className="btn-sm primary" onClick={() => setCreating(true)}>+ New</button>
        </div>
        {rows.map((p) => (
          <button key={p._id} className={"page-item" + (sel?._id === p._id ? " active" : "")} onClick={() => select(p)}>
            <div>
              <b>{p.title}</b>
              <span className="muted small">/{p.slug}</span>
            </div>
            <span className={"dot-status " + (p.is_published ? "on" : "off")} />
          </button>
        ))}
        {rows.length === 0 && <div className="empty">No pages.</div>}
      </div>

      <div className="panel pages-editor">
        {!sel && <div className="empty">Select a page to edit its content.</div>}
        {sel && (
          <>
            <div className="panel-head">
              <h3>Edit · /{sel.slug}</h3>
              <button className="del btn-sm" onClick={() => remove(sel)}>Delete</button>
            </div>
            <div className="form-body">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <label>Content (HTML allowed)</label>
              <textarea rows={14} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the page content here…" />
              <label className="check">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published
              </label>
              <button className="btn-sm primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </>
        )}
      </div>

      {creating && (
        <div className="modal-backdrop" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New page</h3>
            <label>Slug (URL id)</label>
            <input value={newPage.slug} onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })} placeholder="faq" />
            <label>Title</label>
            <input value={newPage.title} onChange={(e) => setNewPage({ ...newPage, title: e.target.value })} placeholder="FAQ" />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn-sm primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
