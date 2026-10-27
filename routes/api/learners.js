/**
 * Learner Profile CRUD & Selection JSON API (routes/api/learners.js)
 */
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireLogin } = require('../../middleware/auth');

// Create new learner profile (Child sub-profile)
router.post('/', requireLogin, async (req, res) => {
  const { name, avatar } = req.body;
  const parentId = req.session.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Child name is required' });
  }

  const selectedAvatar = avatar || 'bunny';

  try {
    const [result] = await db.query(
      'INSERT INTO learners (parent_id, name, avatar) VALUES (?, ?, ?)',
      [parentId, name, selectedAvatar]
    );

    res.status(201).json({
      success: true,
      message: 'Child profile created successfully',
      learner: {
        id: result.insertId,
        parent_id: parentId,
        name,
        avatar: selectedAvatar
      }
    });
  } catch (err) {
    console.error('Create learner profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Select active learner profile for current session
router.post('/select', requireLogin, async (req, res) => {
  const { learnerId } = req.body;
  const userId = req.session.user.id;
  const userRole = req.session.user.role;

  if (!learnerId) {
    return res.status(400).json({ error: 'Learner ID is required' });
  }

  try {
    // If not admin/teacher, verify that the profile is owned by the logged-in parent
    let query = 'SELECT id, name, avatar FROM learners WHERE id = ?';
    let params = [learnerId];

    if (userRole !== 'teacher_admin') {
      query += ' AND parent_id = ?';
      params.push(userId);
    }

    const [rows] = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this learner profile' });
    }

    const selectedLearner = rows[0];

    // Store child profile details in session
    req.session.learnerId = selectedLearner.id;
    req.session.learnerName = selectedLearner.name;
    req.session.learnerAvatar = selectedLearner.avatar;

    req.session.save((saveErr) => {
      if (saveErr) console.warn('Session save warning on select:', saveErr.message);
      return res.json({
        success: true,
        message: `Switched to profile: ${selectedLearner.name}`,
        learner: selectedLearner
      });
    });
  } catch (err) {
    console.error('Select learner profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
