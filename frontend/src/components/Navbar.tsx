/** Top navigation bar with auth-aware links. */

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        LabAssist
      </Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <span className="nav-user">
              {user?.username} ({user?.role})
            </span>
            <button onClick={logout} className="nav-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
