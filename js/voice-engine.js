/* ==========================================================================
   KRISHIMITRA AI - Web Speech Engine (STT & TTS)
   Speech Recognition & Text-to-Speech in Malayalam & English
   ========================================================================== */

const VoiceEngine = {
  recognition: null,
  isListening: false,
  isSpeaking: false,
  activeUtterance: null,
  currentSpeakingBtn: null,
  state: 'IDLE', // IDLE, LISTENING, PROCESSING, ERROR
  synthesis: typeof window !== 'undefined' ? window.speechSynthesis : null,
  voices: [],
  currentTranscript: '',
  callbacks: {},

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  isTtsSupported() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  },

  init() {
    // 1. Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    } else {
      console.warn("[VOICE] Web Speech Recognition API is not supported in this browser.");
    }

    // 2. Speech Synthesis & Voices Setup
    if (this.isTtsSupported()) {
      this.synthesis = window.speechSynthesis;
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices() || [];
        console.log(`[VOICE] Loaded ${this.voices.length} synthesis voices`);
      };

      loadVoices();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = loadVoices;
      }
    }
  },

  async startListening(lang = 'ml', callbacks = {}) {
    console.log('[VOICE] Starting speech recognition');
    // Stop any ongoing speech before starting to listen
    this.stopSpeaking();

    this.callbacks = callbacks;
    this.currentTranscript = '';

    if (!this.isSupported()) {
      console.warn('[VOICE] Speech recognition not supported in browser');
      this.setState('ERROR', { code: 'not-supported' });
      if (callbacks.onError) callbacks.onError('not-supported');
      return;
    }

    if (!this.recognition) {
      this.init();
    }

    // Request microphone permission explicitly first
    console.log('[VOICE] Microphone permission requested');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream tracks after permission confirmation
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (permErr) {
      console.error('[VOICE] Microphone permission denied:', permErr);
      this.setState('ERROR', { code: 'not-allowed' });
      if (callbacks.onError) callbacks.onError('not-allowed');
      return;
    }

    const recognitionLang = (lang === 'ml') ? 'ml-IN' : 'en-IN';
    this.recognition.lang = recognitionLang;
    console.log(`[VOICE] Setting language to ${recognitionLang}`);

    this.recognition.onstart = () => {
      console.log('[VOICE] Recognition started');
      this.isListening = true;
      this.setState('LISTENING');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (interimTranscript) {
        console.log('[VOICE] Interim transcript:', interimTranscript);
        this.currentTranscript = interimTranscript;
        if (callbacks.onInterim) callbacks.onInterim(interimTranscript);
      }

      if (finalTranscript) {
        console.log('[VOICE] Final transcript:', finalTranscript);
        this.currentTranscript = finalTranscript;
        if (callbacks.onFinal) callbacks.onFinal(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('[VOICE] Recognition error:', event.error);
      this.isListening = false;
      this.setState('ERROR', { code: event.error });
      if (callbacks.onError) callbacks.onError(event.error);
    };

    this.recognition.onend = () => {
      console.log('[VOICE] Recognition ended');
      this.isListening = false;
      if (this.state === 'LISTENING') {
        if (this.currentTranscript && this.currentTranscript.trim().length > 0) {
          this.setState('PROCESSING');
          if (callbacks.onComplete) callbacks.onComplete(this.currentTranscript.trim());
        } else {
          this.setState('ERROR', { code: 'no-speech' });
          if (callbacks.onError) callbacks.onError('no-speech');
        }
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error('[VOICE] Recognition start error:', e);
      this.isListening = false;
      this.setState('ERROR', { code: 'start-failed' });
      if (callbacks.onError) callbacks.onError('start-failed');
    }
  },

  stopListening() {
    console.log('[VOICE] Stopping speech recognition');
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('[VOICE] Error stopping recognition:', e);
      }
    }
    this.isListening = false;
  },

  setState(newState, data = {}) {
    this.state = newState;
    console.log(`[VOICE] State changed to: ${newState}`, data);
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState, data);
    }
  },

  cleanTextForSpeech(text, isMalayalam = false) {
    if (!text) return '';
    let cleaned = text
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove markdown bold/italics/code
      .replace(/[*_#`~>]/g, '')
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove common emojis to prevent robotic reading
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      // Remove bullet symbols
      .replace(/^[\s•\-\*]+/gm, '')
      // Clean up numbered list prefixes if present
      .replace(/^\d+[\.\)]\s*/gm, '');

    if (isMalayalam) {
      cleaned = cleaned
        // Expand common agricultural abbreviations into spoken Malayalam
        .replace(/(\d+)\s*g\/L/gi, '$1 ഗ്രാം ഒരു ലിറ്ററിൽ')
        .replace(/(\d+)\s*ml\/L/gi, '$1 മില്ലി ഒരു ലിറ്ററിൽ')
        .replace(/(\d+)\s*kg/gi, '$1 കിലോഗ്രാം')
        .replace(/(\d+)\s*%/g, '$1 ശതമാനം')
        .replace(/\bKAU\b/gi, 'കേരള കാർഷിക സർവകലാശാല')
        .replace(/\bNSKE\b/gi, 'വേപ്പിൻകുരു സത്ത്')
        .replace(/\bNPK\b/gi, 'എൻ പി കെ വളങ്ങൾ')
        // Clean out raw latin technical names in parentheses inside Malayalam text if needed
        .replace(/\(([A-Za-z\s\-\.]+)\)/g, ' $1 ');
    }

    return cleaned
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Check if a native Malayalam voice is available in the browser.
   */
  hasMalayalamVoice() {
    const voices = (this.voices && this.voices.length > 0) ? this.voices : (this.synthesis ? this.synthesis.getVoices() : []) || [];
    return voices.some(v =>
      (v.lang && (v.lang.toLowerCase() === 'ml-in' || v.lang.toLowerCase().startsWith('ml'))) ||
      (v.name && (v.name.toLowerCase().includes('malayalam') || v.name.toLowerCase().includes('sobhana') || v.name.toLowerCase().includes('midhun') || v.name.includes('മലയാളം')))
    );
  },

  /**
   * Split text into chunks of at most maxLen characters, breaking at sentence/word boundaries.
   */
  _splitTextForGoogleTTS(text, maxLen = 200) {
    if (!text || text.length <= maxLen) return [text];
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        chunks.push(remaining);
        break;
      }
      let cut = remaining.lastIndexOf('.', maxLen);
      if (cut < 40) cut = remaining.lastIndexOf(',', maxLen);
      if (cut < 40) cut = remaining.lastIndexOf(' ', maxLen);
      if (cut < 40) cut = maxLen;
      chunks.push(remaining.substring(0, cut + 1).trim());
      remaining = remaining.substring(cut + 1).trim();
    }
    return chunks.filter(c => c.length > 0);
  },

  /**
   * Speak Malayalam text using Google Translate TTS via our server proxy.
   * Falls back to this when no native ml-IN voice is installed on Windows.
   */
  _speakViaGoogleTTS(text, options = {}) {
    const cleanText = this.cleanTextForSpeech(text, true);
    if (!cleanText) return;

    const chunks = this._splitTextForGoogleTTS(cleanText, 200);
    let currentIndex = 0;
    this.isSpeaking = true;
    if (options.btnElement) {
      this.currentSpeakingBtn = options.btnElement;
    }

    console.log(`[VOICE] Using Google TTS fallback for Malayalam (${chunks.length} chunks)`);

    // Determine the backend base URL
    const backendBase = (typeof BACKEND_URL !== 'undefined') ? BACKEND_URL : `${window.location.origin}/api`;
    // Strip trailing /api if present to get origin
    const baseOrigin = backendBase.replace(/\/api\/?$/, '');

    const playNext = () => {
      if (currentIndex >= chunks.length || !this.isSpeaking) {
        this.isSpeaking = false;
        this._currentAudio = null;
        this.currentSpeakingBtn = null;
        console.log('[VOICE] Google TTS playback ended');
        if (options.onEnd) options.onEnd();
        return;
      }

      const chunk = chunks[currentIndex];
      // Use our server-side proxy to avoid CORS issues
      const url = `${baseOrigin}/api/tts?tl=ml&q=${encodeURIComponent(chunk)}`;
      const audio = new Audio(url);
      this._currentAudio = audio;

      audio.onplay = () => {
        if (currentIndex === 0) {
          console.log('[VOICE] Google TTS playback started');
          if (options.onStart) options.onStart();
        }
      };

      audio.onended = () => {
        currentIndex++;
        playNext();
      };

      audio.onerror = (e) => {
        console.warn('[VOICE] Google TTS chunk error:', e);
        currentIndex++;
        if (currentIndex < chunks.length) {
          playNext();
        } else {
          this.isSpeaking = false;
          this._currentAudio = null;
          this.currentSpeakingBtn = null;
          if (options.onError) options.onError(e);
        }
      };

      audio.play().catch(err => {
        console.warn('[VOICE] Google TTS play() rejected:', err);
        // Fall back to native synthesis as last resort
        this._speakViaNativeSynthesis(text, 'ml', options);
      });
    };

    playNext();
  },

  /**
   * Speak using native Web Speech Synthesis API.
   */
  _speakViaNativeSynthesis(text, lang, options = {}) {
    const isMalayalam = (lang === 'ml') || /[\u0D00-\u0D7F]/.test(text || '');
    const cleanText = this.cleanTextForSpeech(text, isMalayalam);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isMalayalam ? 'ml-IN' : 'en-IN';
    utterance.rate = isMalayalam ? 0.90 : 0.95;
    utterance.pitch = 1.0;

    // Pick best matching voice
    const voices = (this.voices && this.voices.length > 0) ? this.voices : (this.synthesis.getVoices() || []);
    if (voices && voices.length > 0) {
      let matchedVoice = null;
      if (isMalayalam) {
        matchedVoice = voices.find(v =>
          (v.lang && (v.lang.toLowerCase() === 'ml-in' || v.lang.toLowerCase().startsWith('ml'))) ||
          (v.name && (v.name.toLowerCase().includes('malayalam') || v.name.toLowerCase().includes('sobhana') || v.name.toLowerCase().includes('midhun') || v.name.includes('മലയാളം')))
        );
        if (!matchedVoice) {
          matchedVoice = voices.find(v =>
            (v.lang && (v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase() === 'ta-in' || v.lang.toLowerCase() === 'en-in'))
          );
        }
      } else {
        matchedVoice = voices.find(v => (v.lang && v.lang.toLowerCase() === 'en-in') || (v.name && v.name.toLowerCase().includes('india')))
                    || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      }
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        console.log('[VOICE] Selected native voice:', matchedVoice.name, matchedVoice.lang);
      }
    }

    this.activeUtterance = utterance;
    this.isSpeaking = true;
    if (options.btnElement) {
      this.currentSpeakingBtn = options.btnElement;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('[VOICE] Native speech started');
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.currentSpeakingBtn = null;
      console.log('[VOICE] Native speech ended');
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[VOICE] Native speech error:', e);
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.currentSpeakingBtn = null;
      if (options.onError) options.onError(e);
    };

    try {
      if (this.synthesis.paused) this.synthesis.resume();
    } catch (e) {}

    setTimeout(() => {
      try {
        this.synthesis.speak(utterance);
      } catch (err) {
        console.error('[VOICE] Native speak failed:', err);
      }
    }, 50);
  },

  speak(text, lang = 'ml', options = {}) {
    // Stop any ongoing speech first
    this.stopSpeaking();

    // Detect if text contains Malayalam characters
    const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(text || '');
    const isMalayalam = hasMalayalamScript || (lang === 'ml') || (typeof AppState !== 'undefined' && AppState.currentLang === 'ml');

    console.log(`[VOICE] speak() called — isMalayalam: ${isMalayalam}, hasMalayalamScript: ${hasMalayalamScript}, lang: ${lang}`);

    if (isMalayalam && !this.hasMalayalamVoice()) {
      // No native Malayalam voice installed → use Google Translate TTS
      console.log('[VOICE] No native Malayalam voice found. Using Google Translate TTS fallback.');
      this._speakViaGoogleTTS(text, options);
      return;
    }

    if (!this.isTtsSupported()) {
      console.warn('[VOICE] Text-to-speech not supported in this browser');
      if (options.onError) options.onError(new Error('TTS not supported'));
      return;
    }

    // Use native Web Speech API
    this._speakViaNativeSynthesis(text, isMalayalam ? 'ml' : 'en', options);
  },

  stopSpeaking() {
    // Stop Google TTS audio if playing
    if (this._currentAudio) {
      try {
        this._currentAudio.pause();
        this._currentAudio.currentTime = 0;
        this._currentAudio.src = '';
      } catch (e) {}
      this._currentAudio = null;
    }

    // Stop native synthesis
    if (this.isTtsSupported() && this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch (e) {
        console.warn('[VOICE] Error cancelling synthesis:', e);
      }
    }
    this.isSpeaking = false;
    this.activeUtterance = null;
    if (this.currentSpeakingBtn) {
      const btn = this.currentSpeakingBtn;
      this.currentSpeakingBtn = null;
      btn.classList.remove('speaking');
      const textSpan = btn.querySelector('span');
      if (textSpan) {
        const lang = (typeof AppState !== 'undefined' && AppState.currentLang) || 'en';
        textSpan.textContent = (typeof translations !== 'undefined' && translations[lang]?.listenBtn) || (lang === 'ml' ? 'ശ്രദ്ധിക്കൂ' : 'Listen');
      }
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-volume-high';
      }
    }
  }
};

// Initialize voice engine on load
document.addEventListener('DOMContentLoaded', () => {
  VoiceEngine.init();
});
