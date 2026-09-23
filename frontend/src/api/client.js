import axios from 'axios';

// Same-origin deployment: the built frontend is served by Express, so a
// relative baseURL works both in dev (via Vite's proxy, see vite.config.js)
// and in production (served from the same host as the API). Routes are
// mounted directly at the root by server.js (e.g. app.use('/websites', ...)),
// not under an /api prefix, so this stays empty to match.
const api = axios.create({
  baseURL: '/',
  withCredentials: true, // required: auth is a cookie-based JWT (see auth.middleware.js)
});

// Centralized 401 handling: if the session is gone, bounce to login rather
// than letting every page handle it individually.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
