import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [pg, setPg] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (search.trim()) params.search = search.trim();
    if (status) params.status = status;
    if (gender) params.gender = gender;
    api
      .listUsers(params)
      .then((res) => {
        setRows(res.data || []);
        setPg(res.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // reload on filters/page (debounce search)
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, gender]);

  const setStatusFor = async (u) => {
    const next = u.status === "banned" ? "active" : "banned";
    await api.setUserStatus(u._id, next).catch((e) => alert(e.message));
    load();
  };
  const remove = async (u) => {
    if (!confirm(`Delete ${u.first_name || "this user"}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u._id);
      alert(`${u.first_name || "User"} deleted ✅`);
    } catch (e) {
      alert(e.message);
    }
    load();
  };

  const avatar = (u) => {
    const url = u.photos?.[0]?.url;
    const initial = (u.first_name || u.phone || "?").charAt(0).toUpperCase();
    return url ? <img className="av" src={url} alt="" /> : <div className="av">{initial}</div>;
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>All Users</h3>
        <input placeholder="Search name / phone / location…" value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
        <select value={gender} onChange={(e) => { setPage(1); setGender(e.target.value); }}>
          <option value="">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>User</th><th>Phone</th><th>Email</th><th>Gender</th><th>Location</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7"><div className="empty">Loading…</div></td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan="7"><div className="empty">No users found.</div></td></tr>}
            {!loading && rows.map((u) => (
              <tr key={u._id}>
                <td><div className="u-cell">{avatar(u)}<b>{u.first_name || "Unknown"} {u.last_name || ""}</b></div></td>
                <td>{u.phone || "—"}</td>
                <td>{u.email || "—"}</td>
                <td>{u.gender || "—"}</td>
                <td>{u.address?.city || u.location || "—"}</td>
                <td><span className={"badge " + (u.status === "banned" ? "banned" : "active")}>{u.status || "active"}</span></td>
                <td>
                  <div className="act">
                    <button className={u.status === "banned" ? "activate" : "ban"} onClick={() => setStatusFor(u)}>
                      {u.status === "banned" ? "Activate" : "Ban"}
                    </button>
                    <button className="del" onClick={() => remove(u)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>Page {pg.page} of {pg.totalPages} · {pg.total} users</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button disabled={page >= pg.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
