import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getError } from "../services/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card narrow" onSubmit={handleSubmit}>
      <h2>Create account</h2>
      <input placeholder="Name" value={form.name} required
        onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input type="email" placeholder="Email" value={form.email} required
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password (min 6 characters)" value={form.password} required
        onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button disabled={loading}>{loading ? "Creating..." : "Register"}</button>
      {error && <p className="error">{error}</p>}
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}
