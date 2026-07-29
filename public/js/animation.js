/**
 * TutorToon Canvas Animation Orchestrator (public/js/animation.js)
 * Implements interactive lesson slides with custom CSS animation layouts, emojis, and narration.
 */

class NtutLessonPlayer {
  constructor(canvasId, assetType, lessonId) {
    this.canvas = document.getElementById(canvasId);
    this.assetType = assetType;
    this.lessonId = lessonId;
    this.currentStep = 0;
    this.isPlaying = false;
    this.speechTimeout = null;

    // Define interactive slides data per lesson
    this.slidesData = {
      'alphabet_safari': [
        { letter: 'A', word: 'Apple', emoji: '🍎', phrase: 'A is for Apple!' },
        { letter: 'B', word: 'Bear', emoji: '🐻', phrase: 'B is for Bear!' },
        { letter: 'C', word: 'Cat', emoji: '🐱', phrase: 'C is for Cat!' },
        { letter: 'D', word: 'Dog', emoji: '🐶', phrase: 'D is for Dog!' },
        { letter: 'E', word: 'Elephant', emoji: '🐘', phrase: 'E is for Elephant!' },
        { letter: 'F', word: 'Fox', emoji: '🦊', phrase: 'F is for Fox!' },
        { letter: 'G', word: 'Giraffe', emoji: '🦒', phrase: 'G is for Giraffe!' }
      ],
      'phonics_fun': [
        { letter: 'A', sound: 'Ah', word: 'Apple', emoji: '🍎', phrase: 'Vowel A makes the sound: Ah! Ah! Apple.' },
        { letter: 'E', sound: 'Eh', word: 'Egg', emoji: '🥚', phrase: 'Vowel E makes the sound: Eh! Eh! Egg.' },
        { letter: 'I', sound: 'Ih', word: 'Igloo', emoji: '⛺', phrase: 'Vowel I makes the sound: Ih! Ih! Igloo.' },
        { letter: 'O', sound: 'Oh', word: 'Octopus', emoji: '🐙', phrase: 'Vowel O makes the sound: Oh! Oh! Octopus.' },
        { letter: 'U', sound: 'Uh', word: 'Umbrella', emoji: '☂️', phrase: 'Vowel U makes the sound: Uh! Uh! Umbrella.' }
      ],
      'word_building': [
        { letters: ['C', 'A', 'T'], word: 'CAT', emoji: '🐱', phrase: 'Let us build a word. C, A, T makes Cat!' },
        { letters: ['D', 'O', 'G'], word: 'DOG', emoji: '🐶', phrase: 'Next word. D, O, G makes Dog!' },
        { letters: ['S', 'U', 'N'], word: 'SUN', emoji: '☀️', phrase: 'Last word. S, U, N makes Sun!' }
      ],
      'number_magic': [
        { number: '1', emoji: '🎈', count: 1, phrase: 'This is the number 1. Here is one balloon!' },
        { number: '2', emoji: '🍒', count: 2, phrase: 'This is the number 2. Let us count: one, two cherries!' },
        { number: '3', emoji: '🦖', count: 3, phrase: 'This is the number 3. Let us count: one, two, three dinosaurs!' },
        { number: '4', emoji: '⭐', count: 4, phrase: 'This is the number 4. Let us count: one, two, three, four stars!' },
        { number: '5', emoji: '🍎', count: 5, phrase: 'This is the number 5. Let us count: one, two, three, four, five apples!' }
      ],
      'counting_friends': [
        { emoji: '🦋', count: 4, phrase: 'Can you count the butterflies? One, two, three, four butterflies!' },
        { emoji: '🦆', count: 5, phrase: 'Can you count the ducks? One, two, three, four, five ducks!' },
        { emoji: '🦁', count: 3, phrase: 'Can you count the lions? One, two, three lions! Roar!' }
      ],
      'playful_addition': [
        { left: 1, right: 1, sum: 2, emoji: '🎈', phrase: 'One balloon plus one balloon makes two balloons!' },
        { left: 2, right: 1, sum: 3, emoji: '🍎', phrase: 'Two apples plus one apple makes three apples!' },
        { left: 3, right: 2, sum: 5, emoji: '⭐', phrase: 'Three stars plus two stars makes five stars!' }
      ]
    };

    this.slides = this.slidesData[this.assetType] || [];
  }

  init() {
    this.currentStep = 0;
    this.isPlaying = true;
    this.renderStep();
    
    // Register event listeners
    document.getElementById('play-btn')?.addEventListener('click', () => this.play());
    document.getElementById('pause-btn')?.addEventListener('click', () => this.pause());
    document.getElementById('prev-btn')?.addEventListener('click', () => this.prev());
    document.getElementById('next-btn')?.addEventListener('click', () => this.next());
    document.getElementById('replay-btn')?.addEventListener('click', () => this.replay());
  }

  renderStep() {
    this.canvas.innerHTML = '';
    const slide = this.slides[this.currentStep];
    if (!slide) return;

    // Update step tracker text on screen
    const tracker = document.getElementById('step-tracker');
    if (tracker) {
      tracker.innerText = `Card ${this.currentStep + 1} of ${this.slides.length}`;
    }

    // Call individual rendering based on lesson asset type
    switch (this.assetType) {
      case 'alphabet_safari':
        this.renderAlphabetSafari(slide);
        break;
      case 'phonics_fun':
        this.renderPhonicsFun(slide);
        break;
      case 'word_building':
        this.renderWordBuilding(slide);
        break;
      case 'number_magic':
        this.renderNumberMagic(slide);
        break;
      case 'counting_friends':
        this.renderCountingFriends(slide);
        break;
      case 'playful_addition':
        this.renderPlayfulAddition(slide);
        break;
      default:
        this.canvas.innerHTML = `<h2 class="ntut-h2 text-center">No animation logic for ${this.assetType}</h2>`;
    }

    if (this.isPlaying) {
      this.narrate(slide.phrase);
    }
  }

  narrate(phrase) {
    NtutAudio.speak(phrase, () => {
      // Auto-advance checking if desired (for young children, we'll wait for manual clicks or auto-continue after 7s)
      if (this.isPlaying && this.currentStep < this.slides.length - 1) {
        clearTimeout(this.speechTimeout);
        this.speechTimeout = setTimeout(() => {
          this.next();
        }, 7000); // 7 seconds pause after speech (adjusted for early childhood learners)
      } else if (this.currentStep === this.slides.length - 1) {
        // Automatically prompt to take the quiz
        this.showQuizPrompt();
      }
    });
  }

  showQuizPrompt() {
    const promptContainer = document.createElement('div');
    promptContainer.style.position = 'absolute';
    promptContainer.style.bottom = '20px';
    promptContainer.style.left = '0';
    promptContainer.style.right = '0';
    promptContainer.style.display = 'flex';
    promptContainer.style.justifyContent = 'center';
    promptContainer.innerHTML = `
      <a href="/quiz/${this.lessonId}" class="ntut-btn ntut-btn-secondary ntut-kid-btn-giant" style="animation: ntutPulse 1.5s infinite ease-in-out;">
        🎮 Play the Quiz!
      </a>
    `;
    this.canvas.appendChild(promptContainer);
    
    // Play a friendly success sound once
    NtutAudio.playCue('success');
  }

  /* --- Individual Lesson Renderers --- */

  renderAlphabetSafari(slide) {
    // Left side: Giant bouncing letter
    const letterEl = document.createElement('div');
    letterEl.className = 'ntut-animated-item ntut-giant-letter ntut-anim-bounce';
    letterEl.style.left = '15%';
    letterEl.innerText = slide.letter;
    this.canvas.appendChild(letterEl);

    // Right side: The word and its matching emoji
    const contentEl = document.createElement('div');
    contentEl.className = 'ntut-animated-item ntut-anim-wiggle';
    contentEl.style.right = '15%';
    contentEl.style.flexDirection = 'column';
    contentEl.innerHTML = `
      <div class="ntut-safari-emoji">${slide.emoji}</div>
      <div class="ntut-safari-word">${slide.word}</div>
    `;
    this.canvas.appendChild(contentEl);
  }

  renderPhonicsFun(slide) {
    const mainEl = document.createElement('div');
    mainEl.className = 'ntut-animated-item ntut-anim-pulse';
    mainEl.style.width = '100%';
    mainEl.style.height = '100%';
    mainEl.style.flexDirection = 'column';
    mainEl.innerHTML = `
      <div class="ntut-phonics-letter">${slide.letter}</div>
      <div class="ntut-phonics-phrase">
        "${slide.sound}" is for ${slide.emoji} ${slide.word}
      </div>
    `;
    this.canvas.appendChild(mainEl);
  }

  renderWordBuilding(slide) {
    const lettersContainer = document.createElement('div');
    lettersContainer.className = 'ntut-animated-item ntut-word-container';
    lettersContainer.style.top = '30%';

    slide.letters.forEach((char, index) => {
      const charBox = document.createElement('div');
      charBox.className = 'ntut-word-charbox ntut-anim-bounce';
      charBox.style.animationDelay = `${index * 0.2}s`;
      charBox.innerText = char;
      lettersContainer.appendChild(charBox);
    });
    this.canvas.appendChild(lettersContainer);

    // Emojis slide in from bottom
    const emojiEl = document.createElement('div');
    emojiEl.className = 'ntut-animated-item ntut-anim-float ntut-word-display';
    emojiEl.style.bottom = '20px';
    emojiEl.innerHTML = `${slide.emoji} &nbsp; <strong>${slide.word}</strong>`;
    emojiEl.style.left = 'calc(50% - 150px)';
    this.canvas.appendChild(emojiEl);
  }

  renderNumberMagic(slide) {
    // Left: Number digit
    const numEl = document.createElement('div');
    numEl.className = 'ntut-animated-item ntut-magic-num ntut-anim-pulse';
    numEl.style.left = '15%';
    numEl.innerText = slide.number;
    this.canvas.appendChild(numEl);

    // Right: Group of objects matching the quantity
    const objectContainer = document.createElement('div');
    objectContainer.className = 'ntut-animated-item ntut-magic-emoji-group';
    objectContainer.style.right = '10%';

    for (let i = 0; i < slide.count; i++) {
      const item = document.createElement('span');
      item.className = 'ntut-magic-emoji ntut-anim-float';
      item.style.animationDelay = `${i * 0.25}s`;
      item.innerText = slide.emoji;
      objectContainer.appendChild(item);
    }
    this.canvas.appendChild(objectContainer);
  }

  renderCountingFriends(slide) {
    const listContainer = document.createElement('div');
    listContainer.className = 'ntut-animated-item ntut-counting-grid';

    for (let i = 0; i < slide.count; i++) {
      const card = document.createElement('div');
      card.className = 'ntut-counting-card ntut-anim-bounce';
      card.style.animationDelay = `${i * 0.3}s`;

      card.innerHTML = `
        <span class="ntut-counting-emoji">${slide.emoji}</span>
        <strong class="ntut-counting-badge">${i + 1}</strong>
      `;
      listContainer.appendChild(card);
    }
    this.canvas.appendChild(listContainer);
  }

  renderPlayfulAddition(slide) {
    const addBox = document.createElement('div');
    addBox.className = 'ntut-animated-item ntut-addition-box';

    // Left objects
    const leftDiv = document.createElement('div');
    leftDiv.className = 'ntut-addition-group';
    for (let i = 0; i < slide.left; i++) {
      leftDiv.innerHTML += `<span class="ntut-addition-emoji ntut-anim-float">${slide.emoji}</span>`;
    }

    // Plus symbol
    const plusDiv = document.createElement('div');
    plusDiv.className = 'ntut-addition-symbol';
    plusDiv.innerText = '+';

    // Right objects
    const rightDiv = document.createElement('div');
    rightDiv.className = 'ntut-addition-group';
    for (let i = 0; i < slide.right; i++) {
      rightDiv.innerHTML += `<span class="ntut-addition-emoji ntut-anim-float">${slide.emoji}</span>`;
    }

    // Equals symbol
    const eqDiv = document.createElement('div');
    eqDiv.className = 'ntut-addition-symbol';
    eqDiv.innerText = '=';

    // Sum result card
    const sumDiv = document.createElement('div');
    sumDiv.className = 'ntut-addition-result ntut-anim-pulse';

    let sumEmojis = '';
    for (let i = 0; i < slide.sum; i++) {
      sumEmojis += slide.emoji;
    }

    sumDiv.innerHTML = `
      <span class="ntut-addition-result-emoji">${sumEmojis}</span>
      <span class="ntut-addition-result-number">${slide.sum}</span>
    `;

    addBox.appendChild(leftDiv);
    addBox.appendChild(plusDiv);
    addBox.appendChild(rightDiv);
    addBox.appendChild(eqDiv);
    addBox.appendChild(sumDiv);

    this.canvas.appendChild(addBox);
  }

  /* --- Navigation Controls --- */

  play() {
    this.isPlaying = true;
    this.renderStep();
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.speechTimeout);
    NtutAudio.stop();
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderStep();
    }
  }

  next() {
    if (this.currentStep < this.slides.length - 1) {
      this.currentStep++;
      this.renderStep();
    } else {
      // Completed, call completion tracking API
      this.markLessonComplete();
    }
  }

  replay() {
    this.renderStep();
  }

  async markLessonComplete() {
    try {
      const response = await fetch(`/api/lessons/${this.lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      const data = await response.json();
      if (data.success) {
        console.log('Progress status updated: completed');
      }
    } catch (err) {
      console.warn('API error saving progress:', err);
    }
  }
}
