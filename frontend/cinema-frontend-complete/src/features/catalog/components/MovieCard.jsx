const posterStyles = [
  'poster--violet',
  'poster--blue',
  'poster--rose',
  'poster--green',
];

export default function MovieCard({ movie, showtimes = [], index = 0, onChooseShowtime }) {
  const upcoming = [...showtimes].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const posterClass = posterStyles[index % posterStyles.length];

  return (
    <article className="movie-card">
      <div className={`movie-card__poster ${posterClass}`}>
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className="poster__eyebrow">NOW SHOWING</span>
        <span className="poster__title">{movie.title}</span>
        <span className="poster__orbit" aria-hidden="true" />
        {movie.rating != null && <span className="poster__rating">★ {Number(movie.rating).toFixed(1)}</span>}
      </div>

      <div className="movie-card__body">
        <div className="movie-card__heading">
          <div>
            <p className="movie-card__genre">{movie.genre || 'FEATURE FILM'}</p>
            <h3>{movie.title}</h3>
          </div>
          <span className="movie-card__duration">{movie.durationMinutes} min</span>
        </div>
        {movie.description && <p className="movie-card__description">{movie.description}</p>}

        <div className="movie-card__showtimes">
          <span className="showtimes-label">SHOWTIMES</span>
          {upcoming.length > 0 ? (
            <div className="showtime-list">
              {upcoming.map((showtime) => (
                <button className="showtime-chip" type="button" key={showtime.id} onClick={() => onChooseShowtime(showtime)} title={`${showtime.theaterName} · ${formatDate(showtime.startsAt)}`}>
                  <strong>{formatTime(showtime.startsAt)}</strong><small>{showtime.theaterName}</small><span>₹{Number(showtime.basePrice).toFixed(0)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="no-showtimes">No upcoming showtimes</p>
          )}
        </div>
      </div>
    </article>
  );
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
