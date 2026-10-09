const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function request(path, { token, method = 'GET', body, responseType = 'json', signal } = {}) {
  const headers = { Accept: responseType === 'blob' ? 'application/pdf' : 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the API Gateway. Check that the backend services are running.', 0);
  }

  if (!response.ok) {
    let responseBody;
    try { responseBody = await response.json(); } catch { responseBody = null; }
    const fallback = response.status === 401
      ? 'Your session has expired. Please sign in again.'
      : response.status === 403
        ? 'You do not have permission to do that.'
        : response.status === 404
          ? 'The requested item was not found.'
          : `The server returned an error (${response.status}).`;
    const message = responseBody?.detail || responseBody?.message || fallback;
    if (response.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cinema:session-expired'));
    }
    throw new ApiError(message, response.status, responseBody);
  }

  if (response.status === 204) return null;
  if (responseType === 'blob') return response.blob();
  return response.json();
}

export const getJson = (path, options) => request(path, options);
