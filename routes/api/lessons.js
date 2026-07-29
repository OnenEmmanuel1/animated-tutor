/**
 * Lesson Units CRUD & Progress JSON API (routes/api/lessons.js)
 */
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireLogin, requireRole, requireLearner } = require('../../middleware/auth');

// Get all lessons
router.get('/', requireLogin, async (req, res) => {
  try {
    const [lessons] = await db.query('SELECT * FROM lesson_units ORDER BY subject, sequence_order');
    res.json(lessons);
  } catch (err) {
    console.error('Fetch lessons API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a lesson unit (Teacher only)
router.post('/', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  const { subject, title, sequence_order, animation_asset, audio_asset } = req.body;

  if (!subject || !title || !sequence_order || !animation_asset) {
    return res.status(400).json({ error: 'Subject, title, sequence order, and animation asset are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO lesson_units (subject, title, sequence_order, animation_asset, audio_asset) VALUES (?, ?, ?, ?, ?)',
      [subject, title, parseInt(sequence_order, 10), animation_asset, audio_asset || null]
    );

    res.status(201).json({
      success: true,
      message: 'Lesson unit created successfully',
      lessonId: result.insertId
    });
  } catch (err) {
    console.error('Create lesson unit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a lesson unit (Teacher only)
router.post('/:id/update', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  const lessonId = parseInt(req.params.id, 10);
  const { subject, title, sequence_order, animation_asset, audio_asset } = req.body;

  if (!subject || !title || !sequence_order || !animation_asset) {
    return res.status(400).json({ error: 'Subject, title, sequence order, and animation asset are required.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE lesson_units SET subject = ?, title = ?, sequence_order = ?, animation_asset = ?, audio_asset = ? WHERE id = ?',
      [subject, title, parseInt(sequence_order, 10), animation_asset, audio_asset || null, lessonId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lesson unit not found' });
    }

    res.json({
      success: true,
      message: 'Lesson unit updated successfully'
    });
  } catch (err) {
    console.error('Update lesson unit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a lesson unit (Teacher only)
router.post('/:id/delete', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  const lessonId = parseInt(req.params.id, 10);

  try {
    const [result] = await db.query('DELETE FROM lesson_units WHERE id = ?', [lessonId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lesson unit not found' });
    }

    res.json({
      success: true,
      message: 'Lesson unit deleted successfully'
    });
  } catch (err) {
    console.error('Delete lesson unit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson progress state (e.g., mark as 'completed' or 'in_progress')
router.post('/:id/progress', requireLogin, requireLearner, async (req, res) => {
  const lessonId = parseInt(req.params.id, 10);
  const learnerId = req.session.learnerId;
  const { status } = req.body; // 'in_progress', 'completed'

  if (!status || (status !== 'in_progress' && status !== 'completed')) {
    return res.status(400).json({ error: 'Invalid progress status' });
  }

  try {
    // Check if lesson exists
    const [lessons] = await db.query('SELECT id FROM lesson_units WHERE id = ?', [lessonId]);
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Lesson unit not found' });
    }

    // Insert or update progress record
    const [existing] = await db.query(
      'SELECT id, status FROM progress_records WHERE learner_id = ? AND lesson_unit_id = ?',
      [learnerId, lessonId]
    );

    const completedAt = status === 'completed' ? new Date() : null;

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO progress_records (learner_id, lesson_unit_id, status, completed_at) VALUES (?, ?, ?, ?)',
        [learnerId, lessonId, status, completedAt]
      );
    } else {
      // Don't downgrade status from 'completed' to 'in_progress' if they re-visit the lesson
      if (existing[0].status === 'completed' && status === 'in_progress') {
        return res.json({ success: true, message: 'Already marked as completed' });
      }
      
      await db.query(
        'UPDATE progress_records SET status = ?, completed_at = ? WHERE learner_id = ? AND lesson_unit_id = ?',
        [status, completedAt, learnerId, lessonId]
      );
    }

    res.json({ success: true, message: `Progress updated to: ${status}` });
  } catch (err) {
    console.error('Update lesson progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
