import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getError } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card narrow" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={form.email} required
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" value={form.password} required
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      {error && <p className="error">{error}</p>}
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </form>
  );
}
