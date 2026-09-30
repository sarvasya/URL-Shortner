import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Landing() {
  const { user } = useAuth();
  return (
    <section className="hero">
      <h1>Shorten links. Track clicks.</h1>
      <p className="muted">
        Create short links with custom aliases and expiration dates, then see how often they are used.
      </p>
      <Link className="btn" to={user ? "/dashboard" : "/register"}>
        {user ? "Go to Dashboard" : "Get Started"}
      </Link>
    </section>
  );
}
