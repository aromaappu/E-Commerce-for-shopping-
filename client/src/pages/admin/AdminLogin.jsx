import { useState } from "react";
import { useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminLogin() {
  const { token, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (token) return <Navigate to={location.state?.from?.pathname || "/admin"} replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page login-page">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.png" alt="" />
        <h1>Admin Panel</h1>
        <p className="muted">Sign in to manage {`Trend Mart`}</p>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@trendmart.in"
          autoFocus
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-red btn-lg btn-block" disabled={busy}>
          {busy ? <i className="fas fa-spinner fa-spin" /> : "Sign In"}
        </button>
        <Link to="/" className="back-link">
          ← Back to store
        </Link>
      </form>
    </main>
  );
}
