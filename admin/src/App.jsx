import { useEffect, useState } from "react";
import { api, auth } from "./lib/api";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Banners from "./pages/Banners.jsx";
import Pages from "./pages/Pages.jsx";
import Settings from "./pages/Settings.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "users", label: "All Users", icon: "👥" },
  { key: "banners", label: "Banners", icon: "🖼️" },
  { key: "pages", label: "Pages (Privacy/Terms)", icon: "📄" },
  { key: "settings", label: "Site Settings", icon: "⚙️" },
];

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    if (!auth.getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setAdmin)
      .catch(() => auth.clear())
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    auth.clear();
    setAdmin(null);
  };

  if (loading) return <div className="screen-center muted">Loading…</div>;
  if (!admin) return <Login onLogin={setAdmin} />;

  const active = NAV.find((n) => n.key === view) || NAV[0];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="s-brand">
          <div className="dot">💘</div>
          <b>Dating CMS</b>
        </div>
        {NAV.map((n) => (
          <button
            key={n.key}
            className={"nav-item" + (view === n.key ? " active" : "")}
            onClick={() => setView(n.key)}
          >
            <span>{n.icon}</span> {n.label}
          </button>
        ))}
        <div className="spacer" />
        <button className="nav-item logout" onClick={logout}>
          ⎋ Logout
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <h2>{active.label}</h2>
          <div className="admin-chip">
            <div className="meta">
              <div className="name">{admin.name}</div>
              <div className="role">{admin.role}</div>
            </div>
            <div className="avatar">{(admin.name || "A").charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" && <Dashboard />}
          {view === "users" && <Users />}
          {view === "banners" && <Banners />}
          {view === "pages" && <Pages />}
          {view === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}
