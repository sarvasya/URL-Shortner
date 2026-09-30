import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getError } from "../services/api";

const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "Never");

export default function Analytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/urls/${id}/analytics`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getError(err)));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
      <Link to="/dashboard">← Back to dashboard</Link>
      <h2>Analytics for {data.shortCode}</h2>
      <p className="muted truncate">{data.originalUrl}</p>
      <div className="stats">
        <div className="card stat"><h3>{data.totalClicks}</h3><p>Total clicks</p></div>
        <div className="card stat"><h3>{formatDateTime(data.createdDate)}</h3><p>Created</p></div>
        <div className="card stat"><h3>{formatDateTime(data.lastClicked)}</h3><p>Last clicked</p></div>
      </div>
    </>
  );
}
