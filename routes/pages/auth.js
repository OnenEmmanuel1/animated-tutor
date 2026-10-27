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

const bcrypt = require('bcrypt');
const db = require('../../config/db');

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

// Form POST Login (Native browser submission with 302 redirect)
router.post('/login', async (req, res) => {
  console.log('[AUTH-DEBUG] page login request received');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/login?error=' + encodeURIComponent('Email and password are required'));
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('[AUTH-DEBUG] page login database lookup complete', { userFound: users.length > 0 });
    if (users.length === 0) {
      return res.redirect('/login?error=' + encodeURIComponent('Invalid email or password'));
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.redirect('/login?error=' + encodeURIComponent('Invalid email or password'));
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.save((err) => {
      if (err) {
        console.error('[AUTH-DEBUG] page login session save failed:', err.message);
        return res.redirect('/login?error=' + encodeURIComponent('Could not start your session. Please try again.'));
      }
      console.log('[AUTH-DEBUG] page login session saved; redirecting');
      if (user.role === 'teacher_admin') {
        return res.redirect('/teacher-dashboard');
      } else {
        return res.redirect('/parent-dashboard');
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.redirect('/login?error=' + encodeURIComponent('Server error during login. Please try again.'));
  }
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

// Form POST Register (Native browser submission with 302 redirect)
router.post('/register', async (req, res) => {
  console.log('[AUTH-DEBUG] page registration request received');
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.redirect('/register?error=' + encodeURIComponent('All fields are required'));
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.redirect('/register?error=' + encodeURIComponent('Email address already registered'));
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    req.session.user = {
      id: result.insertId,
      name,
      email,
      role
    };

    req.session.save((err) => {
      if (err) {
        console.error('[AUTH-DEBUG] page registration session save failed:', err.message);
        return res.redirect('/register?error=' + encodeURIComponent('Account created, but could not start your session. Please log in.'));
      }
      console.log('[AUTH-DEBUG] page registration session saved; redirecting');
      if (role === 'teacher_admin') {
        return res.redirect('/teacher-dashboard');
      } else {
        return res.redirect('/parent-dashboard');
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.redirect('/register?error=' + encodeURIComponent('Server error during registration. Please try again.'));
  }
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
