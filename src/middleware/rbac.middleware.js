/**
 * Role-based access control (Section 4 of the project scope).
 * Roles: Administrator, Security Analyst, Viewer.
 *
 * Usage:
 *   router.post('/', authMiddleware, requireRole('Administrator', 'Security Analyst'), controller.create);
 *
 * Must run after authMiddleware, which populates req.user.
 */
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}]`,
      });
    }

    return next();
  };
}

/**
 * Shorthand: blocks Viewers from any mutating request (POST/PUT/PATCH/DELETE).
 * Administrators and Security Analysts pass through; Viewers are read-only.
 */
function blockViewerWrites(req, res, next) {
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (isWrite && req.user && req.user.role === 'Viewer') {
    return res.status(403).json({ message: 'Forbidden: Viewer role is read-only' });
  }

  return next();
}

module.exports = { requireRole, blockViewerWrites };
