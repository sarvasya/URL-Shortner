import { useState } from "react";
import api, { getError } from "../services/api";

export default function UrlForm({ onCreated }) {
  const [form, setForm] = useState({ originalUrl: "", customAlias: "", expiresAt: "" });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCreated(null);
    setLoading(true);
    try {
      // Only send optional fields when filled in
      const body = { originalUrl: form.originalUrl };
      if (form.customAlias) body.customAlias = form.customAlias;
      if (form.expiresAt) body.expiresAt = new Date(form.expiresAt + "T23:59:59").toISOString();

      const res = await api.post("/urls", body);
      setCreated(res.data.data);
      setForm({ originalUrl: "", customAlias: "", expiresAt: "" });
      onCreated();
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(created.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Create short URL</h2>
      <input name="originalUrl" type="url" placeholder="https://example.com/very/long/url"
        value={form.originalUrl} onChange={handleChange} required />
      <div className="row">
        <input name="customAlias" placeholder="Custom alias (optional)"
          value={form.customAlias} onChange={handleChange} />
        <input name="expiresAt" type="date" title="Expiration (optional)"
          value={form.expiresAt} onChange={handleChange} />
      </div>
      <button disabled={loading}>{loading ? "Creating..." : "Create Short URL"}</button>
      {error && <p className="error">{error}</p>}
      {created && (
        <div className="result">
          <a href={created.shortUrl} target="_blank" rel="noreferrer">{created.shortUrl}</a>
          <button type="button" className="btn-small" onClick={copy}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </form>
  );
}
