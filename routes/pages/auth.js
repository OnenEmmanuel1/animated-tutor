/**
 * Authentication and basic page-rendering routes (routes/pages/auth.js)
 */
const express = require('express');
const router = express.Router();

// Splash / Landing Page
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'teacher_admin') {
      return res.redirect('/teacher-dashboard');
    } else {
      return res.redirect('/parent-dashboard');
    }
  }
  res.render('pages/index', { user: null });
});

// Login Page
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'teacher_admin') {
      return res.redirect('/teacher-dashboard');
    } else {
      return res.redirect('/parent-dashboard');
    }
  }
  res.render('pages/login', { error: req.query.error || null, success: req.query.success || null });
});

// Register Page
router.get('/register', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'teacher_admin') {
      return res.redirect('/teacher-dashboard');
    } else {
      return res.redirect('/parent-dashboard');
    }
  }
  res.render('pages/register', { error: req.query.error || null });
});

// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/login?success=Logged out successfully.');
  });
});

module.exports = router;
