import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const target = location.state?.from;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login({ email, password });
      navigate(target?.pathname || '/', { replace: true, state: target?.state });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> WELCOME BACK</p>
        <h1>Sign in<span className="heading-dot">.</span></h1>
        <p className="auth-card__intro">Sign in to choose seats and manage your bookings.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit}>
          <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="button-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-card__switch">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </section>
  );
}
