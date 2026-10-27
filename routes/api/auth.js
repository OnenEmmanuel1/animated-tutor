/**
 * Authentication JSON API (routes/api/auth.js)
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../../config/db');

// Register API
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (role !== 'parent' && role !== 'teacher_admin') {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    // Log the user in by creating session
    req.session.user = {
      id: result.insertId,
      name,
      email,
      role
    };

    req.session.save((saveErr) => {
      if (saveErr) {
        console.warn('Session save warning:', saveErr.message);
      }
      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: req.session.user
      });
    });
  } catch (err) {
    console.error('Registration API error:', err);
    res.status(500).json({ 
      error: 'Internal server error during registration',
      details: err.message
    });
  }
});

// Login API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Retrieve user from DB
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Set session user info
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: req.session.user
    });
  } catch (err) {
    console.error('Login API error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

module.exports = router;
