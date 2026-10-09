import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> YOUR NEXT MOVIE NIGHT</p>
        <h1>Create account<span className="heading-dot">.</span></h1>
        <p className="auth-card__intro">Create an account to book seats and keep your tickets together.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit}>
          <label>Full name<input name="fullName" autoComplete="name" maxLength="100" required value={form.fullName} onChange={update} /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" required value={form.email} onChange={update} /></label>
          <label>Phone number <span className="optional-label">(optional)</span><input name="phoneNumber" type="tel" autoComplete="tel" maxLength="30" value={form.phoneNumber} onChange={update} /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength="8" maxLength="72" required value={form.password} onChange={update} /><small>Use at least 8 characters.</small></label>
          <button className="button-primary" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="auth-card__switch">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
