import { useEffect, useState } from "react";
import { api } from "../lib/api";

const EMPTY = { title: "", sequence: 0, is_active: true };

export default function Languages() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null); // language object ({} = new) or null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .listLanguages()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm({ ...EMPTY, sequence: rows.length });
    setEditing({});
  };
  const openEdit = (l) => {
    setForm({ title: l.title, sequence: l.sequence ?? 0, is_active: !!l.is_active });
    setEditing(l);
  };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.title.trim()) return alert("Language name is required.");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        sequence: Number(form.sequence) || 0,
        is_active: !!form.is_active,
      };
      if (editing._id) await api.updateLanguage(editing._id, payload);
      else await api.createLanguage(payload);
      close();
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (l) => {
    await api.updateLanguage(l._id, { is_active: !l.is_active }).catch((e) => alert(e.message));
    load();
  };

  const remove = async (l) => {
    if (!confirm(`Delete language "${l.title}"?`)) return;
    await api.deleteLanguage(l._id).catch((e) => alert(e.message));
    load();
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Languages</h3>
        <span className="muted small">Shown to users during registration & profile edit</span>
        <button className="btn-sm primary" onClick={openNew}>
          + Add language
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Language</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="4">
                  <div className="empty">Loading…</div>
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="4">
                  <div className="empty">No languages yet. Add one to get started.</div>
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((l) => (
                <tr key={l._id}>
                  <td>{l.sequence ?? 0}</td>
                  <td>
                    <b>{l.title}</b>
                  </td>
                  <td>
                    <span className={"badge " + (l.is_active ? "active" : "banned")}>
                      {l.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="act">
                      <button onClick={() => openEdit(l)}>Edit</button>
                      <button className={l.is_active ? "ban" : "activate"} onClick={() => toggle(l)}>
                        {l.is_active ? "Hide" : "Show"}
                      </button>
                      <button className="del" onClick={() => remove(l)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing._id ? "Edit language" : "New language"}</h3>

            <label>Language name *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Bengali"
              autoFocus
            />

            <div className="row2">
              <div style={{ flex: 1 }}>
                <label>Order</label>
                <input
                  type="number"
                  value={form.sequence}
                  onChange={(e) => setForm({ ...form, sequence: e.target.value })}
                />
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />{" "}
                Active
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={close}>
                Cancel
              </button>
              <button className="btn-sm primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
