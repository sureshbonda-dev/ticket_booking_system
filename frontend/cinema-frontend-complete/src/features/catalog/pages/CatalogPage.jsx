import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CityPicker from '../components/CityPicker.jsx';
import MovieCard from '../components/MovieCard.jsx';
import TheaterCard from '../components/TheaterCard.jsx';
import { useCatalog } from '../useCatalog.js';

export default function CatalogPage() {
  const catalog = useCatalog();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const genres = useMemo(() => [...new Set(catalog.movies.map((movie) => movie.genre).filter(Boolean))].sort(), [catalog.movies]);
  const movies = useMemo(() => catalog.movies.filter((movie) => {
    const titleMatch = movie.title.toLowerCase().includes(search.trim().toLowerCase());
    const genreMatch = !genre || movie.genre === genre;
    return titleMatch && genreMatch;
  }), [catalog.movies, search, genre]);

  function chooseShowtime(showtime) {
    navigate(`/showtimes/${showtime.id}/seats`, { state: { showtime } });
  }

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <span className="eyebrow"><span className="eyebrow__line" /> THE BIG SCREEN, CLOSER</span>
          <h1>Make tonight<br />a <em>movie night.</em></h1>
          <p>Find something unforgettable to watch, right around the corner.</p>
          <a className="hero__link" href="#movies">EXPLORE WHAT'S ON <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__halo" />
          <div className="hero__ticket"><span>ADMIT ONE</span><strong>YOUR<br />NEXT<br /><i>STORY</i></strong><small>TONIGHT · ANY CITY</small></div>
          <span className="hero__spark hero__spark--one">✦</span><span className="hero__spark hero__spark--two">✦</span>
        </div>
        <div className="hero__city">
          <CityPicker cities={catalog.cities} value={catalog.selectedCity} onChange={catalog.setSelectedCity} disabled={catalog.loadingCities} />
          <p>Showing movies and theaters near you</p>
        </div>
        <div className="hero__index"><span>01</span> / DISCOVER</div>
      </section>

      <section className="catalog-section" id="movies">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> CURATED FOR {catalog.selectedCity || 'YOUR CITY'}</p>
            <h2>Now showing<span className="heading-dot">.</span></h2>
          </div>
          <div className="section-heading__right">
            <span>{catalog.loading ? 'UPDATING…' : `${movies.length} ${movies.length === 1 ? 'MOVIE' : 'MOVIES'}`}</span>
            <button className="refresh-button" type="button" onClick={catalog.refresh} disabled={catalog.loading || !catalog.selectedCity}><span aria-hidden="true">↻</span> Refresh</button>
          </div>
        </div>

        <div className="catalog-filters">
          <label className="search-field"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movies" aria-label="Search movies by title" /></label>
          <label className="genre-filter"><span>GENRE</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="">All genres</option>{genres.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>

        {location.state?.message && <p className="notice-banner">{location.state.message}</p>}
        {catalog.error ? (
          <div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon">!</span><div><h3>We couldn't load the catalog</h3><p>{catalog.error}</p></div><button className="button-dark" type="button" onClick={catalog.refresh}>Try again</button></div>
        ) : catalog.loading ? (
          <div className="movie-grid" aria-label="Loading movies">{[0, 1, 2].map((item) => <div className="skeleton-card" key={item}><div /><span /><span /></div>)}</div>
        ) : catalog.cities.length === 0 ? (
          <div className="state-panel"><span className="state-panel__icon">⌖</span><div><h3>No cities yet</h3><p>Add a theater and its city in the admin area to see it here.</p></div></div>
        ) : movies.length === 0 ? (
          <div className="state-panel"><span className="state-panel__icon">✳</span><div><h3>No matching movies in {catalog.selectedCity}</h3><p>Try another search or choose a different city.</p></div></div>
        ) : (
          <div className="movie-grid">
            {movies.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} showtimes={catalog.showtimes.filter((item) => item.movieId === movie.id)} onChooseShowtime={chooseShowtime} />)}
          </div>
        )}
      </section>

      <section className="theaters-section" id="theaters">
        <div className="section-heading section-heading--theaters">
          <div><p className="eyebrow"><span className="eyebrow__line" /> YOUR NEIGHBORHOOD</p><h2>Theaters near you<span className="heading-dot">.</span></h2></div>
          <span className="theater-count">{catalog.theaters.length} {catalog.theaters.length === 1 ? 'VENUE' : 'VENUES'}</span>
        </div>
        {!catalog.loading && !catalog.error && catalog.theaters.length > 0 && <div className="theater-list">{catalog.theaters.map((theater) => <TheaterCard key={theater.id} theater={theater} showtimes={catalog.showtimes} />)}</div>}
        {!catalog.loading && !catalog.error && catalog.cities.length > 0 && catalog.theaters.length === 0 && <p className="theater-empty">No theaters are listed in this city yet.</p>}
      </section>
    </>
  );
}
