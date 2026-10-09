import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="site-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Cinema home">
          <span className="brand__mark" aria-hidden="true">C</span>
          <span>CINEMA<span className="brand__dot">.</span></span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Movies</NavLink>
          {user && <NavLink to="/account">My account</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="topbar__right">
          {user ? (
            <div className="signed-in"><span>{user.fullName}</span><button type="button" onClick={logout}>Sign out</button></div>
          ) : (
            <div className="auth-links"><NavLink to="/login">Sign in</NavLink><NavLink className="auth-links__join" to="/register">Join</NavLink></div>
          )}
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="footer">
        <NavLink className="brand brand--footer" to="/"><span className="brand__mark" aria-hidden="true">C</span><span>CINEMA<span className="brand__dot">.</span></span></NavLink>
        <span>GOOD STORIES. GREAT SEATS.</span>
        <span>© {new Date().getFullYear()} CINEMA</span>
      </footer>
    </div>
  );
}
