import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="empty">{err}</div>;
  if (!stats) return <div className="empty">Loading…</div>;

  const cards = [
    { k: "Total Users", v: stats.totalUsers, accent: true },
    { k: "Active", v: stats.activeUsers },
    { k: "Banned", v: stats.bannedUsers },
    { k: "Completed Profiles", v: stats.completedProfiles },
    { k: "New Today", v: stats.newToday },
  ];

  return (
    <>
      <div className="cards">
        {cards.map((c) => (
          <div key={c.k} className={"card" + (c.accent ? " accent" : "")}>
            <div className="k">{c.k}</div>
            <div className="v">{c.v ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Members by gender</h3></div>
        <div className="cards" style={{ margin: 0, padding: 18 }}>
          {Object.entries(stats.byGender || {}).map(([k, v]) => (
            <div key={k} className="card">
              <div className="k">{k}</div>
              <div className="v small">{v ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
