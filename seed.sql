USE tutortoon_db;

-- Clear existing data (in reverse order of FK dependencies)
DELETE FROM quiz_attempts;
DELETE FROM progress_records;
DELETE FROM quiz_questions;
DELETE FROM lesson_units;
DELETE FROM learners;
DELETE FROM users;

-- 1. Seed Users (Password for all is 'password123')
-- Bcrypt hash: $2b$10$/dXaKEPW/u24a1NAqZo1au0tZfluR15ikCtQ7BzCErQNgq4wrzBgS
INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'Teacher Alice', 'teacher@tutortoon.com', '$2b$10$/dXaKEPW/u24a1NAqZo1au0tZfluR15ikCtQ7BzCErQNgq4wrzBgS', 'teacher_admin'),
(2, 'Parent Robert', 'robert@parent.com', '$2b$10$/dXaKEPW/u24a1NAqZo1au0tZfluR15ikCtQ7BzCErQNgq4wrzBgS', 'parent'),
(3, 'Parent Sarah', 'sarah@parent.com', '$2b$10$/dXaKEPW/u24a1NAqZo1au0tZfluR15ikCtQ7BzCErQNgq4wrzBgS', 'parent');

-- 2. Seed Learners (Child profiles under parents)
INSERT INTO learners (id, parent_id, name, avatar) VALUES
(1, 2, 'Tommy', 'bunny'),
(2, 3, 'Lily', 'fox');

-- 3. Seed Lesson Units
INSERT INTO lesson_units (id, subject, title, sequence_order, animation_asset, audio_asset) VALUES
(1, 'english', 'Alphabet Safari (A to G)', 1, 'alphabet_safari', 'alphabet_safari.mp3'),
(2, 'english', 'Phonics Fun (Vowels)', 2, 'phonics_fun', 'phonics_fun.mp3'),
(3, 'english', 'Word Building (C-A-T, D-O-G)', 3, 'word_building', 'word_building.mp3'),
(4, 'math', 'Number Magic (1 to 5)', 1, 'number_magic', 'number_magic.mp3'),
(5, 'math', 'Counting Friends', 2, 'counting_friends', 'counting_friends.mp3'),
(6, 'math', 'Playful Addition', 3, 'playful_addition', 'playful_addition.mp3');

-- 4. Seed Quiz Questions (options as JSON array, correct_option matches one of the array strings)
INSERT INTO quiz_questions (id, lesson_unit_id, question_text, question_type, options, correct_option) VALUES
-- Lesson 1 (English: Alphabet Safari A-G)
(1, 1, 'Which letter comes after A?', 'multiple_choice', '["B", "C", "D", "E"]', 'B'),
(2, 1, 'Which animal starts with the letter G?', 'multiple_choice', '["Elephant", "Lion", "Giraffe", "Monkey"]', 'Giraffe'),
(3, 1, 'What is this letter: "C"?', 'multiple_choice', '["A", "B", "C", "D"]', 'C'),

-- Lesson 2 (English: Phonics Fun Vowels)
(4, 2, 'What sound does the letter "A" make in "Apple"?', 'multiple_choice', '["Ah", "Ee", "Oh", "Uh"]', 'Ah'),
(5, 2, 'Which of these is a vowel?', 'multiple_choice', '["B", "C", "D", "E"]', 'E'),
(6, 2, 'Which vowel starts the word "Umbrella"?', 'multiple_choice', '["A", "E", "I", "U"]', 'U'),

-- Lesson 3 (English: Word Building)
(7, 3, 'How do you spell "Cat"?', 'multiple_choice', '["C-A-T", "D-O-G", "B-U-S", "S-U-N"]', 'C-A-T'),
(8, 3, 'What word is formed by: D - O - G?', 'multiple_choice', '["Cat", "Dog", "Pig", "Cow"]', 'Dog'),
(9, 3, 'Which letter is missing: S - _ - N (Sun)?', 'multiple_choice', '["A", "E", "U", "O"]', 'U'),

-- Lesson 4 (Math: Number Magic 1-5)
(10, 4, 'Which number is this: "3"?', 'multiple_choice', '["1", "2", "3", "4"]', '3'),
(11, 4, 'What number comes after 4?', 'multiple_choice', '["2", "3", "5", "6"]', '5'),
(12, 4, 'How many apples is this: 🍎 🍎?', 'multiple_choice', '["1", "2", "3", "4"]', '2'),

-- Lesson 5 (Math: Counting Friends)
(13, 5, 'Count the butterflies: 🦋 🦋 🦋 🦋', 'multiple_choice', '["3", "4", "5", "6"]', '4'),
(14, 5, 'If you have 3 cookies and eat 0, how many do you have?', 'multiple_choice', '["0", "1", "2", "3"]', '3'),
(15, 5, 'Count the ducks: 🦆 🦆 🦆 🦆 🦆', 'multiple_choice', '["4", "5", "6", "7"]', '5'),

-- Lesson 6 (Math: Playful Addition)
(16, 6, 'What is 1 + 1?', 'multiple_choice', '["1", "2", "3", "4"]', '2'),
(17, 6, 'If you have 2 balloons and get 1 more, how many do you have?', 'multiple_choice', '["2", "3", "4", "5"]', '3'),
(18, 6, 'What is 3 + 2?', 'multiple_choice', '["4", "5", "6", "7"]', '5');

-- 5. Seed some initial progress to show in dashboards
INSERT INTO progress_records (learner_id, lesson_unit_id, status, completed_at) VALUES
(1, 1, 'completed', NOW() - INTERVAL 1 DAY),
(1, 4, 'in_progress', NOW()),
(2, 1, 'completed', NOW() - INTERVAL 2 DAY),
(2, 2, 'completed', NOW() - INTERVAL 1 DAY);

-- 6. Seed some quiz attempts to show statistics
INSERT INTO quiz_attempts (learner_id, lesson_unit_id, score, total_questions, attempted_at) VALUES
(1, 1, 3, 3, NOW() - INTERVAL 1 DAY),
(2, 1, 2, 3, NOW() - INTERVAL 2 DAY),
(2, 2, 3, 3, NOW() - INTERVAL 1 DAY);
