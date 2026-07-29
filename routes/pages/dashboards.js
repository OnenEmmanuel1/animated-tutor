/**
 * Dashboard and learning flow page routes (routes/pages/dashboards.js)
 */
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const ntutEngine = require('../../engine/ntutEngine');
const { requireLogin, requireRole, requireLearner } = require('../../middleware/auth');

// 1. Parent Dashboard
router.get('/parent-dashboard', requireLogin, requireRole('parent'), async (req, res) => {
  try {
    const parentId = req.session.user.id;
    // Get all children profiles for this parent
    const [children] = await db.query(
      'SELECT id, name, avatar, created_at FROM learners WHERE parent_id = ? ORDER BY name',
      [parentId]
    );

    // Compute progress for each child
    const childrenProgress = [];
    for (const child of children) {
      const progress = await ntutEngine.getLearnerProgress(child.id, db);
      childrenProgress.push({
        profile: child,
        progress: progress
      });
    }

    res.render('pages/parent_dashboard', {
      user: req.session.user,
      children: childrenProgress
    });
  } catch (err) {
    console.error('Parent dashboard load error:', err);
    res.status(500).send('Error loading parent dashboard');
  }
});

// 2. Teacher/Admin Dashboard
router.get('/teacher-dashboard', requireLogin, requireRole('teacher_admin'), async (req, res) => {
  try {
    // 1. Fetch all learners with parent name
    const [learners] = await db.query(
      `SELECT l.id, l.name, l.avatar, l.created_at, u.name AS parent_name, u.email AS parent_email 
       FROM learners l 
       JOIN users u ON l.parent_id = u.id 
       ORDER BY l.name`
    );

    // Compute progress metrics for all learners
    const learnersWithProgress = [];
    for (const learner of learners) {
      const progress = await ntutEngine.getLearnerProgress(learner.id, db);
      learnersWithProgress.push({
        profile: learner,
        progress: progress
      });
    }

    // 2. Fetch all lesson units for CRUD list
    const [lessons] = await db.query(
      'SELECT * FROM lesson_units ORDER BY subject, sequence_order'
    );

    // 3. Fetch all quiz questions for CRUD list
    const [questions] = await db.query(
      `SELECT q.*, l.title AS lesson_title, l.subject AS lesson_subject 
       FROM quiz_questions q 
       JOIN lesson_units l ON q.lesson_unit_id = l.id 
       ORDER BY l.subject, l.sequence_order, q.id`
    );

    res.render('pages/teacher_dashboard', {
      user: req.session.user,
      learners: learnersWithProgress,
      lessons: lessons,
      questions: questions
    });
  } catch (err) {
    console.error('Teacher dashboard load error:', err);
    res.status(500).send('Error loading teacher dashboard');
  }
});

// 3. Profile Picker Screen
router.get('/learner-select', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    let query = 'SELECT id, name, avatar FROM learners WHERE parent_id = ? ORDER BY name';
    let params = [userId];

    // If teacher, they can view all students for testing/evaluation
    if (req.session.user.role === 'teacher_admin') {
      query = 'SELECT id, name, avatar FROM learners ORDER BY name';
      params = [];
    }

    const [learners] = await db.query(query, params);

    res.render('pages/learner_select', {
      user: req.session.user,
      learners: learners
    });
  } catch (err) {
    console.error('Profile picker load error:', err);
    res.status(500).send('Error loading profile selector');
  }
});

// 4. Learner Dashboard (Main Track Selection)
router.get('/learner-dashboard', requireLogin, requireLearner, async (req, res) => {
  try {
    const learnerId = req.session.learnerId;
    
    // Fetch learner details
    const [learnerRows] = await db.query(
      'SELECT id, name, avatar FROM learners WHERE id = ?',
      [learnerId]
    );
    if (learnerRows.length === 0) {
      req.session.learnerId = null;
      return res.redirect('/learner-select');
    }
    const learner = learnerRows[0];

    // Get learner progress using engine
    const progress = await ntutEngine.getLearnerProgress(learnerId, db);

    res.render('pages/learner_dashboard', {
      user: req.session.user,
      learner: learner,
      progress: progress
    });
  } catch (err) {
    console.error('Learner dashboard load error:', err);
    res.status(500).send('Error loading learner dashboard');
  }
});

// 5. Lesson Delivery Screen
router.get('/lesson/:id', requireLogin, requireLearner, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id, 10);
    const learnerId = req.session.learnerId;

    // Fetch lesson unit details
    const [lessons] = await db.query('SELECT * FROM lesson_units WHERE id = ?', [lessonId]);
    if (lessons.length === 0) {
      return res.status(404).send('Lesson not found');
    }
    const lesson = lessons[0];

    // Fetch learner details for header
    const [learnerRows] = await db.query('SELECT name, avatar FROM learners WHERE id = ?', [learnerId]);
    const learner = learnerRows[0];

    // Track state: insert 'in_progress' status in progress_records if not exists
    const [existing] = await db.query(
      'SELECT status FROM progress_records WHERE learner_id = ? AND lesson_unit_id = ?',
      [learnerId, lessonId]
    );

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO progress_records (learner_id, lesson_unit_id, status) VALUES (?, ?, "in_progress")',
        [learnerId, lessonId]
      );
    }

    res.render('pages/lesson', {
      user: req.session.user,
      learner: learner,
      lesson: lesson
    });
  } catch (err) {
    console.error('Lesson render error:', err);
    res.status(500).send('Error loading lesson');
  }
});

// 6. Interactive Quiz Screen
router.get('/quiz/:lessonId', requireLogin, requireLearner, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId, 10);
    const learnerId = req.session.learnerId;

    // Fetch lesson details
    const [lessons] = await db.query('SELECT * FROM lesson_units WHERE id = ?', [lessonId]);
    if (lessons.length === 0) {
      return res.status(404).send('Lesson not found');
    }
    const lesson = lessons[0];

    // Fetch questions for this lesson
    // We select id, lesson_unit_id, question_text, question_type, options, BUT NOT correct_option
    // (We evaluate correct options only on server-side APIs)
    const [questions] = await db.query(
      'SELECT id, lesson_unit_id, question_text, question_type, options FROM quiz_questions WHERE lesson_unit_id = ?',
      [lessonId]
    );

    // Fetch learner details
    const [learnerRows] = await db.query('SELECT name, avatar FROM learners WHERE id = ?', [learnerId]);
    const learner = learnerRows[0];

    res.render('pages/quiz', {
      user: req.session.user,
      learner: learner,
      lesson: lesson,
      questions: questions
    });
  } catch (err) {
    console.error('Quiz render error:', err);
    res.status(500).send('Error loading quiz');
  }
});

module.exports = router;
