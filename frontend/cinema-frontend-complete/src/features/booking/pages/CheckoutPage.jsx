import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';
import { bookingApi } from '../bookingApi.js';

function getPendingCheckout(state) {
  if (state?.lock) return state;
  try { return JSON.parse(sessionStorage.getItem('cinema.pendingCheckout') || 'null'); } catch { return null; }
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const pending = useMemo(() => getPendingCheckout(location.state), [location.state]);
  const [paymentOutcome, setPaymentOutcome] = useState('SUCCESS');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const secondsLeft = pending?.lock?.expiresAt ? Math.max(0, Math.floor((new Date(pending.lock.expiresAt).getTime() - now) / 1000)) : 0;

  useEffect(() => {
    if (!pending?.lock?.expiresAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [pending?.lock?.expiresAt]);

  async function pay() {
    if (!pending?.lock?.lockId) return;
    setBusy(true);
    setError('');
    try {
      const booking = await bookingApi.confirm(token, { lockId: pending.lock.lockId, paymentOutcome });
      sessionStorage.removeItem('cinema.pendingCheckout');
      if (booking.status === 'CONFIRMED') navigate(`/tickets/${booking.id}`, { replace: true });
      else navigate('/account', { replace: true, state: { notice: 'The mock payment was declined. The seat hold has been released.' } });
    } catch (payError) {
      setError(payError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!pending?.lock?.lockId || !pending.showtime) {
    return <section className="booking-page"><div className="state-panel"><div><h3>Your seat hold is missing</h3><p>Choose seats again to start checkout.</p><Link className="button-primary button-primary--inline" to="/">Browse movies</Link></div></div></section>;
  }

  const seats = pending.selectedSeats || [];
  const total = Number(pending.showtime.basePrice || 0) * seats.length;
  const formattedLeft = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <section className="booking-page">
      <div className="booking-page__top"><span>SEATS HELD UNTIL {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(pending.lock.expiresAt))}</span><span>STEP 2 OF 2 · CHECKOUT</span></div>
      <div className="checkout-layout">
        <div className="checkout-card">
          <p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> REVIEW YOUR BOOKING</p>
          <h1>Almost there<span className="heading-dot">.</span></h1>
          <div className="checkout-details"><h2>{pending.showtime.movieTitle}</h2><p>{pending.showtime.theaterName} · {pending.showtime.screenName}</p><p>{formatDate(pending.showtime.startsAt)}</p><p><strong>Seats:</strong> {seats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ')}</p></div>
          <div className="hold-countdown">Your seats are held for <strong>{formattedLeft}</strong></div>
          <div className="payment-choice">
            <h3>Payment (development mode)</h3>
            <p>This project currently uses a mock payment result. No card details are collected.</p>
            <label><input type="radio" name="paymentOutcome" value="SUCCESS" checked={paymentOutcome === 'SUCCESS'} onChange={() => setPaymentOutcome('SUCCESS')} /> Simulate successful payment</label>
            <label><input type="radio" name="paymentOutcome" value="FAILURE" checked={paymentOutcome === 'FAILURE'} onChange={() => setPaymentOutcome('FAILURE')} /> Simulate declined payment</label>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
        </div>
        <aside className="booking-summary"><p className="summary-label">PAYMENT SUMMARY</p><div className="summary-line"><span>{seats.length} × tickets</span><strong>₹{Number(pending.showtime.basePrice).toFixed(2)}</strong></div><div className="summary-line summary-line--total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div><button className="button-primary" type="button" disabled={busy || secondsLeft === 0} onClick={pay}>{busy ? 'Processing…' : secondsLeft === 0 ? 'Seat hold expired' : `Confirm · ₹${total.toFixed(2)}`}</button>{secondsLeft === 0 && <Link className="text-link checkout-reselect" to={`/showtimes/${pending.showtime.id}/seats`} state={{ showtime: pending.showtime }}>Select seats again</Link>}<p className="summary-note">The backend will confirm or decline this mock payment.</p></aside>
      </div>
    </section>
  );
}

function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value)); }
