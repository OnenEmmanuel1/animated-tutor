# TutorToon 🎒

Online Animated Nursery English & Mathematics Tutor tailored for early childhood learners (ages 3–6). Built with Node.js, Express, EJS, and MySQL, styling utilizes a flat, high-contrast, child-friendly design system with custom animations (strictly no gradients) and all CSS classes prefixed with `ntut-`.

---

## Technical Stack & Architecture

- **Backend Engine**: Node.js + Express.js.
- **Business Logic Layer**: `engine/ntutEngine.js` houses all quiz evaluation scoring, student progress percentages, and lesson-state logic, separating it from the endpoint routers.
- **JSON API Routes**: Located in `routes/api/*.js` (fully separated from EJS page renders in `routes/pages/*.js`).
- **Database Layer**: MySQL utilizing raw parameterized queries via `mysql2/promise` (no heavy ORM dependencies).
- **CSS Design System**: Flat design, solid colors (no gradients), all prefixed `ntut-*`. Includes two custom font mappings: **Inter** for management views and **Nunito** (rounded, bold, highly legible) for child-learning screens.
- **Audio & Narration System**: Uses client-side Web Audio API to dynamically synthesize success/error tones (chimes and buzzers) and the Web Speech API (`speechSynthesis`) wrapper for narrating slides and questions. This eliminates bulky audio file downloads and is highly responsive.

---

## Seed Test Credentials

The database contains seeded test accounts. The password for **all** accounts is `password123`:

- **Teacher / Admin Account**:
  - Email: `teacher@tutortoon.com`
  - Password: `password123`
- **Parent Account #1 (has Child 'Tommy')**:
  - Email: `robert@parent.com`
  - Password: `password123`
- **Parent Account #2 (has Child 'Lily')**:
  - Email: `sarah@parent.com`
  - Password: `password123`

---

## Installation & Running Locally

Ensure you have **Node.js** (v16+) and **MySQL** server installed locally.

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and adjust the variables to match your local MySQL configuration:
```env
PORT=3000
SESSION_SECRET=your_secret_key_here
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=tutortoon_db
DB_PORT=3306
```

### 2. Import Database Schema & Seeds
Execute these SQL scripts on your local MySQL server instance:
```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Run the Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running with Docker Compose 🐳

If you have Docker installed, you can launch the database and the web application together instantly without installing Node.js or MySQL locally:

```bash
# 1. Build and start containers
docker-compose up --build -d

# 2. Monitor execution logs
docker-compose logs -f web
```
The application will be accessible at [http://localhost:3000](http://localhost:3000). The database service automatically imports `schema.sql` and `seed.sql` on its initial boot.

---

## Folder Structure

```text
├── config/
│   └── db.js                 # MySQL Pool hookup
├── engine/
│   └── ntutEngine.js         # Core analytical/scoring business logic
├── middleware/
│   └── auth.js               # Access guards & role assertions
├── routes/
│   ├── api/                  # JSON API endpoints
│   │   ├── auth.js
│   │   ├── learners.js
│   │   ├── lessons.js
│   │   └── quizzes.js
│   └── pages/                # EJS page render views
│       ├── auth.js
│       └── dashboards.js
├── public/
│   ├── css/
│   │   └── style.css         # ntut- custom flat stylesheet
│   └── js/
│       ├── animation.js      # Lesson slides animator
│       ├── audio.js          # TTS Speech + synth Audio cues
│       └── quiz.js           # Quiz interactor
├── views/
│   ├── pages/                # Views (login, dashboard, player)
│   └── partials/             # EJS modular layouts (header, footer, nav)
├── Dockerfile
├── docker-compose.yml
├── schema.sql
├── seed.sql
├── package.json
└── README.md
```
