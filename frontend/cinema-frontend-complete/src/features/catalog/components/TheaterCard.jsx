export default function TheaterCard({ theater, showtimes = [] }) {
  const nextShow = [...showtimes]
    .filter((showtime) => showtime.theaterId === theater.id)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];

  return (
    <article className="theater-card">
      <div className="theater-card__icon" aria-hidden="true">C</div>
      <div className="theater-card__content">
        <h3>{theater.name}</h3>
        <p>{theater.address}</p>
        <span className="theater-card__city">{theater.city}</span>
      </div>
      <div className="theater-card__next">
        <span>{nextShow ? 'NEXT SHOW' : 'SHOWTIMES'}</span>
        <strong>{nextShow ? formatTime(nextShow.startsAt) : 'Coming soon'}</strong>
        {nextShow && <small>from ₹{Number(nextShow.basePrice).toFixed(0)}</small>}
      </div>
    </article>
  );
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
