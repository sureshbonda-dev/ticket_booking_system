import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';
import { authApi } from '../../auth/authApi.js';
import { catalogApi } from '../../catalog/catalogApi.js';
import { bookingApi } from '../../booking/bookingApi.js';

export default function AccountPage() {
  const { token, user, setUser } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState({ fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '' });
  const [bookings, setBookings] = useState([]);
  const [seatLabels, setSeatLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(location.state?.notice || '');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([authApi.me(token), bookingApi.myBookings(token)])
      .then(async ([currentUser, currentBookings]) => {
        if (!active) return;
        setUser(currentUser);
        setProfile({ fullName: currentUser.fullName, phoneNumber: currentUser.phoneNumber || '' });
        setBookings(currentBookings);
        const confirmed = currentBookings.filter((booking) => booking.status === 'CONFIRMED');
        const mappings = await Promise.all(confirmed.map(async (booking) => {
          try {
            const showtime = await catalogApi.getShowtime(booking.showtimeId);
            const catalogSeats = await catalogApi.getSeats(showtime.screenId);
            const labels = new Map(catalogSeats.map((seat) => [seat.id, `${seat.rowLabel}${seat.seatNumber}`]));
            return [booking.id, booking.seatIds.map((id) => labels.get(id) || `#${id}`).join(', ')];
          } catch { return [booking.id, booking.seatIds.map((id) => `#${id}`).join(', ')]; }
        }));
        if (active) setSeatLabels(Object.fromEntries(mappings));
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, setUser]);

  async function saveProfile(event) {
    event.preventDefault();
    setMessage(''); setError('');
    try {
      const updated = await authApi.updateProfile(token, profile);
      setUser(updated);
      sessionStorage.setItem('cinema.user', JSON.stringify(updated));
      setMessage('Your profile has been saved.');
    } catch (saveError) { setError(saveError.message); }
  }

  async function cancelBooking(bookingId) {
    if (!window.confirm('Cancel this booking? The seats will be released and the booking cannot be restored.')) return;
    setBusyId(bookingId); setError(''); setMessage('');
    try {
      const updated = await bookingApi.cancel(token, bookingId);
      setBookings((current) => current.map((booking) => booking.id === bookingId ? updated : booking));
      setMessage('Booking cancelled. The seats are available again.');
    } catch (cancelError) { setError(cancelError.message); }
    finally { setBusyId(null); }
  }

  async function downloadPdf(bookingId, reference) {
    setBusyId(bookingId); setError('');
    try {
      const blob = await bookingApi.downloadPdf(token, bookingId);
      saveBlob(blob, `${reference}.pdf`);
    } catch (downloadError) { setError(downloadError.message); }
    finally { setBusyId(null); }
  }

  return (
    <section className="account-page">
      <div className="page-heading"><p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> YOUR CINEMA ACCOUNT</p><h1>My account<span className="heading-dot">.</span></h1><p>Manage your profile and find your tickets.</p></div>
      {message && <div className="notice-banner" role="status">{message}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="account-grid">
        <section className="account-panel">
          <div className="panel-heading"><h2>Profile</h2><span className="role-badge">{user?.role}</span></div>
          <form className="form-stack" onSubmit={saveProfile}>
            <label>Full name<input maxLength="100" required value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></label>
            <label>Email address<input type="email" value={user?.email || ''} disabled /></label>
            <label>Phone number<input type="tel" maxLength="30" value={profile.phoneNumber} onChange={(event) => setProfile({ ...profile, phoneNumber: event.target.value })} /></label>
            <button className="button-primary" type="submit">Save profile</button>
          </form>
        </section>
        <section className="account-panel account-panel--bookings">
          <div className="panel-heading"><h2>Booking history</h2><span className="quiet-count">{bookings.length} BOOKINGS</span></div>
          {loading ? <p className="muted">Loading your bookings…</p> : bookings.length === 0 ? <div className="empty-inline"><p>You don't have any bookings yet.</p><Link className="text-link" to="/">Browse movies →</Link></div> : (
            <div className="booking-history-list">
              {bookings.map((booking) => {
                const canCancel = booking.status === 'CONFIRMED' && new Date(booking.showtimeStartsAt).getTime() - Date.now() > 2 * 60 * 60 * 1000;
                return <article className="history-card" key={booking.id}>
                  <div className="history-card__top"><div><span className="quiet-count">{booking.bookingReference}</span><h3>{booking.status.replaceAll('_', ' ')}</h3></div><span className={`status-pill status-pill--${booking.status.toLowerCase()}`}>{booking.status.replaceAll('_', ' ')}</span></div>
                  <p className="history-card__meta">Showtime #{booking.showtimeId} · {formatDate(booking.showtimeStartsAt)}</p>
                  <p className="history-card__meta">Seats: {seatLabels[booking.id] || booking.seatIds.map((id) => `#${id}`).join(', ')} · ₹{Number(booking.amount).toFixed(2)}</p>
                  <div className="history-card__actions">
                    {booking.status === 'CONFIRMED' && <><Link className="button-secondary" to={`/tickets/${booking.id}`}>View ticket</Link><button className="button-secondary" type="button" disabled={busyId === booking.id} onClick={() => downloadPdf(booking.id, booking.bookingReference)}>{busyId === booking.id ? 'Please wait…' : 'Download PDF'}</button>{canCancel ? <button className="text-button text-button--danger" type="button" disabled={busyId === booking.id} onClick={() => cancelBooking(booking.id)}>Cancel</button> : <span className="quiet-note">Cancellation window closed</span>}</>}
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function saveBlob(blob, filename) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
