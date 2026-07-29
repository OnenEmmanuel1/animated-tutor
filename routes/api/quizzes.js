/**
 * Quizzes CRUD & Submissions JSON API (routes/api/quizzes.js)
 */
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const ntutEngine = require('../../engine/ntutEngine');
const { requireLogin, requireRole, requireLearner } = require('../../middleware/auth');

// 1. Create a quiz question (Teacher only)
router.post('/questions', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  const { lesson_unit_id, question_text, question_type, options, correct_option } = req.body;

  if (!lesson_unit_id || !question_text || !options || !correct_option) {
    return res.status(400).json({ error: 'Lesson unit, question text, options, and correct option are required.' });
  }

  // Expect options to be passed as JSON string or array
  let parsedOptions;
  try {
    parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    if (!Array.isArray(parsedOptions)) {
      return res.status(400).json({ error: 'Options must be a list / JSON array.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Options is not a valid JSON array.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO quiz_questions (lesson_unit_id, question_text, question_type, options, correct_option) VALUES (?, ?, ?, ?, ?)',
      [parseInt(lesson_unit_id, 10), question_text, question_type || 'multiple_choice', JSON.stringify(parsedOptions), correct_option]
    );

    res.status(201).json({
      success: true,
      message: 'Quiz question created successfully',
      questionId: result.insertId
    });
  } catch (err) {
    console.error('Create quiz question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Update a quiz question (Teacher only)
router.post('/questions/:id/update', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  const questionId = parseInt(req.params.id, 10);
  const { lesson_unit_id, question_text, question_type, options, correct_option } = req.body;

  if (!lesson_unit_id || !question_text || !options || !correct_option) {
    return res.status(400).json({ error: 'Lesson unit, question text, options, and correct option are required.' });
  }

  let parsedOptions;
  try {
    parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    if (!Array.isArray(parsedOptions)) {
      return res.status(400).json({ error: 'Options must be a list / JSON array.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Options is not a valid JSON array.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE quiz_questions SET lesson_unit_id = ?, question_text = ?, question_type = ?, options = ?, correct_option = ? WHERE id = ?',
      [parseInt(lesson_unit_id, 10), question_text, question_type || 'multiple_choice', JSON.stringify(parsedOptions), correct_option, questionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Quiz question updated successfully'
    });
  } catch (err) {
    console.error('Update quiz question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Delete a quiz question (Teacher only)
router.post('/questions/:id/delete', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  const questionId = parseInt(req.params.id, 10);

  try {
    const [result] = await db.query('DELETE FROM quiz_questions WHERE id = ?', [questionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      success: true,
      message: 'Quiz question deleted successfully'
    });
  } catch (err) {
    console.error('Delete quiz question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Verify single question answer server-side (Learner only)
router.post('/verify-answer', requireLogin, requireLearner, async (req, res) => {
  const { questionId, submittedOption } = req.body;

  if (!questionId || submittedOption === undefined) {
    return res.status(400).json({ error: 'Question ID and submitted option are required.' });
  }

  try {
    const result = await ntutEngine.checkAnswer(parseInt(questionId, 10), submittedOption, db);
    res.json(result);
  } catch (err) {
    console.error('Verify answer error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 5. Submit completed quiz attempt (Learner only)
router.post('/submit-attempt', requireLogin, requireLearner, async (req, res) => {
  const { lessonUnitId, score, totalQuestions } = req.body;
  const learnerId = req.session.learnerId;

  if (!lessonUnitId || score === undefined || !totalQuestions) {
    return res.status(400).json({ error: 'Lesson unit, score, and total questions are required.' });
  }

  try {
    const result = await ntutEngine.saveQuizAttempt(
      parseInt(learnerId, 10),
      parseInt(lessonUnitId, 10),
      parseInt(score, 10),
      parseInt(totalQuestions, 10),
      db
    );

    res.json({
      success: true,
      message: 'Quiz attempt saved and progress updated.',
      attemptId: result.attemptId,
      progressUpdated: result.progressUpdated
    });
  } catch (err) {
    console.error('Submit quiz attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
