import { request } from '../../shared/api/http.js';

export const authApi = {
  register: (data) => request('/api/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: data }),
  me: (token) => request('/api/auth/me', { token }),
  updateProfile: (token, data) => request('/api/auth/me', { token, method: 'PUT', body: data }),
  users: (token) => request('/api/auth/admin/users', { token }),
  updateRole: (token, userId, role) => request(`/api/auth/admin/users/${userId}/role`, {
    token, method: 'PATCH', body: { role },
  }),
};
