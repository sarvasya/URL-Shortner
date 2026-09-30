import { useCallback, useEffect, useState } from "react";
import api, { getError } from "../services/api";
import UrlForm from "../components/UrlForm.jsx";
import UrlTable from "../components/UrlTable.jsx";

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/urls", { params: { page, limit: 10 } });
      setUrls(res.data.data);
      setTotalPages(res.data.totalPages);
      setError("");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const handleDelete = async (url) => {
    if (!window.confirm(`Delete ${url.shortCode}?`)) return;
    try {
      await api.delete(`/urls/${url.id}`);
      fetchUrls();
    } catch (err) {
      setError(getError(err));
    }
  };

  const handleToggle = async (url) => {
    try {
      await api.patch(`/urls/${url.id}`, { isActive: !url.isActive });
      fetchUrls();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <>
      <UrlForm onCreated={() => (page === 1 ? fetchUrls() : setPage(1))} />
      <h2>My URLs</h2>
      {error && <p className="error">{error}</p>}
      {loading ? <p>Loading...</p> : <UrlTable urls={urls} onDelete={handleDelete} onToggle={handleToggle} />}
      <div className="pagination">
        <button className="btn-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn-small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </>
  );
}
