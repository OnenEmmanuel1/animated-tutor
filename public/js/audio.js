/**
 * TutorToon Client-side Sound & Narration Engine (public/js/audio.js)
 * Implements HTML5 Synthesizer beeps for visual feedback & Web Speech API Synthesis for child-focused dynamic narration.
 */

const NtutAudio = {
  synth: window.speechSynthesis,
  audioCtx: null,

  /**
   * Initializes Web Audio context on user interaction.
   */
  initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  /**
   * Synthesizes a system audio cue using the Web Audio API.
   * @param {string} type - 'success' or 'error'
   */
  playCue(type) {
    try {
      this.initAudio();
      
      // Simple oscillators to avoid needing static mp3 files
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'success') {
        // Double sweet ding-ding chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Gentle lower-pitched double buzz
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now); // Low buzz
        osc.frequency.setValueAtTime(140, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn('Web Audio synthesis not supported or blocked:', e);
    }
  },

  /**
   * Speaks narration using the browser Web Speech API (fallback).
   * @param {string} text - Phrase to narrate
   * @param {Function} onEndCallback - Triggered when speech completes
   */
  speak(text, onEndCallback) {
    if (!this.synth) {
      console.warn('Web Speech API is not supported in this browser.');
      if (onEndCallback) onEndCallback();
      return;
    }

    // Cancel active speech
    this.synth.cancel();

    // Configure child-friendly voice settings
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Slightly slower for comprehension
    utterance.pitch = 1.35; // Slightly higher pitched/energetic child tutor tone

    // Fetch and assign an English voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (onEndCallback) onEndCallback();
    };

    this.synth.speak(utterance);
  },

  /**
   * Stops any currently playing speech synthesis.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
};

// Warm voices list on load (some browsers fetch voices asynchronously)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
}
