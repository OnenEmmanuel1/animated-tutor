/**
 * Authentication and authorization middleware (middleware/auth.js)
 */

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  console.warn('[AUTH-DEBUG] protected route has no authenticated session', { path: req.originalUrl });
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  
  res.redirect('/login');
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    }
    
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: `Forbidden. Requires ${role} role.` });
    }
    
    // Redirect based on role if they try to access wrong portal
    if (req.session && req.session.user) {
      if (req.session.user.role === 'teacher_admin') {
        return res.redirect('/teacher-dashboard');
      } else {
        return res.redirect('/parent-dashboard');
      }
    }
    res.redirect('/login');
  };
}

function requireLearner(req, res, next) {
  if (req.session && req.session.learnerId) {
    return next();
  }
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(400).json({ error: 'No active learner profile selected.' });
  }
  
  // If parent is logged in, redirect them to the learner selector
  if (req.session && req.session.user) {
    return res.redirect('/learner-select');
  }
  
  res.redirect('/login');
}

module.exports = {
  requireLogin,
  requireRole,
  requireLearner
};
