import { Link } from "react-router-dom";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const getStatus = (url) => {
  if (!url.isActive) return "Disabled";
  if (url.expiresAt && new Date(url.expiresAt) < new Date()) return "Expired";
  return "Active";
};

export default function UrlTable({ urls, onDelete, onToggle }) {
  if (urls.length === 0) return <p className="muted">No URLs yet. Create your first one above.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Original URL</th><th>Short URL</th><th>Created</th>
            <th>Clicks</th><th>Expires</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => {
            const status = getStatus(url);
            return (
              <tr key={url.id}>
                <td className="truncate" title={url.originalUrl}>{url.originalUrl}</td>
                <td><a href={url.shortUrl} target="_blank" rel="noreferrer">{url.shortCode}</a></td>
                <td>{formatDate(url.createdAt)}</td>
                <td>{url.clickCount}</td>
                <td>{formatDate(url.expiresAt)}</td>
                <td><span className={`badge ${status.toLowerCase()}`}>{status}</span></td>
                <td className="actions">
                  <button className="btn-small" onClick={() => navigator.clipboard.writeText(url.shortUrl)}>Copy</button>
                  <button className="btn-small" onClick={() => onToggle(url)}>
                    {url.isActive ? "Disable" : "Enable"}
                  </button>
                  <Link className="btn-small" to={`/analytics/${url.id}`}>Stats</Link>
                  <button className="btn-small danger" onClick={() => onDelete(url)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
