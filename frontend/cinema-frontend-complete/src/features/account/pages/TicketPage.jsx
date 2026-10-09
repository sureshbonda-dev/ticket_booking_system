import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';
import { catalogApi } from '../../catalog/catalogApi.js';
import { bookingApi } from '../../booking/bookingApi.js';

export default function TicketPage() {
  const { bookingId } = useParams();
  const { token } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [seatNames, setSeatNames] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    bookingApi.ticket(token, bookingId)
      .then(async (data) => {
        const event = await catalogApi.getShowtime(data.showtimeId).catch(() => null);
        let labels = [];
        if (event) {
          const seats = await catalogApi.getSeats(event.screenId).catch(() => []);
          const names = new Map(seats.map((seat) => [seat.id, `${seat.rowLabel}${seat.seatNumber}`]));
          labels = data.seatIds.map((id) => names.get(id) || `#${id}`);
        }
        if (active) { setTicket(data); setShowtime(event); setSeatNames(labels.length ? labels : data.seatIds.map((id) => `#${id}`)); }
      })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [token, bookingId]);

  async function download() {
    setBusy(true);
    try {
      const blob = await bookingApi.downloadPdf(token, bookingId);
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `${ticket.bookingReference}.pdf`; link.click(); URL.revokeObjectURL(url);
    } catch (downloadError) { setError(downloadError.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="ticket-page">
      <Link className="back-link" to="/account">← My bookings</Link>
      {error && !ticket ? <div className="state-panel state-panel--error"><div><h3>Ticket unavailable</h3><p>{error}</p></div></div> : !ticket ? <div className="state-panel"><div><h3>Loading your ticket…</h3></div></div> : (
        <article className="ticket-card">
          <div className="ticket-card__head"><span className="ticket-card__brand">CINEMA<span>.</span></span><span className="status-pill status-pill--confirmed">CONFIRMED</span></div>
          <p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> YOUR DIGITAL TICKET</p>
          <h1>{showtime?.movieTitle || `Showtime ${ticket.showtimeId}`}</h1>
          <p className="ticket-card__venue">{showtime ? `${showtime.theaterName} · ${showtime.screenName}` : 'Cinema booking'}</p>
          <div className="ticket-details">
            <div><span>DATE & TIME</span><strong>{formatDate(ticket.showtimeStartsAt)}</strong></div>
            <div><span>SEATS</span><strong>{seatNames.join(', ')}</strong></div>
            <div><span>BOOKING REFERENCE</span><strong>{ticket.bookingReference}</strong></div>
            <div><span>TOTAL PAID</span><strong>₹{Number(ticket.amount).toFixed(2)}</strong></div>
          </div>
          <div className="ticket-code"><span>Ticket verification code</span><code>{ticket.ticketCode}</code><small>The downloadable PDF contains the QR code for scanning at the cinema.</small></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button-primary" type="button" disabled={busy} onClick={download}>{busy ? 'Preparing PDF…' : 'Download PDF ticket'}</button>
        </article>
      )}
    </section>
  );
}

function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value)); }
