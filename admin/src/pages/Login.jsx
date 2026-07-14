import { useState } from "react";
import { api, auth } from "../lib/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, admin } = await api.login(email.trim(), password);
      // Super Admin only.
      if (admin.role !== "superadmin") {
        setError("Super Admin access only.");
        return;
      }
      auth.setToken(token);
      onLogin(admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">
          <div className="logo">💘</div>
          <h1>Super Admin</h1>
          <p>Sign in to the Dating App dashboard</p>
        </div>

        <form onSubmit={submit}>
          {error && <div className="error">{error}</div>}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@datingapp.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="pw">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="hint">Restricted to Super Admin accounts</p>
      </div>
    </div>
  );
}
