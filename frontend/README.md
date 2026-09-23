# Frontend

React (Vite) + Tailwind CSS + Recharts + React Query. Same-origin
deployment: builds into `../public`, which Express serves directly.

## Stack

- **React Router** — client-side routing
- **@tanstack/react-query** — server state, caching, loading/error handling
- **Axios** (`withCredentials: true`) — required because auth is a
  cookie-based JWT (`src/middleware/auth.middleware.js` reads
  `req.cookies.token`), not an Authorization header
- **Recharts** — the 5 dashboard charts (pie, bar ×3, line)
- **Tailwind CSS v3**

## Development

Run the backend first (`node server.js`, default port 3000), then:

```bash
cd frontend
npm install
npm run dev
```

Vite serves on `http://localhost:5173` and proxies `/auth`, `/websites`,
`/scans`, `/dashboard`, `/reports`, `/notifications`, `/users`, `/settings`
to `http://localhost:3000` (see `vite.config.js`). Cookies pass through the
proxy, so login works exactly as it will in production.

## Production build

```bash
npm run build
```

Outputs to `../public` (already configured in `vite.config.js`). Add this
to `server.js`, **after** all API routes are mounted:

```js
const path = require('path');

// Serve the built frontend
app.use(express.static(path.join(__dirname, 'public')));

// React Router client-side routing: any non-API GET falls through to
// index.html so the app's own router can handle the path.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

Order matters: this catch-all must be registered after `/auth`,
`/websites`, `/scans`, etc., or it will swallow API requests.

## Pages

| Route | Page | Access |
|---|---|---|
| `/login`, `/register` | Auth | public |
| `/dashboard` | Overview + all 5 charts | all roles |
| `/websites` | List, add, scan, enable/disable, delete | Admin/Analyst write, Viewer read-only |
| `/websites/:id` | Scan history, report downloads, scan comparison | all roles |
| `/scans/:id` | Findings grouped by module | all roles |
| `/notifications` | In-app notification feed | all roles |
| `/users` | User management | Administrator only |
| `/settings` | Scan timeout/retries, scheduler timing, notification toggles | Administrator only |

## Known limitation: session persistence

There's no `/auth/me` endpoint on the backend, and the JWT lives in an
httpOnly cookie the frontend can't read. `AuthContext` therefore persists
just the *display* fields (id/username/role) to `localStorage` so a page
refresh doesn't bounce a logged-in user to `/login`. If the actual cookie
has expired, the first API call's 401 response redirects to `/login` via
the interceptor in `src/api/client.js` — so it self-corrects, but there's
a brief window where the UI shows a stale "logged in" state before that
happens. Adding a real `GET /auth/me` endpoint would remove this rough
edge if it matters for your write-up.
