/**
 * TutorToon Main Application Server Entry Point (server.js)
 */
const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Redis session store (used in production / on Vercel)
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Template Engine Configuration (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Body Parser and Static Files Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. Express Session Middleware Setup
// Use RedisStore in production (REDIS_URL set), fall back to memory store locally.
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'tutortoon_secret_key_987654321',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.VERCEL === '1' // HTTPS-only cookies on Vercel
  }
};

if (process.env.REDIS_URL) {
  const redisClient = new Redis(process.env.REDIS_URL, {
    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined
  });
  redisClient.on('error', (err) => console.error('Redis client error:', err));
  sessionConfig.store = new RedisStore({ client: redisClient, prefix: 'tutortoon:' });
  console.log('Session store: Redis (Upstash)');
} else {
  console.warn('REDIS_URL not set — using in-memory session store (local dev only).');
}

app.use(session(sessionConfig));

// Provide global access to session variables inside EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.learnerId = req.session.learnerId || null;
  res.locals.learnerName = req.session.learnerName || null;
  res.locals.learnerAvatar = req.session.learnerAvatar || null;
  next();
});

// 4. Bind Page Rendering Routes (Separated from JSON API)
const pageAuthRouter = require('./routes/pages/auth');
const pageDashboardRouter = require('./routes/pages/dashboards');
app.use('/', pageAuthRouter);
app.use('/', pageDashboardRouter);

// 5. Bind JSON API Routes
const apiAuthRouter = require('./routes/api/auth');
const apiLearnersRouter = require('./routes/api/learners');
const apiLessonsRouter = require('./routes/api/lessons');
const apiQuizzesRouter = require('./routes/api/quizzes');

app.use('/api/auth', apiAuthRouter);
app.use('/api/learners', apiLearnersRouter);
app.use('/api/lessons', apiLessonsRouter);
app.use('/api/quizzes', apiQuizzesRouter);

// 6. Global 404 Route Handler
app.use((req, res) => {
  res.status(404);
  if (req.originalUrl.startsWith('/api/')) {
    return res.json({ error: 'Endpoint not found' });
  }
  res.render('pages/index', { error: 'Page not found' }); // Render splash as fallback
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled internal error:', err.stack);
  res.status(500);
  if (req.originalUrl.startsWith('/api/')) {
    return res.json({ error: 'Internal server error occurred.' });
  }
  res.send('Something went wrong! Please reload or contact an administrator.');
});

// 8. Start Application Server (local dev only — Vercel uses the exported app)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  TUTORTOON SERVER RUNNING AT http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

// Export for Vercel serverless function
module.exports = app;
