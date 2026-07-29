/**
 * TutorToon Business Logic Engine (engine/ntutEngine.js)
 * Keeps quiz scoring, progress calculation, and state tracking logic separate from route handlers.
 */

/**
 * Validates a single question response against the database.
 * @param {number} questionId 
 * @param {string} submittedOption 
 * @param {object} dbPool 
 * @returns {Promise<{correct: boolean, correctOption: string}>}
 */
async function checkAnswer(questionId, submittedOption, dbPool) {
  const [rows] = await dbPool.query(
    'SELECT correct_option FROM quiz_questions WHERE id = ?',
    [questionId]
  );
  if (!rows || rows.length === 0) {
    throw new Error('Question not found');
  }
  const correctOption = rows[0].correct_option;
  const isCorrect = String(submittedOption).trim().toLowerCase() === String(correctOption).trim().toLowerCase();
  return {
    correct: isCorrect,
    correctOption: correctOption
  };
}

/**
 * Saves a completed quiz attempt and updates lesson progress records.
 * @param {number} learnerId 
 * @param {number} lessonUnitId 
 * @param {number} score 
 * @param {number} totalQuestions 
 * @param {object} dbPool 
 * @returns {Promise<{attemptId: number, progressUpdated: boolean}>}
 */
async function saveQuizAttempt(learnerId, lessonUnitId, score, totalQuestions, dbPool) {
  // 1. Insert into quiz_attempts
  const [attemptResult] = await dbPool.query(
    'INSERT INTO quiz_attempts (learner_id, lesson_unit_id, score, total_questions, attempted_at) VALUES (?, ?, ?, ?, NOW())',
    [learnerId, lessonUnitId, score, totalQuestions]
  );

  // 2. Mark lesson as completed in progress_records if not already completed
  const [existingProgress] = await dbPool.query(
    'SELECT status FROM progress_records WHERE learner_id = ? AND lesson_unit_id = ?',
    [learnerId, lessonUnitId]
  );

  let progressUpdated = false;
  if (existingProgress.length === 0) {
    await dbPool.query(
      'INSERT INTO progress_records (learner_id, lesson_unit_id, status, completed_at) VALUES (?, ?, "completed", NOW())',
      [learnerId, lessonUnitId]
    );
    progressUpdated = true;
  } else if (existingProgress[0].status !== 'completed') {
    await dbPool.query(
      'UPDATE progress_records SET status = "completed", completed_at = NOW() WHERE learner_id = ? AND lesson_unit_id = ?',
      [learnerId, lessonUnitId]
    );
    progressUpdated = true;
  }

  return {
    attemptId: attemptResult.insertId,
    progressUpdated
  };
}

/**
 * Calculates aggregate and subject-specific progress for a learner.
 * @param {number} learnerId 
 * @param {object} dbPool 
 * @returns {Promise<object>}
 */
async function getLearnerProgress(learnerId, dbPool) {
  // Get all lessons to match against progress
  const [lessons] = await dbPool.query(
    'SELECT id, subject, title, sequence_order FROM lesson_units ORDER BY subject, sequence_order'
  );

  // Get learner completed/in_progress list
  const [progressRows] = await dbPool.query(
    'SELECT lesson_unit_id, status, completed_at FROM progress_records WHERE learner_id = ?',
    [learnerId]
  );

  // Map progress by lesson ID
  const progressMap = {};
  progressRows.forEach(row => {
    progressMap[row.lesson_unit_id] = {
      status: row.status,
      completed_at: row.completed_at
    };
  });

  // Calculate scores per lesson
  const [attempts] = await dbPool.query(
    'SELECT lesson_unit_id, score, total_questions, attempted_at FROM quiz_attempts WHERE learner_id = ? ORDER BY attempted_at DESC',
    [learnerId]
  );

  // Group attempts by lesson to find max score or average score
  const quizScores = {};
  attempts.forEach(att => {
    if (!quizScores[att.lesson_unit_id]) {
      quizScores[att.lesson_unit_id] = [];
    }
    quizScores[att.lesson_unit_id].push({
      score: att.score,
      total: att.total_questions,
      percentage: Math.round((att.score / att.total_questions) * 100),
      date: att.attempted_at
    });
  });

  // Build lesson metrics
  let englishTotal = 0;
  let englishCompleted = 0;
  let mathTotal = 0;
  let mathCompleted = 0;
  
  const lessonDetails = lessons.map(lesson => {
    const prog = progressMap[lesson.id] || { status: 'not_started', completed_at: null };
    const scores = quizScores[lesson.id] || [];
    const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.percentage)) : null;

    if (lesson.subject === 'english') {
      englishTotal++;
      if (prog.status === 'completed') englishCompleted++;
    } else if (lesson.subject === 'math') {
      mathTotal++;
      if (prog.status === 'completed') mathCompleted++;
    }

    return {
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      sequence: lesson.sequence_order,
      status: prog.status,
      completedAt: prog.completed_at,
      bestScore: bestScore,
      attemptsCount: scores.length
    };
  });

  const totalLessons = englishTotal + mathTotal;
  const completedLessons = englishCompleted + mathCompleted;
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const englishPercentage = englishTotal > 0 ? Math.round((englishCompleted / englishTotal) * 100) : 0;
  const mathPercentage = mathTotal > 0 ? Math.round((mathCompleted / mathTotal) * 100) : 0;

  // Calculate average quiz score overall
  let totalScorePercentageSum = 0;
  let quizCount = 0;
  Object.keys(quizScores).forEach(lessonId => {
    const scores = quizScores[lessonId];
    if (scores.length > 0) {
      // Use best score for average calculation
      const best = Math.max(...scores.map(s => s.percentage));
      totalScorePercentageSum += best;
      quizCount++;
    }
  });
  const avgQuizScore = quizCount > 0 ? Math.round(totalScorePercentageSum / quizCount) : 0;

  return {
    learnerId,
    overall: {
      total: totalLessons,
      completed: completedLessons,
      percentage: overallPercentage,
      avgQuizScore: avgQuizScore
    },
    subjects: {
      english: {
        total: englishTotal,
        completed: englishCompleted,
        percentage: englishPercentage
      },
      math: {
        total: mathTotal,
        completed: mathCompleted,
        percentage: mathPercentage
      }
    },
    lessons: lessonDetails,
    history: attempts.slice(0, 10) // Last 10 quiz attempts
  };
}

module.exports = {
  checkAnswer,
  saveQuizAttempt,
  getLearnerProgress
};
