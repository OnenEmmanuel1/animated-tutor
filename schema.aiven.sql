-- TutorToon Schema — Aiven Edition
-- Run this in: Aiven Console → your MySQL service → "Query" tab
-- (Lines CREATE DATABASE and USE are removed — Aiven manages the DB for you)

-- 1. Users Table (Parents and Teacher/Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('parent', 'teacher_admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Learners Table (Child Profiles under a Parent/Teacher)
CREATE TABLE IF NOT EXISTS learners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'bunny',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Lesson Units Table
CREATE TABLE IF NOT EXISTS lesson_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject ENUM('english', 'math') NOT NULL,
    title VARCHAR(255) NOT NULL,
    sequence_order INT NOT NULL,
    animation_asset VARCHAR(255) NOT NULL,
    audio_asset VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Quiz Questions Table (with JSON options)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_unit_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    options JSON NOT NULL,
    correct_option VARCHAR(255) NOT NULL,
    FOREIGN KEY (lesson_unit_id) REFERENCES lesson_units(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Progress Records Table (per student lesson state)
CREATE TABLE IF NOT EXISTS progress_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    lesson_unit_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completed_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY uq_learner_lesson (learner_id, lesson_unit_id),
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_unit_id) REFERENCES lesson_units(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Quiz Attempts Table (historical records of quizzes taken)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    lesson_unit_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_unit_id) REFERENCES lesson_units(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
