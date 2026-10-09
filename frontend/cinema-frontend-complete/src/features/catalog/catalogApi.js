import { getJson, request } from '../../shared/api/http.js';

function queryString(values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
}

export const catalogApi = {
  getCities: (options) => getJson('/api/catalog/theaters', options),
  getMovies: (city, options) => getJson(`/api/catalog/movies${queryString({ city })}`, options),
  getTheaters: (city, options) => getJson(`/api/catalog/theaters${queryString({ city })}`, options),
  getShowtimes: (city, options) => getJson(`/api/catalog/showtimes${queryString({ city })}`, options),
  getShowtime: (id) => getJson(`/api/catalog/showtimes/${id}`),
  getScreens: (theaterId, token) => request(`/api/catalog/theaters/${theaterId}/screens`, { token }),
  getSeats: (screenId, token) => request(`/api/catalog/screens/${screenId}/seats`, { token }),
  createMovie: (token, data) => request('/api/catalog/admin/movies', { token, method: 'POST', body: data }),
  updateMovie: (token, id, data) => request(`/api/catalog/admin/movies/${id}`, { token, method: 'PUT', body: data }),
  deactivateMovie: (token, id) => request(`/api/catalog/admin/movies/${id}`, { token, method: 'DELETE' }),
  createTheater: (token, data) => request('/api/catalog/admin/theaters', { token, method: 'POST', body: data }),
  updateTheater: (token, id, data) => request(`/api/catalog/admin/theaters/${id}`, { token, method: 'PUT', body: data }),
  createScreen: (token, data) => request('/api/catalog/admin/screens', { token, method: 'POST', body: data }),
  updateScreen: (token, id, data) => request(`/api/catalog/admin/screens/${id}`, { token, method: 'PUT', body: data }),
  createSeat: (token, data) => request('/api/catalog/admin/seats', { token, method: 'POST', body: data }),
  createShowtime: (token, data) => request('/api/catalog/admin/showtimes', { token, method: 'POST', body: data }),
  updateShowtime: (token, id, data) => request(`/api/catalog/admin/showtimes/${id}`, { token, method: 'PUT', body: data }),
  deactivateShowtime: (token, id) => request(`/api/catalog/admin/showtimes/${id}`, { token, method: 'DELETE' }),
};
