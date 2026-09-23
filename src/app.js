const express = require ('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes')
const scanRoutes = require('./routes/scan.routes')
const websiteRoutes = require('./routes/website.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const reportsRoutes = require('./routes/reports.routes')
const notificationsRoutes = require('./routes/notifications.routes')
const usersRoutes = require('./routes/users.routes')
const settingsRoutes = require('./routes/settings.routes')

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN || true }));

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);

// Serve the built frontend (see frontend/README.md — `npm run build` there
// outputs into ../public, i.e. here). Registered LAST so it never shadows
// the /api/* routes above.
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/*splat', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next(); // let unmatched API routes 404 normally
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;