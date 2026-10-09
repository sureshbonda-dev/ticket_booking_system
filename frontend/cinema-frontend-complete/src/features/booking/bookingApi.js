import { request } from '../../shared/api/http.js';

export const bookingApi = {
  seatAvailability: (token, showtimeId) => request(`/api/seats/showtimes/${showtimeId}`, { token }),
  lockSeats: (token, data) => request('/api/bookings/locks', { token, method: 'POST', body: data }),
  confirm: (token, data) => request('/api/bookings/confirm', { token, method: 'POST', body: data }),
  myBookings: (token) => request('/api/bookings/my', { token }),
  cancel: (token, bookingId) => request(`/api/bookings/${bookingId}/cancel`, { token, method: 'POST' }),
  ticket: (token, bookingId) => request(`/api/bookings/${bookingId}/ticket`, { token }),
  downloadPdf: (token, bookingId) => request(`/api/bookings/${bookingId}/ticket.pdf`, { token, responseType: 'blob' }),
  verifyTicket: (token, ticketCode) => request(`/api/bookings/admin/tickets/${encodeURIComponent(ticketCode)}/verify`, { token }),
};
