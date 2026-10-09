import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';
import { authApi } from '../../auth/authApi.js';
import { catalogApi } from '../../catalog/catalogApi.js';

const TABS = ['Overview', 'Movies', 'Theaters & screens', 'Showtimes', 'Users'];

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [movieData, theaterData, showtimeData, userData] = await Promise.all([
        catalogApi.getMovies(), catalogApi.getTheaters(), catalogApi.getShowtimes(), authApi.users(token),
      ]);
      const screenGroups = await Promise.all(theaterData.map((theater) => catalogApi.getScreens(theater.id)));
      setMovies(movieData); setTheaters(theaterData); setShowtimes(showtimeData); setUsers(userData); setScreens(screenGroups.flat());
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const screensByTheater = useMemo(() => screens.reduce((groups, screen) => {
    groups[screen.theaterId] = [...(groups[screen.theaterId] || []), screen];
    return groups;
  }, {}), [screens]);

  async function runAction(action, successMessage) {
    setError(''); setMessage('');
    try { await action(); setMessage(successMessage); await load(); return true; }
    catch (actionError) { setError(actionError.message); return false; }
  }

  return (
    <section className="admin-page">
      <div className="page-heading page-heading--row"><div><p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> CINEMA MANAGEMENT</p><h1>Admin dashboard<span className="heading-dot">.</span></h1><p>Manage the catalog, venues, schedules, and user roles.</p></div><Link className="button-secondary" to="/admin/verify-ticket">Verify a ticket</Link></div>
      <div className="admin-tabs" role="tablist" aria-label="Admin dashboard sections">{TABS.map((name) => <button type="button" role="tab" aria-selected={tab === name} className={tab === name ? 'admin-tab admin-tab--active' : 'admin-tab'} onClick={() => { setTab(name); setError(''); setMessage(''); }} key={name}>{name}</button>)}</div>
      {message && <div className="notice-banner" role="status">{message}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? <div className="state-panel"><div><h3>Loading dashboard…</h3></div></div> : <>
        {tab === 'Overview' && <Overview movies={movies} theaters={theaters} showtimes={showtimes} users={users} onOpen={setTab} />}
        {tab === 'Movies' && <MoviesPanel movies={movies} token={token} runAction={runAction} />}
        {tab === 'Theaters & screens' && <VenuesPanel theaters={theaters} screensByTheater={screensByTheater} token={token} runAction={runAction} />}
        {tab === 'Showtimes' && <ShowtimesPanel movies={movies} theaters={theaters} screens={screens} showtimes={showtimes} token={token} runAction={runAction} />}
        {tab === 'Users' && <UsersPanel users={users} token={token} runAction={runAction} />}
      </>}
    </section>
  );
}

function Overview({ movies, theaters, showtimes, users, onOpen }) {
  const stats = [
    ['Active movies', movies.length, 'Movies'], ['Theaters', theaters.length, 'Theaters & screens'],
    ['Upcoming shows', showtimes.length, 'Showtimes'], ['Accounts', users.length, 'Users'],
  ];
  return <>
    <div className="metric-grid">{stats.map(([label, value, target], index) => <button className="metric-card" type="button" key={label} onClick={() => onOpen(target)}><span>0{index + 1} / OVERVIEW</span><strong>{value}</strong><small>{label}</small></button>)}</div>
    <div className="admin-info"><h2>What’s next?</h2><p>Create a movie and theater, configure the screen seats, then add a future showtime. Those entries will appear on the customer movie page for their city.</p><p className="muted">The backend currently provides catalog and account counts. It does not expose an all-bookings reporting endpoint, so booking totals aren’t shown here.</p></div>
  </>;
}

function MoviesPanel({ movies, token, runAction }) {
  const blank = { title: '', description: '', genre: '', durationMinutes: 120, rating: '', posterUrl: '' };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  function edit(movie) { setEditing(movie.id); setForm({ title: movie.title, description: movie.description || '', genre: movie.genre, durationMinutes: movie.durationMinutes, rating: movie.rating ?? '', posterUrl: movie.posterUrl || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    const payload = { ...form, durationMinutes: Number(form.durationMinutes), rating: form.rating === '' ? null : Number(form.rating) };
    const saved = await runAction(() => editing ? catalogApi.updateMovie(token, editing, payload) : catalogApi.createMovie(token, payload), editing ? 'Movie updated.' : 'Movie added.');
    if (saved) { setEditing(null); setForm(blank); }
    setBusy(false);
  }
  return <div className="admin-columns">
    <section className="admin-panel"><div className="panel-heading"><h2>{editing ? 'Edit movie' : 'Add a movie'}</h2>{editing && <button className="text-button" type="button" onClick={() => { setEditing(null); setForm(blank); }}>Cancel edit</button>}</div>
      <form className="form-stack" onSubmit={submit}>
        <label>Title<input required maxLength="180" value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
        <label>Description<textarea rows="3" maxLength="5000" value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
        <div className="form-row"><label>Genre<input required maxLength="80" value={form.genre} onChange={(e) => set('genre', e.target.value)} /></label><label>Duration (minutes)<input required type="number" min="1" value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} /></label></div>
        <div className="form-row"><label>Rating (0–10)<input type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(e) => set('rating', e.target.value)} /></label><label>Poster URL <span className="optional-label">(optional)</span><input type="url" maxLength="500" value={form.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} /></label></div>
        <button className="button-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add movie'}</button>
      </form>
    </section>
    <section className="admin-panel"><div className="panel-heading"><h2>Active movies</h2><span className="quiet-count">{movies.length}</span></div>
      {movies.length === 0 ? <p className="muted">No active movies yet.</p> : <div className="admin-list">{movies.map((movie) => <div className="admin-list-row" key={movie.id}><div><strong>{movie.title}</strong><small>{movie.genre} · {movie.durationMinutes} min</small></div><div className="row-actions"><button className="text-button" type="button" onClick={() => edit(movie)}>Edit</button><button className="text-button text-button--danger" type="button" onClick={() => { if (window.confirm(`Remove ${movie.title} from active listings?`)) runAction(() => catalogApi.deactivateMovie(token, movie.id), 'Movie deactivated.'); }}>Deactivate</button></div></div>)}</div>}
    </section>
  </div>;
}

function VenuesPanel({ theaters, screensByTheater, token, runAction }) {
  const [theaterForm, setTheaterForm] = useState({ name: '', city: '', address: '' });
  const [editingTheater, setEditingTheater] = useState(null);
  const [screenForm, setScreenForm] = useState({ theaterId: '', name: 'Screen 1', rows: 5, columns: 8, vipRows: 0 });
  const [busy, setBusy] = useState(false);
  async function addTheater(event) {
    event.preventDefault(); setBusy(true);
    const saved = await runAction(() => editingTheater ? catalogApi.updateTheater(token, editingTheater, theaterForm) : catalogApi.createTheater(token, theaterForm), editingTheater ? 'Theater updated.' : 'Theater added.');
    if (saved) { setTheaterForm({ name: '', city: '', address: '' }); setEditingTheater(null); }
    setBusy(false);
  }
  async function addScreen(event) {
    event.preventDefault(); setBusy(true);
    try {
      const screen = await catalogApi.createScreen(token, { theaterId: Number(screenForm.theaterId), name: screenForm.name, rows: Number(screenForm.rows), columns: Number(screenForm.columns) });
      const seats = [];
      for (let row = 0; row < Number(screenForm.rows); row += 1) {
        for (let number = 1; number <= Number(screenForm.columns); number += 1) {
          seats.push({ screenId: screen.id, rowLabel: rowLabel(row), seatNumber: number, category: row < Number(screenForm.vipRows) ? 'VIP' : 'REGULAR' });
        }
      }
      let created = 0;
      for (let index = 0; index < seats.length; index += 8) {
        const results = await Promise.allSettled(seats.slice(index, index + 8).map((seat) => catalogApi.createSeat(token, seat)));
        created += results.filter((result) => result.status === 'fulfilled').length;
      }
      setScreenForm((current) => ({ ...current, name: `Screen ${Object.values(screensByTheater).flat().length + 2}` }));
      await runAction(async () => {}, `${screen.name} added with ${created} of ${seats.length} seats.`);
    } catch (screenError) { await runAction(async () => { throw screenError; }, ''); }
    finally { setBusy(false); }
  }
  return <div className="admin-columns">
    <section className="admin-panel"><div className="panel-heading"><h2>{editingTheater ? 'Edit theater' : 'Add a theater'}</h2>{editingTheater && <button className="text-button" type="button" onClick={() => { setEditingTheater(null); setTheaterForm({ name: '', city: '', address: '' }); }}>Cancel edit</button>}</div><form className="form-stack" onSubmit={addTheater}>
      <label>Theater name<input required maxLength="150" value={theaterForm.name} onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })} /></label>
      <label>City<input required maxLength="100" value={theaterForm.city} onChange={(e) => setTheaterForm({ ...theaterForm, city: e.target.value })} /></label>
      <label>Address<input required maxLength="300" value={theaterForm.address} onChange={(e) => setTheaterForm({ ...theaterForm, address: e.target.value })} /></label>
      <button className="button-primary" disabled={busy}>{busy ? 'Saving…' : editingTheater ? 'Save theater' : 'Add theater'}</button>
    </form></section>
    <section className="admin-panel"><div className="panel-heading"><h2>Create a screen and seats</h2></div>
      {theaters.length === 0 ? <p className="muted">Add a theater first.</p> : <form className="form-stack" onSubmit={addScreen}>
        <label>Theater<select required value={screenForm.theaterId} onChange={(e) => setScreenForm({ ...screenForm, theaterId: e.target.value })}><option value="">Choose a theater</option>{theaters.map((theater) => <option key={theater.id} value={theater.id}>{theater.name} · {theater.city}</option>)}</select></label>
        <label>Screen name<input required maxLength="100" value={screenForm.name} onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })} /></label>
        <div className="form-row"><label>Rows<input type="number" required min="1" max="12" value={screenForm.rows} onChange={(e) => setScreenForm({ ...screenForm, rows: e.target.value })} /></label><label>Seats in each row<input type="number" required min="1" max="20" value={screenForm.columns} onChange={(e) => setScreenForm({ ...screenForm, columns: e.target.value })} /></label></div>
        <label>Front rows marked VIP<input type="number" min="0" max={screenForm.rows} value={screenForm.vipRows} onChange={(e) => setScreenForm({ ...screenForm, vipRows: e.target.value })} /></label>
        <p className="muted">This creates the screen and adds each seat automatically.</p><button className="button-primary" disabled={busy || !screenForm.theaterId}>{busy ? 'Creating layout…' : 'Create screen and seats'}</button>
      </form>}
    </section>
    <section className="admin-panel admin-panel--wide"><div className="panel-heading"><h2>Theaters and screens</h2><span className="quiet-count">{theaters.length} VENUES</span></div>
      {theaters.length === 0 ? <p className="muted">No theaters yet.</p> : <div className="admin-list">{theaters.map((theater) => <div className="venue-row" key={theater.id}><div><strong>{theater.name}</strong><small>{theater.city} · {theater.address}</small></div><div className="venue-screens">{(screensByTheater[theater.id] || []).map((screen) => <span key={screen.id}>{screen.name} · {screen.rows}×{screen.columns}</span>)}{!(screensByTheater[theater.id] || []).length && <small>No screens configured</small>}</div><button className="text-button" type="button" onClick={() => { setEditingTheater(theater.id); setTheaterForm({ name: theater.name, city: theater.city, address: theater.address }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button></div>)}</div>}
    </section>
  </div>;
}

function ShowtimesPanel({ movies, theaters, screens, showtimes, token, runAction }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ movieId: '', screenId: '', startsAt: '', basePrice: '' });
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  function edit(showtime) { setEditing(showtime.id); setForm({ movieId: String(showtime.movieId), screenId: String(showtime.screenId), startsAt: toLocalDateTime(showtime.startsAt), basePrice: String(showtime.basePrice) }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    const payload = { movieId: Number(form.movieId), screenId: Number(form.screenId), startsAt: new Date(form.startsAt).toISOString(), basePrice: Number(form.basePrice) };
    const saved = await runAction(() => editing ? catalogApi.updateShowtime(token, editing, payload) : catalogApi.createShowtime(token, payload), editing ? 'Showtime updated.' : 'Showtime scheduled.');
    if (saved) { setEditing(null); setForm({ movieId: '', screenId: '', startsAt: '', basePrice: '' }); }
    setBusy(false);
  }
  return <div className="admin-columns">
    <section className="admin-panel"><div className="panel-heading"><h2>{editing ? 'Edit showtime' : 'Schedule a showtime'}</h2>{editing && <button className="text-button" type="button" onClick={() => { setEditing(null); setForm({ movieId: '', screenId: '', startsAt: '', basePrice: '' }); }}>Cancel edit</button>}</div>
      {(!movies.length || !theaters.length || !screens.length) ? <p className="muted">Add at least one movie, theater, and screen with seats before scheduling a show.</p> : <form className="form-stack" onSubmit={submit}>
        <label>Movie<select required value={form.movieId} onChange={(e) => set('movieId', e.target.value)}><option value="">Choose a movie</option>{movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</select></label>
        <label>Screen<select required value={form.screenId} onChange={(e) => set('screenId', e.target.value)}><option value="">Choose a screen</option>{screens.map((screen) => <option key={screen.id} value={screen.id}>{screen.theaterName} · {screen.name}</option>)}</select></label>
        <div className="form-row"><label>Date and time<input required type="datetime-local" min={minDateTime()} value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} /></label><label>Base price (₹)<input required type="number" min="0.01" step="0.01" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} /></label></div>
        <button className="button-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save showtime' : 'Schedule showtime'}</button>
      </form>}
    </section>
    <section className="admin-panel"><div className="panel-heading"><h2>Upcoming showtimes</h2><span className="quiet-count">{showtimes.length}</span></div>
      {showtimes.length === 0 ? <p className="muted">No upcoming showtimes yet.</p> : <div className="admin-list">{showtimes.map((showtime) => <div className="admin-list-row" key={showtime.id}><div><strong>{showtime.movieTitle}</strong><small>{showtime.theaterName} · {showtime.screenName} · {showtime.city} · {formatDate(showtime.startsAt)}</small></div><div className="row-actions"><button className="text-button" type="button" onClick={() => edit(showtime)}>Edit</button><button className="text-button text-button--danger" type="button" onClick={() => { if (window.confirm(`Deactivate this ${showtime.movieTitle} showtime?`)) runAction(() => catalogApi.deactivateShowtime(token, showtime.id), 'Showtime deactivated.'); }}>Deactivate</button></div></div>)}</div>}
    </section>
  </div>;
}

function UsersPanel({ users, token, runAction }) {
  const [draftRoles, setDraftRoles] = useState({});
  return <section className="admin-panel"><div className="panel-heading"><h2>Accounts and roles</h2><span className="quiet-count">{users.length} USERS</span></div>
    {users.length === 0 ? <p className="muted">No accounts found.</p> : <div className="admin-list">{users.map((user) => <div className="admin-list-row" key={user.id}><div><strong>{user.fullName}</strong><small>{user.email} · {user.phoneNumber || 'No phone number'}</small></div><div className="user-role-edit"><select aria-label={`Role for ${user.fullName}`} value={draftRoles[user.id] || user.role} onChange={(e) => setDraftRoles({ ...draftRoles, [user.id]: e.target.value })}><option value="CUSTOMER">CUSTOMER</option><option value="ADMIN">ADMIN</option></select><button className="text-button" type="button" disabled={!draftRoles[user.id] || draftRoles[user.id] === user.role} onClick={() => runAction(async () => { await authApi.updateRole(token, user.id, draftRoles[user.id]); setDraftRoles((current) => ({ ...current, [user.id]: '' })); }, 'User role updated.')}>Save role</button></div></div>)}</div>}
  </section>;
}

function rowLabel(index) { let value = index + 1; let label = ''; while (value > 0) { const remainder = (value - 1) % 26; label = String.fromCharCode(65 + remainder) + label; value = Math.floor((value - 1) / 26); } return label; }
function minDateTime() { const date = new Date(Date.now() + 60_000); date.setSeconds(0, 0); return toLocalDateTime(date.toISOString()); }
function toLocalDateTime(value) { const date = new Date(value); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 16); }
function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
