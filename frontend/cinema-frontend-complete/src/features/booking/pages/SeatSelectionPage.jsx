import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';
import { catalogApi } from '../../catalog/catalogApi.js';
import { bookingApi } from '../bookingApi.js';

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const routeShowtime = location.state?.showtime;
  const [showtime, setShowtime] = useState(routeShowtime || null);
  const [seats, setSeats] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setLoading(true);
    Promise.all([
      routeShowtime?.id === Number(showtimeId) ? Promise.resolve(routeShowtime) : catalogApi.getShowtime(showtimeId),
      bookingApi.seatAvailability(token, showtimeId),
    ])
      .then(([showtimeData, seatData]) => {
        if (!current) return;
        setShowtime(showtimeData);
        setSeats(seatData);
      })
      .catch((loadError) => { if (current) setError(loadError.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [showtimeId, token, routeShowtime]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      bookingApi.seatAvailability(token, showtimeId).then((freshSeats) => {
        setSeats(freshSeats);
        const availableIds = new Set(freshSeats.filter((seat) => seat.status === 'AVAILABLE').map((seat) => seat.seatId));
        setSelectedIds((current) => current.filter((id) => availableIds.has(id)));
      }).catch(() => {});
    }, 15000);
    return () => window.clearInterval(timer);
  }, [showtimeId, token]);

  const rows = useMemo(() => {
    const grouped = new Map();
    for (const seat of seats) {
      const row = grouped.get(seat.rowLabel) || [];
      row.push(seat);
      grouped.set(seat.rowLabel, row);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, rowSeats]) => [label, rowSeats.sort((a, b) => a.seatNumber - b.seatNumber)]);
  }, [seats]);

  function toggleSeat(seat) {
    if (seat.status !== 'AVAILABLE') return;
    setSelectedIds((current) => {
      if (current.includes(seat.seatId)) return current.filter((id) => id !== seat.seatId);
      if (current.length >= 10) return current;
      return [...current, seat.seatId];
    });
  }

  async function continueToCheckout() {
    setError('');
    setBusy(true);
    try {
      const lock = await bookingApi.lockSeats(token, { showtimeId: Number(showtimeId), seatIds: selectedIds });
      const selectedSeats = seats.filter((seat) => selectedIds.includes(seat.seatId));
      const pending = { lock, showtime, selectedSeats };
      sessionStorage.setItem('cinema.pendingCheckout', JSON.stringify(pending));
      navigate('/checkout', { state: pending });
    } catch (lockError) {
      setError(lockError.message);
      const fresh = await bookingApi.seatAvailability(token, showtimeId).catch(() => null);
      if (fresh) {
        setSeats(fresh);
        const availableIds = new Set(fresh.filter((seat) => seat.status === 'AVAILABLE').map((seat) => seat.seatId));
        setSelectedIds((current) => current.filter((id) => availableIds.has(id)));
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageState title="Loading seats…" />;
  if (error && !showtime) return <PageState title="Couldn't load this showtime" message={error} />;

  return (
    <section className="booking-page">
      <div className="booking-page__top"><Link className="back-link" to="/">← Back to movies</Link><span>STEP 1 OF 2 · CHOOSE SEATS</span></div>
      <div className="booking-layout">
        <div className="booking-main">
          <div className="booking-title"><p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> SELECT YOUR SEATS</p><h1>{showtime?.movieTitle}</h1><p>{showtime?.theaterName} · {showtime?.screenName} · {formatDate(showtime?.startsAt)}</p></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          {seats.length === 0 ? <div className="state-panel"><div><h3>No seats are configured</h3><p>Ask an administrator to add seats to this screen.</p></div></div> : (
            <div className="seat-map-wrap">
              <div className="screen-curve"><span>SCREEN</span></div>
              <div className="seat-map">
                {rows.map(([rowLabel, rowSeats]) => <div className="seat-row" key={rowLabel}><span className="seat-row__label">{rowLabel}</span>{rowSeats.map((seat) => {
                  const selected = selectedIds.includes(seat.seatId);
                  return <button key={seat.seatId} className={`seat seat--${seat.status.toLowerCase()}${selected ? ' seat--selected' : ''}${seat.category === 'VIP' ? ' seat--vip' : ''}`} type="button" disabled={seat.status !== 'AVAILABLE'} aria-label={`${rowLabel}${seat.seatNumber}, ${selected ? 'selected' : seat.status.toLowerCase()}`} onClick={() => toggleSeat(seat)}>{seat.seatNumber}</button>;
                })}</div>)}
              </div>
              <div className="seat-legend"><span><i className="seat-legend__available" /> Available</span><span><i className="seat-legend__selected" /> Selected</span><span><i className="seat-legend__reserved" /> Reserved</span><span><i className="seat-legend__vip" /> VIP</span></div>
              <p className="seat-refresh-note">Seat status refreshes automatically every 15 seconds.</p>
            </div>
          )}
        </div>
        <aside className="booking-summary">
          <p className="summary-label">YOUR SELECTION</p><h2>{selectedIds.length} {selectedIds.length === 1 ? 'seat' : 'seats'}</h2>
          <p className="summary-detail">{selectedIds.length ? seats.filter((seat) => selectedIds.includes(seat.seatId)).map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ') : 'Choose up to 10 available seats.'}</p>
          <div className="summary-line"><span>Price per seat</span><strong>₹{Number(showtime?.basePrice || 0).toFixed(2)}</strong></div>
          <div className="summary-line summary-line--total"><span>Estimated total</span><strong>₹{(Number(showtime?.basePrice || 0) * selectedIds.length).toFixed(2)}</strong></div>
          <button className="button-primary" type="button" disabled={!selectedIds.length || busy} onClick={continueToCheckout}>{busy ? 'Holding seats…' : 'Continue to checkout'}</button>
          <p className="summary-note">Seats are held for 10 minutes at checkout.</p>
        </aside>
      </div>
    </section>
  );
}

function PageState({ title, message }) { return <section className="booking-page"><div className="state-panel"><div><h3>{title}</h3>{message && <p>{message}</p>}<Link className="text-link" to="/">Back to movies</Link></div></div></section>; }
function formatDate(value) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''; }
