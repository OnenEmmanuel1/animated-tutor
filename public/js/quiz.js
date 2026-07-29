/**
 * TutorToon Quiz Gameplay Engine (public/js/quiz.js)
 * Implements interactive questions with server-side validations, audio feedback cues, and score reporting.
 */

class NtutQuizPlayer {
  constructor(questions, lessonId) {
    this.questions = questions;
    this.lessonId = lessonId;
    this.currentIndex = 0;
    this.score = 0;
    this.answersList = [];
    
    this.modalOverlay = document.getElementById('feedback-modal-overlay');
    this.modalEmoji = document.getElementById('feedback-emoji');
    this.modalTitle = document.getElementById('feedback-title');
    this.modalSubtitle = document.getElementById('feedback-subtitle');
    this.modalBtn = document.getElementById('feedback-btn');
  }

  init() {
    this.currentIndex = 0;
    this.score = 0;
    this.answersList = [];
    this.renderQuestion();

    // Register button handler in modal
    this.modalBtn?.addEventListener('click', () => {
      this.closeModal();
      this.nextQuestion();
    });
  }

  renderQuestion() {
    if (this.questions.length === 0) {
      this.renderEmptyState();
      return;
    }

    const question = this.questions[this.currentIndex];
    
    // Update progress bar
    const progressFill = document.getElementById('quiz-progress-fill');
    if (progressFill) {
      const pct = Math.round((this.currentIndex / this.questions.length) * 100);
      progressFill.style.width = `${pct}%`;
    }

    // Set question text
    const textEl = document.getElementById('question-text');
    if (textEl) {
      textEl.innerText = question.question_text;
    }

    // Speak question automatically
    NtutAudio.speak(question.question_text);

    // Build option buttons
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      
      let opts = [];
      try {
        opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
      } catch (e) {
        opts = question.options || [];
      }

      // Predefined solid flat child-friendly color palette
      const colors = [
        '#f472b6', /* Pink */
        '#60a5fa', /* Blue */
        '#fbbf24', /* Yellow */
        '#fb923c', /* Orange */
        '#c084fc', /* Purple */
        '#2dd4bf'  /* Teal */
      ];

      opts.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'ntut-quiz-option-btn';
        btn.innerText = option;
        
        // Dynamically assign background color
        const color = colors[index % colors.length];
        btn.style.backgroundColor = color;
        
        btn.addEventListener('click', () => this.handleOptionClick(btn, option, question.id));
        optionsContainer.appendChild(btn);
      });
    }
  }

  async handleOptionClick(clickedBtn, selectedValue, questionId) {
    // Disable all options immediately to prevent multi-clicks
    const btns = document.querySelectorAll('.ntut-quiz-option-btn');
    btns.forEach(b => b.disabled = true);

    try {
      // Validate answer server-side
      const response = await fetch('/api/quizzes/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, submittedOption: selectedValue })
      });

      const result = await response.json();

      if (result.correct) {
        this.score++;
        clickedBtn.classList.add('ntut-correct');
        // Visual reward animation
        clickedBtn.classList.add('ntut-anim-correct-jump');
        
        // Sound and Speech cues
        NtutAudio.playCue('success');
        
        const encouragingPhrases = [
          'Wow! You did it!',
          'Excellent work! That is correct!',
          'Hooray! You are super smart!',
          'That is right! Amazing job!'
        ];
        const randomPhrase = encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)];
        
        this.showModal('🌟', 'Great Job!', randomPhrase, 'Yellow', 'Next');
      } else {
        clickedBtn.classList.add('ntut-incorrect');
        // Shake animation for correction
        clickedBtn.classList.add('ntut-anim-shake');
        
        // Find and highlight correct answer button
        btns.forEach(b => {
          if (b.innerText.trim().toLowerCase() === result.correctOption.trim().toLowerCase()) {
            b.classList.add('ntut-correct');
          }
        });

        // Sound and Speech cues
        NtutAudio.playCue('error');
        
        const correctivePhrase = `Oops, not quite. The correct answer is ${result.correctOption}. Let us keep trying!`;
        
        this.showModal('🔍', 'Try Again!', correctivePhrase, 'Blue', 'Continue');
      }
    } catch (err) {
      console.error('Answer validation error:', err);
      // Fallback: re-enable buttons on error
      btns.forEach(b => b.disabled = false);
    }
  }

  showModal(emoji, title, subtitle, styleColor, btnText) {
    if (this.modalEmoji) this.modalEmoji.innerText = emoji;
    if (this.modalTitle) this.modalTitle.innerText = title;
    if (this.modalSubtitle) this.modalSubtitle.innerText = subtitle;
    if (this.modalBtn) this.modalBtn.innerText = btnText + ' ➡️';
    
    // Speak modal subtitle
    NtutAudio.speak(subtitle);

    this.modalOverlay?.classList.add('ntut-show');
  }

  closeModal() {
    this.modalOverlay?.classList.remove('ntut-show');
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex < this.questions.length) {
      this.renderQuestion();
    } else {
      this.finishQuiz();
    }
  }

  async finishQuiz() {
    // Fill progress bar to 100%
    const progressFill = document.getElementById('quiz-progress-fill');
    if (progressFill) {
      progressFill.style.width = '100%';
    }

    try {
      // Save result to server database
      const response = await fetch('/api/quizzes/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonUnitId: this.lessonId,
          score: this.score,
          totalQuestions: this.questions.length
        })
      });
      
      const resData = await response.json();
      console.log('Quiz saved result:', resData);
    } catch (e) {
      console.warn('Could not save quiz attempt to server:', e);
    }

    // Render result page content inside container
    const quizBox = document.getElementById('quiz-card-box');
    if (quizBox) {
      const pct = Math.round((this.score / this.questions.length) * 100);
      let finishEmoji = '🎉';
      let title = 'Quiz Finished!';
      let message = `You got ${this.score} out of ${this.questions.length} correct! Outstanding!`;

      if (pct < 50) {
        finishEmoji = '🧸';
        title = 'Good Try!';
        message = `You got ${this.score} out of ${this.questions.length} correct. Let's practice some more!`;
      } else if (pct === 100) {
        finishEmoji = '🏆';
        title = 'Superstar!';
        message = `Wow! A perfect score! ${this.score} out of ${this.questions.length} correct! You are amazing!`;
      }

      // Speak final result
      NtutAudio.speak(message);

      quizBox.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <div style="font-size: 7rem; margin-bottom: 1rem;">${finishEmoji}</div>
          <h2 class="ntut-h1" style="font-family: var(--ntut-font-kid); font-weight: 900;">${title}</h2>
          <p style="font-size: 1.5rem; font-weight: 700; margin-bottom: 2rem; color: #2c3e50;">${message}</p>
          <div style="display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap;">
            <a href="/learner-dashboard" class="ntut-btn ntut-btn-primary ntut-kid-btn-giant" style="margin:0;">
              🏠 Back to Dashboard
            </a>
            <button onclick="window.location.reload();" class="ntut-btn ntut-btn-secondary ntut-kid-btn-giant" style="margin:0;">
              🔁 Play Again
            </button>
          </div>
        </div>
      `;
    }
  }

  renderEmptyState() {
    const quizBox = document.getElementById('quiz-card-box');
    if (quizBox) {
      quizBox.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <div style="font-size: 6rem; margin-bottom: 1.5rem;">🎒</div>
          <h2 class="ntut-h2">No Questions Seeded yet!</h2>
          <p class="ntut-p" style="margin-bottom: 2rem;">Tell your teacher or parent to add questions for this lesson.</p>
          <a href="/learner-dashboard" class="ntut-btn ntut-btn-primary">Back to Dashboard</a>
        </div>
      `;
    }
  }
}
