/* ==========================================================================
   KRISHIMITRA AI - Core Application Script
   Handles UI state, language switching, DOM events, and service bindings.
   ========================================================================== */

// Current App State
const AppState = {
  currentLang: localStorage.getItem('krishimitra_lang') || 'en',
  autoSpeak: localStorage.getItem('krishimitra_auto_speak') !== 'false', // Default to true (auto-speak responses)
  farmerProfile: ApiServices.FarmerProfile.getProfile()
};

// Global Toast Handler
function showToast(message, type = 'success') {
  try {
    let toastContainer = document.getElementById('km-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'km-toast-container';
      toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '1100';
      document.body.appendChild(toastContainer);
    }

    const bgClass = type === 'danger' ? 'bg-danger text-white' : (type === 'warning' ? 'bg-warning text-dark' : 'bg-success text-white');
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body fw-bold">
            <i class="fa-solid ${type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      const bsToast = new bootstrap.Toast(toastElement, { delay: 3500 });
      bsToast.show();
    }
  } catch (e) {
    console.log('[Toast Notice]:', message);
  }
}

// Global Language Switcher
function switchLanguage(lang) {
  AppState.currentLang = lang;
  localStorage.setItem('krishimitra_lang', lang);

  // Update button label / toggle indicator if present
  const langLabel = document.getElementById('current-lang-text');
  if (langLabel) {
    langLabel.textContent = lang === 'ml' ? 'English' : 'മലയാളം';
  }

  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // Dispatch custom event for page-specific rerenders
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Apply stored language
  switchLanguage(AppState.currentLang);

  // Setup Global Lang Toggle Button
  const langBtn = document.getElementById('btn-lang-switch');
  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const nextLang = AppState.currentLang === 'en' ? 'ml' : 'en';
      switchLanguage(nextLang);
    });
  }

  // Page Routing & Highlighting
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav-item, .mobile-sheet-card').forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Initialize Mobile Quick Services Drawer
  initMobileServicesDrawer();

  // Page Specific Controller Triggers
  if (document.getElementById('page-dashboard')) initDashboard();
  if (document.getElementById('page-chatbot')) initChatbot();
  if (document.getElementById('page-crop-disease')) initCropDoctor();
  if (document.getElementById('page-crop-recommendation')) initCropRecommendation();
  if (document.getElementById('page-weather')) initWeather();
  if (document.getElementById('page-market')) initMarket();
  if (document.getElementById('page-profile')) initProfile();
  if (document.getElementById('page-login')) initLogin();
});

// Mobile Quick Services Drawer Controller
function initMobileServicesDrawer() {
  const toggleBtn = document.getElementById('btnToggleMobileServices');
  const backdrop = document.getElementById('mobileServicesBackdrop');
  const closeBtn = document.getElementById('btnCloseMobileSheet');

  function openSheet() {
    if (backdrop) {
      backdrop.classList.add('active');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.classList.add('services-sheet-open');
    }
  }

  function closeSheet() {
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('services-sheet-open');
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSheet();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSheet();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeSheet();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('active')) {
      closeSheet();
    }
  });
}

/* ==========================================================================
   PAGE CONTROLLERS
   ========================================================================== */

// 1. Dashboard Controller
function initDashboard() {
  const profile = ApiServices.FarmerProfile.getProfile();
  const nameEl = document.getElementById('dash-farmer-name');
  const locEl = document.getElementById('dash-location');
  const emailEl = document.getElementById('dash-email');
  const mobileEl = document.getElementById('dash-mobile');

  if (nameEl) nameEl.textContent = profile.name || 'Farmer';
  if (locEl) locEl.textContent = profile.location || `${profile.district || 'Thrissur'}, Kerala`;
  if (emailEl && profile.email) emailEl.textContent = profile.email;
  if (mobileEl && profile.mobile) mobileEl.textContent = `+91 ${profile.mobile}`;

  // Load live real-time weather widget
  ApiServices.Weather.getWeather(profile.district).then(data => {
    const isMl = (AppState.currentLang === 'ml');
    const tempEl = document.getElementById('dash-temp');
    const weatherEl = document.getElementById('dash-weather-text');
    const alertEl = document.getElementById('dash-farm-alert');
    const adviceMainEl = document.getElementById('dash-today-advice-main');
    const adviceSubEl = document.getElementById('dash-today-advice-sub');

    if (tempEl) tempEl.textContent = `${data.temp}°C`;
    if (weatherEl) weatherEl.textContent = isMl ? data.conditionMl : data.conditionEn;
    if (alertEl) alertEl.textContent = isMl ? data.alertMl : data.alertEn;

    if (adviceMainEl && data.farmingAdvice) {
      adviceMainEl.textContent = `“${isMl ? data.farmingAdvice.ml : data.farmingAdvice.en}”`;
    }

    if (adviceSubEl) {
      const isRainy = (parseInt(data.rainProbability) >= 50) || (data.conditionEn && data.conditionEn.toLowerCase().includes('rain'));
      if (isMl) {
        adviceSubEl.innerHTML = `<i class="fa-solid fa-circle-info text-primary-green me-1"></i>തത്സമയ കാലാവസ്ഥ: മഴ സാധ്യത ${data.rainProbability}, ആർദ്രത ${data.humidity}. ${isRainy ? 'മഴയ്ക്ക് സാധ്യതയുള്ളതിനാൽ ഇന്ന് കീടനാശിനി പ്രയോഗം ഒഴിവാക്കുക.' : 'സാധാരണ കാർഷിക പ്രവർത്തനങ്ങൾ തുടരാം.'}`;
      } else {
        adviceSubEl.innerHTML = `<i class="fa-solid fa-circle-info text-primary-green me-1"></i>Live WeatherAPI Radar: Rain Chance ${data.rainProbability}, Humidity ${data.humidity}. ${isRainy ? 'Avoid pesticide spraying today due to expected showers.' : 'Ideal conditions for field work and routine cultivation.'}`;
      }
    }
  });

  // Allow alert dismissal
  const dismissBtn = document.getElementById('btn-dismiss-alert');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const alertContainer = document.getElementById('dash-alert-container');
      if (alertContainer) alertContainer.style.display = 'none';
    });
  }
}

/* ==========================================================================
   VOICE ASSISTANT UI CONTROLLER & MODAL MANAGEMENT
   ========================================================================== */

function ensureVoiceModalExists() {
  if (document.getElementById('voice-modal-overlay')) return;

  const lang = AppState.currentLang;
  const modalHtml = `
    <div id="voice-modal-overlay" class="voice-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="voice-modal-title">
      <div id="voice-modal-card" class="voice-modal-card">
        <button type="button" id="btn-voice-close" class="voice-close-btn" aria-label="Close voice assistant">
          <i class="fa-solid fa-xmark"></i>
        </button>
        
        <h2 id="voice-modal-title" class="voice-title" data-i18n="voiceListeningTitle">${translations[lang]?.voiceListeningTitle || 'Listening...'}</h2>
        <div id="voice-modal-subtitle" class="voice-subtitle" data-i18n="voiceSpeakNow">${translations[lang]?.voiceSpeakNow || 'Speak now'}</div>
        
        <div id="voice-mic-container" class="voice-mic-wrapper">
          <div class="voice-ripple voice-ripple-1"></div>
          <div class="voice-ripple voice-ripple-2"></div>
          <div class="voice-ripple voice-ripple-3"></div>
          <button type="button" id="btn-voice-mic-circle" class="voice-mic-circle" aria-label="Stop listening">
            <i class="fa-solid fa-microphone"></i>
          </button>
        </div>
        
        <div id="voice-transcript-container" class="voice-transcript-container">
          <div class="voice-transcript-label" data-i18n="voiceYouSaid">${translations[lang]?.voiceYouSaid || 'You said:'}</div>
          <div id="voice-transcript-text" class="voice-transcript-text interim">...</div>
        </div>
        
        <div id="voice-actions" class="voice-actions">
          <span class="voice-tap-hint" data-i18n="voiceTapToStop">${translations[lang]?.voiceTapToStop || 'Tap to stop'}</span>
          <button type="button" id="btn-voice-stop" class="btn btn-danger rounded-pill px-4 py-2 fw-bold" aria-label="Stop listening">
            <i class="fa-solid fa-square me-2"></i> <span data-i18n="voiceStopBtn">${translations[lang]?.voiceStopBtn || 'Stop Listening'}</span>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Setup Event Listeners for Voice Modal Controls
  document.getElementById('btn-voice-close').addEventListener('click', stopVoiceAssistant);
  document.getElementById('btn-voice-stop').addEventListener('click', stopVoiceAssistant);
  document.getElementById('btn-voice-mic-circle').addEventListener('click', stopVoiceAssistant);
  
  // Close on Backdrop Click
  document.getElementById('voice-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'voice-modal-overlay') {
      stopVoiceAssistant();
    }
  });

  // ESC Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('voice-modal-overlay');
      if (overlay && overlay.classList.contains('active')) {
        stopVoiceAssistant();
      }
    }
  });
}

function showListeningUI() {
  ensureVoiceModalExists();
  const overlay = document.getElementById('voice-modal-overlay');
  const card = document.getElementById('voice-modal-card');
  const title = document.getElementById('voice-modal-title');
  const subtitle = document.getElementById('voice-modal-subtitle');
  const transcriptText = document.getElementById('voice-transcript-text');
  const actions = document.getElementById('voice-actions');
  const micContainer = document.getElementById('voice-mic-container');

  const lang = AppState.currentLang;

  card.className = 'voice-modal-card listening';
  micContainer.style.display = 'flex';
  
  title.textContent = translations[lang]?.voiceListeningTitle || (lang === 'ml' ? 'ശ്രദ്ധിക്കുന്നു...' : 'Listening...');
  subtitle.textContent = translations[lang]?.voiceSpeakNow || (lang === 'ml' ? 'ഇപ്പോൾ സംസാരിക്കൂ' : 'Speak now');
  subtitle.className = 'voice-subtitle';
  
  transcriptText.textContent = '...';
  transcriptText.className = 'voice-transcript-text interim';

  actions.innerHTML = `
    <span class="voice-tap-hint" data-i18n="voiceTapToStop">${translations[lang]?.voiceTapToStop || (lang === 'ml' ? 'നിർത്താൻ അമർത്തുക' : 'Tap to stop')}</span>
    <button type="button" id="btn-voice-stop" class="btn btn-danger rounded-pill px-4 py-2 fw-bold" aria-label="Stop listening">
      <i class="fa-solid fa-square me-2"></i> <span data-i18n="voiceStopBtn">${translations[lang]?.voiceStopBtn || (lang === 'ml' ? 'നിർത്തുക' : 'Stop Listening')}</span>
    </button>
  `;
  document.getElementById('btn-voice-stop').addEventListener('click', stopVoiceAssistant);

  overlay.classList.add('active');
}

function hideListeningUI() {
  const overlay = document.getElementById('voice-modal-overlay');
  const card = document.getElementById('voice-modal-card');
  if (overlay) overlay.classList.remove('active');
  if (card) card.className = 'voice-modal-card';
}

function updateTranscript(text, isFinal = false) {
  const transcriptText = document.getElementById('voice-transcript-text');
  if (transcriptText) {
    transcriptText.textContent = text || '...';
    transcriptText.className = `voice-transcript-text ${isFinal ? '' : 'interim'}`;
  }
}

function showProcessingUI() {
  const card = document.getElementById('voice-modal-card');
  const title = document.getElementById('voice-modal-title');
  const subtitle = document.getElementById('voice-modal-subtitle');
  const micContainer = document.getElementById('voice-mic-container');
  const actions = document.getElementById('voice-actions');

  const lang = AppState.currentLang;

  if (card) card.className = 'voice-modal-card';
  if (micContainer) micContainer.style.display = 'none';

  if (title) title.textContent = translations[lang]?.voiceProcessing || (lang === 'ml' ? 'പരിശോധിക്കുന്നു...' : 'Processing...');
  if (subtitle) subtitle.textContent = '';
  
  if (actions) {
    actions.innerHTML = `
      <div class="voice-processing-spinner"></div>
    `;
  }
}

function handleSpeechResult(finalTranscript) {
  console.log('[VOICE] Handling speech result:', finalTranscript);
  showProcessingUI();

  setTimeout(() => {
    hideListeningUI();

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = finalTranscript;
    }

    if (window.handleUserSendGlobal) {
      window.handleUserSendGlobal(finalTranscript);
    } else {
      window.location.href = `chatbot.html?query=${encodeURIComponent(finalTranscript)}`;
    }
  }, 600);
}

function handleSpeechError(errorCode) {
  console.error('[VOICE] Handling speech error:', errorCode);
  ensureVoiceModalExists();
  const overlay = document.getElementById('voice-modal-overlay');
  const card = document.getElementById('voice-modal-card');
  const title = document.getElementById('voice-modal-title');
  const subtitle = document.getElementById('voice-modal-subtitle');
  const micContainer = document.getElementById('voice-mic-container');
  const actions = document.getElementById('voice-actions');

  const lang = AppState.currentLang;

  if (card) card.className = 'voice-modal-card';
  if (micContainer) micContainer.style.display = 'none';

  let titleText = lang === 'ml' ? 'ശ്രദ്ധിക്കാൻ സാധിച്ചില്ല' : 'Voice Assistant Notice';
  let messageText = '';

  switch (errorCode) {
    case 'not-allowed':
    case 'permission-denied':
      messageText = translations[lang]?.voiceMicDenied || (lang === 'ml' ? 'വോയ്‌സ് സഹായത്തിന് മൈക്രോഫോൺ അനുമതി ആവശ്യമാണ്.' : 'Microphone permission is required for voice assistance.');
      break;
    case 'no-speech':
      messageText = translations[lang]?.voiceNoSpeech || (lang === 'ml' ? 'ഒന്നും കേട്ടില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.' : 'I didn\'t hear anything. Please try again.');
      break;
    case 'audio-capture':
      messageText = translations[lang]?.voiceAudioError || (lang === 'ml' ? 'മൈക്രോഫോൺ കണ്ടെത്താനായില്ല. ദയവായി ക്രമീകരണങ്ങൾ പരിശോധിക്കുക.' : 'I couldn\'t access your microphone. Please check your microphone settings.');
      break;
    case 'not-supported':
      messageText = translations[lang]?.voiceNotSupported || (lang === 'ml' ? 'ഈ ബ്രൗസറിൽ സ്പീച്ച് വോയ്സ് പിന്തുണ ലഭ്യമല്ല.' : 'Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      break;
    default:
      messageText = translations[lang]?.voiceNoSpeech || (lang === 'ml' ? 'ഒരു തകരാർ സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.' : 'An error occurred. Please try again.');
      break;
  }

  if (title) title.textContent = titleText;
  if (subtitle) {
    subtitle.textContent = messageText;
    subtitle.className = 'voice-subtitle text-danger mt-2';
  }

  if (actions) {
    actions.innerHTML = `
      <button type="button" id="btn-voice-try-again" class="btn btn-km-primary px-4 py-2 mt-2">
        <i class="fa-solid fa-rotate-right me-2"></i> ${translations[lang]?.voiceTryAgain || (lang === 'ml' ? 'വീണ്ടും ശ്രമിക്കുക' : 'Try Again')}
      </button>
    `;
    document.getElementById('btn-voice-try-again').addEventListener('click', () => {
      startVoiceAssistant();
    });
  }

  if (overlay) overlay.classList.add('active');
}

function startVoiceAssistant() {
  console.log('[VOICE] Voice Assistant triggered');
  showListeningUI();

  VoiceEngine.startListening(AppState.currentLang, {
    onInterim: (text) => updateTranscript(text, false),
    onFinal: (text) => updateTranscript(text, true),
    onComplete: (text) => handleSpeechResult(text),
    onError: (errorCode) => handleSpeechError(errorCode)
  });
}

function stopVoiceAssistant() {
  console.log('[VOICE] Stop Voice Assistant requested');
  VoiceEngine.stopListening();
  hideListeningUI();

  // If there's partial transcript captured, put it in chat input
  if (VoiceEngine.currentTranscript && VoiceEngine.currentTranscript.trim()) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = VoiceEngine.currentTranscript.trim();
    }
  }
}

function speakAIResponse(text, bubbleElement = null) {
  if (!text) return;
  const lang = AppState.currentLang;
  
  let listenBtn = null;
  if (bubbleElement) {
    listenBtn = bubbleElement.querySelector('.btn-listen');
  }

  VoiceEngine.speak(text, lang, {
    btnElement: listenBtn,
    onStart: () => {
      if (listenBtn) {
        listenBtn.classList.add('speaking');
        const textSpan = listenBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = (translations[lang]?.speakingState) || (lang === 'ml' ? 'സംസാരിക്കുന്നു... (നിർത്തുക)' : 'Speaking... (Stop)');
        }
        const icon = listenBtn.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-volume-high fa-beat-fade text-success';
        }
      }
    },
    onEnd: () => {
      if (listenBtn) {
        listenBtn.classList.remove('speaking');
        const textSpan = listenBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = (translations[lang]?.listenBtn) || (lang === 'ml' ? 'ശ്രദ്ധിക്കൂ' : 'Listen');
        }
        const icon = listenBtn.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-volume-high';
        }
      }
    },
    onError: () => {
      if (listenBtn) {
        listenBtn.classList.remove('speaking');
        const textSpan = listenBtn.querySelector('span');
        if (textSpan) {
          textSpan.textContent = (translations[lang]?.listenBtn) || (lang === 'ml' ? 'ശ്രദ്ധിക്കൂ' : 'Listen');
        }
        const icon = listenBtn.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-volume-high';
        }
      }
    }
  });
}

// Global click handler for message speech buttons
window.handleBubbleListenClick = function(btn) {
  if (VoiceEngine.isSpeaking && VoiceEngine.currentSpeakingBtn === btn) {
    VoiceEngine.stopSpeaking();
    return;
  }
  const encodedAudio = btn.getAttribute('data-audio');
  const bubble = btn.closest('.chat-bubble');
  let text = '';
  if (encodedAudio) {
    text = decodeURIComponent(encodedAudio);
  } else if (bubble) {
    const contentEl = bubble.querySelector('.chat-content') || bubble;
    text = contentEl.innerText;
  }
  if (text) {
    speakAIResponse(text, bubble);
  }
};

// 2. AI Chatbot Controller
function initChatbot() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-chat-send');
  const micBtn = document.getElementById('btn-chat-mic');
  const clearBtn = document.getElementById('btn-clear-chat');
  const autoVoiceBtn = document.getElementById('btn-auto-speak-toggle');
  const autoVoiceLabel = document.getElementById('auto-speak-label');
  const uploadBtn = document.getElementById('btn-chat-upload');
  const fileInput = document.getElementById('chat-file-input');
  const imgPreviewBar = document.getElementById('chat-image-preview-bar');
  const imgThumb = document.getElementById('chat-img-thumb');
  const removeImgBtn = document.getElementById('btn-remove-img');

  let hasAttachedImage = false;

  // Local conversation history store
  let chatHistory = [];

  // Active Crop Doctor diagnosis context (persists for session if user came from Crop Doctor)
  let activeDiagnosis = null;
  try {
    const storedDiag = localStorage.getItem('krishimitra_active_diagnosis');
    if (storedDiag) {
      activeDiagnosis = JSON.parse(storedDiag);
    }
  } catch (e) {}

  const urlParams = new URLSearchParams(window.location.search);
  const paramCrop = urlParams.get('crop');
  const paramDisease = urlParams.get('disease');
  if (paramCrop || paramDisease) {
    if (!activeDiagnosis) activeDiagnosis = {};
    if (paramCrop) {
      activeDiagnosis.crop = paramCrop;
      activeDiagnosis.cropEn = paramCrop;
    }
    if (paramDisease) {
      activeDiagnosis.disease = paramDisease;
      activeDiagnosis.diseaseEn = paramDisease;
    }
    localStorage.setItem('krishimitra_active_diagnosis', JSON.stringify(activeDiagnosis));
  }

  function renderActiveDiagnosisBanner() {
    const existing = document.getElementById('chat-active-diagnosis-banner');
    if (existing) existing.remove();

    if (activeDiagnosis && (activeDiagnosis.crop || activeDiagnosis.disease)) {
      const isMl = (typeof AppState !== 'undefined' && AppState.currentLang === 'ml');
      const cropText = isMl ? (activeDiagnosis.cropMl || activeDiagnosis.crop) : (activeDiagnosis.cropEn || activeDiagnosis.crop);
      const diseaseText = isMl ? (activeDiagnosis.diseaseMl || activeDiagnosis.disease) : (activeDiagnosis.diseaseEn || activeDiagnosis.disease);

      const banner = document.createElement('div');
      banner.id = 'chat-active-diagnosis-banner';
      banner.className = 'p-2 px-3 bg-success bg-opacity-10 border-bottom border-success d-flex align-items-center justify-content-between small text-dark';
      banner.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="fa-solid fa-stethoscope text-success fs-6"></i>
          <span><strong>${isMl ? 'ക്രോപ്പ് ഡോക്ടർ നിർണ്ണയം:' : 'Crop Doctor Diagnosis Context:'}</strong> <span class="badge bg-success text-white">${cropText}</span> <span class="text-secondary">—</span> <span>${diseaseText}</span></span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;" title="${isMl ? 'മാറ്റുക' : 'Reset Context'}">
          ${isMl ? 'മാറ്റുക' : 'Reset'}
        </button>
      `;
      const btnReset = banner.querySelector('button');
      if (btnReset) {
        btnReset.onclick = () => {
          activeDiagnosis = null;
          localStorage.removeItem('krishimitra_active_diagnosis');
          banner.remove();
          showToast(isMl ? 'ഡോക്ടർ കോൺടെക്സ്റ്റ് മാറ്റി' : 'Crop Doctor context cleared', 'info');
        };
      }
      if (chatMessages && chatMessages.parentNode) {
        chatMessages.parentNode.insertBefore(banner, chatMessages);
      }
    }
  }

  renderActiveDiagnosisBanner();

  // Expose handleUserSend globally for voice assistant callback
  window.handleUserSendGlobal = handleUserSend;

  // Setup Auto-Voice UI & Toggle Listener
  function updateAutoVoiceUI() {
    if (!autoVoiceBtn) return;
    const isAuto = AppState.autoSpeak !== false;
    const lang = AppState.currentLang;
    if (isAuto) {
      autoVoiceBtn.classList.add('btn-light', 'text-success');
      autoVoiceBtn.classList.remove('btn-outline-light');
      if (autoVoiceLabel) autoVoiceLabel.textContent = (translations[lang]?.autoVoiceOn) || (lang === 'ml' ? 'ശബ്ദം: ഓൺ' : 'Auto-Voice: ON');
      autoVoiceBtn.setAttribute('title', lang === 'ml' ? 'ഓട്ടോ-വോയ്‌സ് ഓൺ (ഓഫ് ചെയ്യാൻ അമർത്തുക)' : 'Auto-Voice is ON (Click to mute)');
    } else {
      autoVoiceBtn.classList.remove('btn-light', 'text-success');
      autoVoiceBtn.classList.add('btn-outline-light');
      if (autoVoiceLabel) autoVoiceLabel.textContent = (translations[lang]?.autoVoiceOff) || (lang === 'ml' ? 'ശബ്ദം: ഓഫ്' : 'Auto-Voice: OFF');
      autoVoiceBtn.setAttribute('title', lang === 'ml' ? 'ഓട്ടോ-വോയ്‌സ് ഓഫ് (ഓൺ ചെയ്യാൻ അമർത്തുക)' : 'Auto-Voice is OFF (Click to unmute)');
    }
  }

  if (autoVoiceBtn) {
    updateAutoVoiceUI();
    autoVoiceBtn.addEventListener('click', () => {
      AppState.autoSpeak = !AppState.autoSpeak;
      localStorage.setItem('krishimitra_auto_speak', AppState.autoSpeak);
      if (!AppState.autoSpeak) {
        VoiceEngine.stopSpeaking();
      }
      updateAutoVoiceUI();
      showToast(
        AppState.autoSpeak 
          ? (AppState.currentLang === 'ml' ? 'ഓട്ടോ-വോയ്‌സ് ഓൺ ചെയ്തു' : 'Auto-Voice Enabled')
          : (AppState.currentLang === 'ml' ? 'ഓട്ടോ-വോയ്‌സ് ഓഫ് ചെയ്തു' : 'Auto-Voice Disabled'),
        'info'
      );
    });

    document.addEventListener('languageChanged', () => {
      updateAutoVoiceUI();
    });
  }

  // Clear chat button listener
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      VoiceEngine.stopSpeaking();
      chatHistory = [];
      activeDiagnosis = null;
      localStorage.removeItem('krishimitra_active_diagnosis');
      renderActiveDiagnosisBanner();
      if (chatMessages) {
        chatMessages.innerHTML = `
          <div class="chat-bubble bot">
            <div class="chat-content">
              👋 <strong>Namaskaram! I am KrishiMitra AI.</strong><br>
              I am your personal agricultural assistant for Kerala. Ask me any query in English or Malayalam, or upload a photo of your crop!
            </div>
            <button class="btn-listen mt-1" data-audio="Namaskaram! I am KrishiMitra AI. How can I assist your farm today?" onclick="handleBubbleListenClick(this)">
              <i class="fa-solid fa-volume-high"></i> <span>${AppState.currentLang === 'ml' ? 'ശ്രദ്ധിക്കൂ' : 'Listen'}</span>
            </button>
          </div>
        `;
      }
      showToast(AppState.currentLang === 'ml' ? 'സല്ലാപം മായ്ച്ചു' : 'Conversation cleared', 'info');
    });
  }

  // Image upload handling
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          if (imgThumb) imgThumb.src = re.target.result;
          if (imgPreviewBar) imgPreviewBar.classList.remove('d-none');
          hasAttachedImage = true;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removeImgBtn) {
    removeImgBtn.addEventListener('click', () => {
      if (fileInput) fileInput.value = '';
      if (imgPreviewBar) imgPreviewBar.classList.add('d-none');
      hasAttachedImage = false;
    });
  }

  function formatChatMessage(text) {
    if (!text) return '';
    
    // Convert markdown bold **text** to <strong>text</strong>
    let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const lines = processed.split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!trimmed) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        continue;
      }

      // Unordered list item (•, -, *)
      if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul class="chat-list ps-3 mb-2">'; inUl = true; }
        const itemText = trimmed.replace(/^(•|-|\*)\s*/, '');
        html += `<li>${itemText}</li>`;
      }
      // Ordered list item (1. Item)
      else if (/^\d+[\.\)]\s+/.test(trimmed)) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol class="chat-list ps-3 mb-2">'; inOl = true; }
        const itemText = trimmed.replace(/^\d+[\.\)]\s*/, '');
        html += `<li>${itemText}</li>`;
      }
      // Normal paragraph
      else {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        html += `<p class="mb-2">${trimmed}</p>`;
      }
    }

    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';

    return html || `<div>${text}</div>`;
  }

  function appendMessage(text, sender = 'bot', audioText = '') {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    let html = `<div class="chat-content">${formatChatMessage(text)}</div>`;
    
    const speakContent = audioText || text;
    if (sender === 'bot' && speakContent) {
      const escapedSpeak = encodeURIComponent(speakContent);
      html += `
        <button class="btn-listen mt-1" data-audio="${escapedSpeak}" onclick="handleBubbleListenClick(this)">
          <i class="fa-solid fa-volume-high"></i> <span>${AppState.currentLang === 'ml' ? 'ശ്രദ്ധിക്കൂ' : 'Listen'}</span>
        </button>
      `;
    }
    bubble.innerHTML = html;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  async function handleUserSend(text) {
    const query = text || (chatInput ? chatInput.value.trim() : '');
    if (!query && !hasAttachedImage) return;

    // Stop ongoing speech when user sends a new message
    VoiceEngine.stopSpeaking();

    if (chatInput) chatInput.value = '';
    
    // If image attached, indicate in user bubble
    let displayUserText = query;
    if (hasAttachedImage) {
      displayUserText = `📷 [Image Attached] ${query || 'Analyzing crop disease...'}`;
      if (imgPreviewBar) imgPreviewBar.classList.add('d-none');
      if (fileInput) fileInput.value = '';
      hasAttachedImage = false;
    }

    appendMessage(displayUserText, 'user');

    console.log('[CHAT] User message:', query);
    console.log('[CHAT] Sending request:', { message: query, language: AppState.currentLang, historyCount: chatHistory.length });

    // Show typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble bot text-muted fst-italic';
    typingBubble.id = 'typing-indicator';
    typingBubble.textContent = AppState.currentLang === 'ml' ? 'കൃഷിമിത്ര ചിന്തിക്കുന്നു...' : 'KrishiMitra is thinking...';
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send query along with conversation history and active Crop Doctor context
    const response = await ApiServices.Chat.sendMessage(query || 'Please examine the attached plant image', AppState.currentLang, chatHistory, hasAttachedImage, activeDiagnosis);
    
    // Remove typing indicator
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();

    console.log('[CHAT] Response received:', response.text);

    // Save exact user query and AI response in conversation history
    chatHistory.push({ role: 'user', content: query || 'Crop analysis query' });
    chatHistory.push({ role: 'assistant', content: response.text });

    const botBubble = appendMessage(response.text, 'bot', response.audioText);

    // AUTO-SPEAK: Speak response automatically once user asks anything
    if (AppState.autoSpeak !== false) {
      const textToSpeak = response.audioText || response.text;
      speakAIResponse(textToSpeak, botBubble);
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => handleUserSend());
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleUserSend();
    });
  }

  // Handle Quick Question Chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleUserSend(btn.getAttribute('data-question') || btn.textContent);
    });
  });

  // Handle Microphone Input
  if (micBtn) {
    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startVoiceAssistant();
    });
  }

  // Check URL query parameter (if redirected from voice on another page)
  const initialQuery = urlParams.get('query');
  if (initialQuery) {
    handleUserSend(initialQuery);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}


// 3. AI Crop Doctor Controller
function initCropDoctor() {
  const dropzone = document.getElementById('doctor-dropzone');
  const fileInput = document.getElementById('doctor-file-input');
  const cameraInput = document.getElementById('doctor-camera-input');
  const btnChooseFile = document.getElementById('btn-choose-file');
  const btnCameraCapture = document.getElementById('btn-camera-capture');
  const loadingBox = document.getElementById('doctor-loading-box');
  const resultCard = document.getElementById('doctor-result-card');
  const sampleBtns = document.querySelectorAll('.sample-crop-btn');
  const btnListenDiagnosis = document.getElementById('btn-listen-diagnosis');
  let currentDiagnosisAudio = '';

  function safeList(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.includes('\n') ? val.split('\n').map(s => s.trim()).filter(Boolean) : [val];
    }
    return [String(val)];
  }

  function safeText(val) {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(' ');
    return String(val);
  }

  function renderDiagnosisResult(result) {
    console.log('[CropDoctor] Rendering diagnosis result:', result);
    if (loadingBox) loadingBox.classList.add('d-none');
    if (resultCard) resultCard.classList.remove('d-none');

    if (!result) return;

    try {
      const isMl = (typeof AppState !== 'undefined' && AppState.currentLang === 'ml');

      // Handle non-plant image rejection — distinct warning UI
      if (result.isNotPlant) {
        const cropElem = document.getElementById('diag-crop-name');
        if (cropElem) cropElem.textContent = isMl ? '⚠️ ഇത് ഒരു ചെടിയോ പഴമോ പച്ചക്കറിയോ അല്ല' : '⚠️ Not a Plant / Crop Image';

        const diseaseElem = document.getElementById('diag-disease-name');
        if (diseaseElem) diseaseElem.textContent = isMl ? 'ദയവായി ഒരു ചെടിയിലെ ഇലയുടെയോ പഴത്തിന്റെയോ പച്ചക്കറിയുടെയോ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക' : 'Please upload a photo of a plant leaf, fruit, or vegetable for diagnosis';

        const confElem = document.getElementById('diag-confidence');
        if (confElem) confElem.textContent = 'N/A';

        const severityBadge = document.getElementById('diag-severity-badge');
        if (severityBadge) {
          severityBadge.textContent = isMl ? 'ചെടി അല്ല' : 'Not a Plant';
          severityBadge.className = 'badge bg-danger text-white px-3 py-1 fs-6';
        }

        // Show rejection tips in symptoms list
        const symptomsList = document.getElementById('diag-symptoms-list');
        if (symptomsList) {
          symptomsList.innerHTML = '';
          const tips = isMl ? (result.symptomsMl || result.symptoms || []) : (result.symptomsEn || result.symptoms || []);
          (Array.isArray(tips) ? tips : [tips]).forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            symptomsList.appendChild(li);
          });
        }

        // Clear treatment sections for non-plant
        const organicList = document.getElementById('diag-organic-list');
        if (organicList) organicList.innerHTML = '<li class="text-muted">' + (isMl ? 'ബാധകമല്ല — ഇത് ചെടിയുടെ ഇലയല്ല' : 'Not applicable — this is not a plant leaf image') + '</li>';
        const chemicalList = document.getElementById('diag-chemical-list');
        if (chemicalList) chemicalList.innerHTML = '<li class="text-muted">' + (isMl ? 'ബാധകമല്ല' : 'Not applicable') + '</li>';
        const prevElem = document.getElementById('diag-prevention-text');
        if (prevElem) prevElem.textContent = isMl ? 'തക്കാളി, നെല്ല്, ഉരുളക്കിഴങ്ങ്, ആപ്പിൾ, മുന്തിരി, ചോളം, കുരുമുളക്, വാഴ, തെങ്ങ്, മുളക് എന്നീ വിളകളുടെ ഇലകളും പഴങ്ങളും പച്ചക്കറികളും പിന്തുണയ്ക്കുന്നു.' : 'Supported crops: Tomato, Rice/Paddy, Potato, Apple, Grape, Corn, Bell Pepper, Banana, Coconut, Chilli. Upload a clear close-up of an affected leaf, fruit, or vegetable.';

        const imgElem = document.getElementById('diag-img');
        if (imgElem && result.image) imgElem.src = result.image;

        currentDiagnosisAudio = isMl ? (result.audioSummaryMl || '') : (result.audioSummaryEn || '');
        if (typeof AppState !== 'undefined' && AppState.autoSpeak && currentDiagnosisAudio && typeof VoiceEngine !== 'undefined') {
          try { VoiceEngine.speakText(currentDiagnosisAudio, isMl ? 'ml-IN' : 'en-IN'); } catch (vErr) {}
        }

        // Hide the "Ask AI" button for non-plant results
        const askAiBtn = document.getElementById('btn-ask-ai-diagnosis') || document.querySelector('#doctor-result-card a[href*="chatbot.html"]');
        if (askAiBtn) askAiBtn.style.display = 'none';

        if (resultCard) resultCard.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Ensure Ask AI button is visible for valid results
      const askAiBtnCheck = document.getElementById('btn-ask-ai-diagnosis') || document.querySelector('#doctor-result-card a[href*="chatbot.html"]');
      if (askAiBtnCheck) askAiBtnCheck.style.display = '';

      // Crop Name & Disease
      const cropElem = document.getElementById('diag-crop-name');
      if (cropElem) cropElem.textContent = isMl ? (result.cropMl || result.crop) : (result.cropEn || result.crop || 'Crop');

      const diseaseElem = document.getElementById('diag-disease-name');
      if (diseaseElem) diseaseElem.textContent = isMl ? (result.diseaseMl || result.possibleDisease || result.disease) : (result.diseaseEn || result.possibleDisease || result.disease || 'Disease');

      const confElem = document.getElementById('diag-confidence');
      if (confElem) confElem.textContent = result.confidence || '94%';

      const severityBadge = document.getElementById('diag-severity-badge');
      if (severityBadge) {
        if (result.isUncertain) {
          severityBadge.textContent = isMl ? 'തീവ്രത: വ്യക്തമല്ല' : 'Severity: Uncertain';
          severityBadge.className = 'badge bg-secondary text-white px-3 py-1 fs-6';
        } else {
          const sev = result.severity || 'Moderate';
          severityBadge.textContent = isMl ? `തീവ്രത: ${sev}` : `Severity: ${sev}`;
          if (sev === 'Critical') {
            severityBadge.className = 'badge bg-danger text-white px-3 py-1 fs-6';
          } else if (sev === 'Healthy') {
            severityBadge.className = 'badge bg-success text-white px-3 py-1 fs-6';
          } else {
            severityBadge.className = 'badge bg-warning text-dark px-3 py-1 fs-6';
          }
        }
      }

      // Image preview
      const imgElem = document.getElementById('diag-img');
      if (imgElem && result.image) {
        imgElem.src = result.image;
      }

      // Observed Symptoms
      const symptomsList = document.getElementById('diag-symptoms-list');
      if (symptomsList) {
        symptomsList.innerHTML = '';
        const rawSym = isMl ? (result.symptomsMl || result.symptoms) : (result.symptomsEn || result.symptoms);
        const symptoms = safeList(rawSym);
        symptoms.forEach(sym => {
          const li = document.createElement('li');
          li.textContent = sym;
          symptomsList.appendChild(li);
        });
      }

      // Organic Remedies
      const organicList = document.getElementById('diag-organic-list');
      if (organicList) {
        organicList.innerHTML = '';
        const rawOrg = isMl ? (result.organicTreatmentMl || result.organicTreatment || result.recommendedAction || result.remediesMl) : (result.organicTreatmentEn || result.organicTreatment || result.recommendedAction || result.remediesEn);
        const organic = safeList(rawOrg);
        organic.forEach(rem => {
          const li = document.createElement('li');
          li.textContent = rem;
          organicList.appendChild(li);
        });
      }

      // Chemical Remedies
      const chemicalList = document.getElementById('diag-chemical-list');
      if (chemicalList) {
        chemicalList.innerHTML = '';
        const rawChem = isMl ? (result.chemicalTreatmentMl || result.chemicalTreatment) : (result.chemicalTreatmentEn || result.chemicalTreatment);
        const chemical = safeList(rawChem);
        chemical.forEach(chem => {
          const li = document.createElement('li');
          li.textContent = chem;
          chemicalList.appendChild(li);
        });
      }

      // Prevention
      const prevElem = document.getElementById('diag-prevention-text');
      if (prevElem) {
        const rawPrev = isMl ? (result.preventionMl || result.prevention || '') : (result.preventionEn || result.prevention || '');
        prevElem.textContent = safeText(rawPrev);
      }

      // Setup audio summary
      currentDiagnosisAudio = isMl ? (result.audioSummaryMl || result.audioSummary || '') : (result.audioSummaryEn || result.audioSummary || '');
      if (!currentDiagnosisAudio) {
        const cropText = isMl ? (result.cropMl || '') : (result.cropEn || '');
        const diseaseText = isMl ? (result.diseaseMl || '') : (result.diseaseEn || '');
        currentDiagnosisAudio = isMl ?
          `${cropText} വിളയിൽ ${diseaseText} കണ്ടെത്തി.` :
          `${diseaseText} detected in ${cropText}.`;
      }

      // Automatically speak diagnosis if auto-speak is enabled
      if (typeof AppState !== 'undefined' && AppState.autoSpeak && currentDiagnosisAudio && typeof VoiceEngine !== 'undefined') {
        try {
          VoiceEngine.speakText(currentDiagnosisAudio, isMl ? 'ml-IN' : 'en-IN');
          if (btnListenDiagnosis) btnListenDiagnosis.classList.add('speaking');
        } catch (vErr) {}
      }

      // Update Ask AI button link with dynamically diagnosed crop and disease
      const askAiBtn = document.getElementById('btn-ask-ai-diagnosis') || document.querySelector('#doctor-result-card a[href*="chatbot.html"]');
      const cropEn = result.cropEn || result.crop || 'Crop';
      const cropMl = result.cropMl || result.crop || 'വിള';
      const crop = isMl ? cropMl : cropEn;
      const diseaseEn = result.diseaseEn || result.disease || result.possibleDisease || 'Condition';
      const diseaseMl = result.diseaseMl || result.disease || result.possibleDisease || 'രോഗം';
      const disease = isMl ? diseaseMl : diseaseEn;

      const diagnosisContext = {
        crop: cropEn,
        cropEn: cropEn,
        cropMl: cropMl,
        disease: diseaseEn,
        diseaseEn: diseaseEn,
        diseaseMl: diseaseMl,
        confidence: result.confidence || '94%',
        severity: result.severity || 'Moderate',
        symptoms: isMl ? (result.symptomsMl || result.symptoms) : (result.symptomsEn || result.symptoms),
        organicTreatment: isMl ? (result.organicTreatmentMl || result.organicTreatment) : (result.organicTreatmentEn || result.organicTreatment),
        chemicalTreatment: isMl ? (result.chemicalTreatmentMl || result.chemicalTreatment) : (result.chemicalTreatmentEn || result.chemicalTreatment),
        prevention: isMl ? (result.preventionMl || result.prevention) : (result.preventionEn || result.prevention),
        timestamp: Date.now()
      };
      localStorage.setItem('krishimitra_active_diagnosis', JSON.stringify(diagnosisContext));

      if (askAiBtn) {
        const dynamicQuery = isMl 
          ? `ഞാൻ എന്റെ ${crop} വിളയുടെ ഫോട്ടോ പരിശോധിച്ചപ്പോൾ ${disease} രോഗലക്ഷണങ്ങൾ കണ്ടു. കൃഷിഭവൻ നിർദ്ദേശിക്കുന്ന പരിഹാരങ്ങൾ എന്തൊക്കെയാണ്?`
          : `I scanned my ${crop} crop and detected ${disease}. What are the recommended KAU treatments and precautions?`;
        askAiBtn.href = `chatbot.html?crop=${encodeURIComponent(cropEn)}&disease=${encodeURIComponent(diseaseEn)}&query=${encodeURIComponent(dynamicQuery)}`;
        askAiBtn.onclick = () => {
          localStorage.setItem('krishimitra_active_diagnosis', JSON.stringify(diagnosisContext));
        };
      }

      if (resultCard) {
        resultCard.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (renderErr) {
      console.error('[CropDoctor] Render error:', renderErr);
    }
  }

  async function processAnalysis(fileOrPresetKey, previewDataUrl = null) {
    if (loadingBox) loadingBox.classList.remove('d-none');
    if (resultCard) resultCard.classList.add('d-none');
    const isMl = (typeof AppState !== 'undefined' && AppState.currentLang === 'ml');
    showToast(isMl ? 'ചിത്രം പരിശോധിക്കുന്നു...' : 'Analyzing plant image...', 'info');

    try {
      const result = await ApiServices.Disease.analyzePlantImage(fileOrPresetKey, isMl ? 'ml' : 'en', previewDataUrl);
      renderDiagnosisResult(result);
    } catch (err) {
      console.error('[CropDoctor] Analysis error:', err);
      if (loadingBox) loadingBox.classList.add('d-none');
      showToast(isMl ? 'ചിത്രം പരിശോധിക്കാൻ കഴിഞ്ഞില്ല.' : 'Failed to analyze plant image.', 'danger');
    }
  }

  function handleFileSelected(file) {
    if (!file) return;
    console.log('[CropDoctor] Processing selected file:', file.name, file.size, file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewDataUrl = e.target.result;
      processAnalysis(file, previewDataUrl);
    };
    reader.readAsDataURL(file);
  }

  if (btnChooseFile && fileInput) {
    btnChooseFile.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (btnCameraCapture && cameraInput) {
    btnCameraCapture.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cameraInput.click();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (
        e.target !== btnChooseFile && 
        e.target !== btnCameraCapture && 
        !e.target.closest('#btn-choose-file') && 
        !e.target.closest('#btn-camera-capture') &&
        !e.target.closest('.sample-crop-btn')
      ) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
      }
    });

    if (cameraInput) {
      cameraInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileSelected(e.target.files[0]);
        }
      });
    }

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  sampleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const preset = btn.getAttribute('data-preset') || 'tomato';
      let sampleImg = 'assets/images/disease_tomato_blight.png';
      if (preset === 'rice') sampleImg = 'assets/images/disease_rice_blast.png';
      processAnalysis(preset, sampleImg);
    });
  });

  if (btnListenDiagnosis) {
    btnListenDiagnosis.addEventListener('click', () => {
      if (VoiceEngine.isSpeaking()) {
        VoiceEngine.stopSpeaking();
        btnListenDiagnosis.classList.remove('speaking');
      } else if (currentDiagnosisAudio) {
        btnListenDiagnosis.classList.add('speaking');
        VoiceEngine.speakText(
          currentDiagnosisAudio,
          AppState.currentLang === 'ml' ? 'ml-IN' : 'en-IN',
          () => btnListenDiagnosis.classList.remove('speaking'),
          () => btnListenDiagnosis.classList.remove('speaking')
        );
      }
    });
  }

  const rescanBtn = document.getElementById('btn-scan-another');
  if (rescanBtn) {
    rescanBtn.addEventListener('click', () => {
      VoiceEngine.stopSpeaking();
      if (resultCard) resultCard.classList.add('d-none');
      if (fileInput) fileInput.value = '';
      if (cameraInput) cameraInput.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// 4. Crop Recommendation Controller
function initCropRecommendation() {
  const form = document.getElementById('crop-rec-form');
  const submitBtn = document.getElementById('btn-submit-rec');
  const resultsContainer = document.getElementById('rec-results-container');
  const loadingBox = document.getElementById('rec-loading-box');
  const recList = document.getElementById('rec-crop-list');

  async function calculateAndDisplay(showLoading = true) {
    const isMl = (typeof AppState !== 'undefined' && AppState.currentLang === 'ml');

    if (showLoading) {
      showToast(isMl ? 'അനുയോജ്യമായ വിളകൾ കണ്ടെത്തുന്നു...' : 'Calculating optimal crop suitability...', 'info');
      if (loadingBox) {
        loadingBox.classList.remove('d-none');
        loadingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const landInput = document.getElementById('rec-land');
    const landValue = landInput && landInput.value ? landInput.value : '2.5';

    const params = {
      district: document.getElementById('rec-district') ? document.getElementById('rec-district').value : 'Thrissur',
      soil: document.getElementById('rec-soil') ? document.getElementById('rec-soil').value : 'Laterite Soil',
      season: document.getElementById('rec-season') ? document.getElementById('rec-season').value : 'Virippu (Kharif)',
      land: landValue,
      water: document.getElementById('rec-water') ? document.getElementById('rec-water').value : 'High',
      prevCrop: document.getElementById('rec-prev-crop') ? document.getElementById('rec-prev-crop').value : 'Paddy'
    };

    try {
      const recommendations = await ApiServices.Recommendation.calculateRecommendations(params);

      if (loadingBox) loadingBox.classList.add('d-none');

      if (!recList) return;
      recList.innerHTML = '';

      if (!recommendations || recommendations.length === 0) {
        recList.innerHTML = `<div class="col-12 text-center text-muted py-4"><h5>${isMl ? 'വിളകൾ ലഭ്യമല്ല' : 'No recommendations found for selected parameters.'}</h5></div>`;
      } else {
        const recThemes = [
          { border: 'border-success', badge: 'bg-success', tipBg: 'bg-success-subtle text-success border-success' },
          { border: 'border-primary', badge: 'bg-primary', tipBg: 'bg-primary-subtle text-primary border-primary' },
          { border: 'border-warning', badge: 'bg-warning text-dark', tipBg: 'bg-warning-subtle text-dark border-warning' },
          { border: 'border-info', badge: 'bg-info text-dark', tipBg: 'bg-info-subtle text-dark border-info' }
        ];

        recommendations.forEach((crop, idx) => {
          const theme = recThemes[idx % recThemes.length];
          const name = isMl ? (crop.nameMl || crop.nameEn) : (crop.nameEn || crop.nameMl);
          const period = isMl ? (crop.periodMl || crop.periodEn) : (crop.periodEn || crop.periodMl);
          const water = isMl ? (crop.waterMl || crop.waterEn) : (crop.waterEn || crop.waterMl);
          const benefits = isMl ? (crop.benefitsMl || crop.benefitsEn) : (crop.benefitsEn || crop.benefitsMl);
          const tips = isMl ? (crop.tipsMl || crop.tipsEn) : (crop.tipsEn || crop.tipsMl);
          const income = crop.estIncome || '₹60,000 - ₹1,00,000 / Acre';
          const totalIncome = isMl ? (crop.estTotalIncomeMl || crop.estTotalIncome) : (crop.estTotalIncome || crop.estTotalIncomeMl);

          const cardHtml = `
            <div class="col-md-6 mb-4">
              <div class="km-card shadow-sm h-100 border-top border-4 ${theme.border}">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h3 class="mb-1 fs-5 fw-bold text-primary-dark">${crop.icon || '🌾'} ${name}</h3>
                    <div class="d-flex flex-wrap gap-1 align-items-center mt-1">
                      <span class="badge bg-success-subtle text-success border border-success-subtle">
                        <i class="fa-solid fa-coins me-1"></i>${income}
                      </span>
                      ${totalIncome ? `
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                        <i class="fa-solid fa-chart-line me-1"></i>${totalIncome}
                      </span>` : ''}
                    </div>
                  </div>
                  <span class="badge ${theme.badge} fs-6 px-3 py-2 rounded-pill shadow-sm">
                    <i class="fa-solid fa-star me-1"></i>${isMl ? 'യോജ്യത' : 'Suitability'}: ${crop.suitability}%
                  </span>
                </div>

                <div class="row g-2 mb-3 small text-muted bg-light p-2 rounded">
                  <div class="col-6"><strong><i class="fa-regular fa-clock text-primary-green me-1"></i>${isMl ? 'കാലയളവ്' : 'Period'}:</strong> ${period}</div>
                  <div class="col-6"><strong><i class="fa-solid fa-droplet text-info me-1"></i>${isMl ? 'വെള്ളം' : 'Water'}:</strong> ${water}</div>
                </div>

                <p class="mb-3 text-dark"><strong>${isMl ? 'പ്രധാന മേന്മകൾ' : 'Key Agronomic Reasons'}:</strong> ${benefits}</p>

                <div class="p-3 ${theme.tipBg} bg-opacity-25 rounded border border-opacity-25 small mt-auto">
                  <strong class="d-block mb-1"><i class="fa-solid fa-lightbulb text-warning me-1"></i> ${isMl ? 'കൃഷി ടിപ്പുകൾ (KAU)' : 'KAU Farming Practices'}:</strong>
                  ${tips}
                </div>
              </div>
            </div>
          `;
          recList.insertAdjacentHTML('beforeend', cardHtml);
        });
      }

      if (resultsContainer) {
        resultsContainer.classList.remove('d-none');
        if (showLoading) {
          setTimeout(() => {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    } catch (err) {
      console.error('[Crop Recommendation] Execution error:', err);
      if (loadingBox) loadingBox.classList.add('d-none');
      showToast(isMl ? 'നിർദ്ദേശങ്ങൾ തയ്യാറാക്കുന്നതിൽ തടസ്സം നേരിട്ടു.' : 'Error generating crop recommendations.', 'danger');
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateAndDisplay(true);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calculateAndDisplay(true);
    });
  }

  // Automatically render recommendations on initial page load
  calculateAndDisplay(false);
}

// 5. Weather Controller (Real-Time WeatherAPI.com Integration)
function initWeather() {
  const districtSelect = document.getElementById('weather-district-select');

  async function loadWeather(district) {
    const data = await ApiServices.Weather.getWeather(district);
    const isMl = (AppState.currentLang === 'ml');

    const tempEl = document.getElementById('weather-temp');
    const condEl = document.getElementById('weather-condition');
    const iconBadge = document.getElementById('weather-icon-badge');
    const feelsEl = document.getElementById('weather-feels-like');
    const humidityEl = document.getElementById('weather-humidity');
    const rainEl = document.getElementById('weather-rain-prob');
    const windEl = document.getElementById('weather-wind');
    const uvEl = document.getElementById('weather-uv');
    const pressureEl = document.getElementById('weather-pressure');
    const sunriseEl = document.getElementById('weather-sunrise');
    const sunsetEl = document.getElementById('weather-sunset');
    const updatedEl = document.getElementById('weather-updated');
    const alertEl = document.getElementById('weather-alert-text');

    if (tempEl) tempEl.textContent = `${data.temp}°C`;
    if (condEl) condEl.textContent = isMl ? data.conditionMl : data.conditionEn;
    if (iconBadge) iconBadge.textContent = data.icon || "🌤️";
    if (feelsEl) feelsEl.textContent = data.feelsLike || `${data.temp}°C`;
    if (humidityEl) humidityEl.textContent = data.humidity;
    if (rainEl) rainEl.textContent = data.rainProbability;
    if (windEl) windEl.textContent = data.windSpeed;
    if (uvEl) uvEl.textContent = `${data.uv} (${data.uv >= 8 ? 'Very High' : (data.uv >= 6 ? 'High' : (data.uv >= 3 ? 'Moderate' : 'Low'))})`;
    if (pressureEl) pressureEl.textContent = data.pressure;
    if (sunriseEl) sunriseEl.textContent = data.sunrise;
    if (sunsetEl) sunsetEl.textContent = data.sunset;
    if (updatedEl) updatedEl.textContent = data.lastUpdated || "Just now";
    if (alertEl) alertEl.textContent = isMl ? data.alertMl : data.alertEn;

    const forecastGrid = document.getElementById('forecast-grid');
    if (forecastGrid && Array.isArray(data.forecast)) {
      forecastGrid.innerHTML = '';
      data.forecast.forEach(item => {
        const day = isMl ? (item.dayMl || item.day) : item.day;
        const condIcon = item.condition ? item.condition.split(' ')[0] : '🌤️';
        const condText = isMl ? (item.conditionMl || item.condition) : (item.conditionEn || item.condition);
        const cardHtml = `
          <div class="col-6 col-md-4 col-lg-3">
            <div class="km-card text-center py-3 px-2 h-100 shadow-sm border bg-white rounded-3">
              <div class="fw-bold fs-6 mb-1 text-primary-dark">${day}</div>
              <div class="fs-1 my-2">${condIcon}</div>
              <div class="small text-muted mb-2 text-truncate" title="${condText}">${condText}</div>
              <div class="fw-bold fs-4 text-primary-dark mb-2">${item.temp || item.maxTemp || '--°C'}</div>
              <span class="badge bg-light text-primary border px-2 py-1"><i class="fa-solid fa-umbrella me-1"></i>${item.rain || item.rainProbability || '0%'}</span>
            </div>
          </div>
        `;
        forecastGrid.insertAdjacentHTML('beforeend', cardHtml);
      });
    }
  }

  if (districtSelect) {
    districtSelect.addEventListener('change', (e) => loadWeather(e.target.value));
    loadWeather(districtSelect.value);
  }
}

// 6. Market Controller with Chart.js (Live Daily Mandi Pricing)
let marketChartInstance = null;

function initMarket() {
  const searchInput = document.getElementById('market-search');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const districtSelect = document.getElementById('market-district-select');
  const tableBody = document.getElementById('market-table-body');
  const countBadge = document.getElementById('market-results-count');
  const catPills = document.querySelectorAll('.market-cat-pill');
  const refreshBtn = document.getElementById('btn-refresh-market');
  const todayDateBadge = document.getElementById('market-today-date');

  let activeCategory = 'All';
  let currentSelectedCropId = 'tea_leaves';
  let cachedItems = [];

  async function updateChart(cropIdOrName, isRefresh = false) {
    const ctx = document.getElementById('marketChart');
    if (!ctx) return;

    const chartDataObj = await ApiServices.Market.getChartData(cropIdOrName, isRefresh);
    const isMl = AppState.currentLang === 'ml';

    // Update Header details
    const cropBadge = document.getElementById('chart-crop-badge');
    const priceEl = document.getElementById('chart-current-price');
    const trendEl = document.getElementById('chart-trend-badge');
    const marketEl = document.getElementById('chart-market-name');
    const insightEl = document.getElementById('chart-insight-text');

    if (cropBadge) cropBadge.textContent = isMl ? (chartDataObj.cropMl || chartDataObj.cropEn) : chartDataObj.cropEn;
    if (priceEl) priceEl.textContent = `₹${chartDataObj.price}/${chartDataObj.unit || 'kg'}`;
    if (marketEl) marketEl.textContent = isMl ? (chartDataObj.marketMl || chartDataObj.marketEn) : chartDataObj.marketEn;
    if (insightEl) insightEl.textContent = isMl ? (chartDataObj.insightMl || chartDataObj.insightEn) : (chartDataObj.insightEn || 'Steady wholesale demand across Kerala markets.');

    if (trendEl) {
      const isUp = chartDataObj.isUp;
      trendEl.className = isUp ? 'badge bg-success ms-2' : 'badge bg-danger ms-2';
      trendEl.innerHTML = isUp 
        ? `<i class="fa-solid fa-arrow-trend-up me-1"></i>${chartDataObj.trend}` 
        : `<i class="fa-solid fa-arrow-trend-down me-1"></i>${chartDataObj.trend}`;
    }

    if (marketChartInstance) {
      marketChartInstance.destroy();
    }

    const labels = isMl ? (chartDataObj.labelsMl || chartDataObj.labels) : chartDataObj.labels;

    marketChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: chartDataObj.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => ` ₹${context.raw}/${chartDataObj.unit || 'kg'}`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  async function renderMarketTable(isRefresh = false) {
    const searchVal = searchInput ? searchInput.value.trim() : '';
    const districtVal = districtSelect ? districtSelect.value : 'All';
    const isMl = AppState.currentLang === 'ml';

    const res = await ApiServices.Market.getPrices(districtVal, searchVal, activeCategory, isRefresh);
    cachedItems = res.items || res;

    if (todayDateBadge) {
      const dateText = res.lastUpdated || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      todayDateBadge.textContent = isMl 
        ? `തത്സമയം: ${dateText}` 
        : `Live Mandi Rates: ${dateText}`;
    }

    if (countBadge) {
      countBadge.textContent = isMl ? `${cachedItems.length} വിളകൾ ലഭ്യമാണ്` : `${cachedItems.length} Commodities`;
    }

    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (cachedItems.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            <i class="fa-solid fa-filter-circle-xmark fs-2 d-block mb-2 text-warning"></i>
            ${isMl ? 'ഈ തിരച്ചിലിന് അനുയോജ്യമായ വിളകൾ കണ്ടെത്തിയില്ല.' : 'No commodities found matching this search / filter.'}
          </td>
        </tr>
      `;
      return;
    }

    cachedItems.forEach((item, index) => {
      const crop = isMl ? item.cropMl : item.cropEn;
      const market = isMl ? item.marketMl : item.marketEn;
      const trendBadge = item.isUp 
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="fa-solid fa-arrow-trend-up me-1"></i>${item.trend}</span>`
        : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="fa-solid fa-arrow-trend-down me-1"></i>${item.trend}</span>`;

      const isSelected = item.id === currentSelectedCropId || (index === 0 && !cachedItems.some(x => x.id === currentSelectedCropId));
      if (isSelected && !cachedItems.some(x => x.id === currentSelectedCropId)) {
        currentSelectedCropId = item.id;
      }

      const row = `
        <tr class="market-row ${isSelected ? 'table-success fw-bold' : ''}" data-crop-id="${item.id}" style="cursor: pointer;">
          <td>
            <div class="fw-bold text-primary-dark">${crop}</div>
            <small class="badge bg-light text-secondary border">${item.category || 'Commodity'}</small>
          </td>
          <td>
            <div class="small text-muted"><i class="fa-solid fa-location-dot text-success me-1"></i>${market}</div>
          </td>
          <td>
            <span class="fw-bold fs-6 text-primary-green">₹${item.price}</span><small class="text-muted">/${item.unit || 'kg'}</small>
          </td>
          <td>${trendBadge}</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Row Click listeners
    tableBody.querySelectorAll('.market-row').forEach(row => {
      row.addEventListener('click', () => {
        const cropId = row.getAttribute('data-crop-id');
        currentSelectedCropId = cropId;
        
        tableBody.querySelectorAll('.market-row').forEach(r => r.classList.remove('table-success', 'fw-bold'));
        row.classList.add('table-success', 'fw-bold');

        updateChart(cropId);
      });
    });
  }

  // Live Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const icon = refreshBtn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      refreshBtn.disabled = true;

      await renderMarketTable(true);
      await updateChart(currentSelectedCropId, true);

      const isMl = AppState.currentLang === 'ml';
      showToast(isMl ? 'ഇന്നത്തെ തത്സമയ വിപണി നിരക്കുകൾ പുതുക്കി!' : 'Live Mandi Rates refreshed for today!', 'success');

      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        refreshBtn.disabled = false;
      }, 500);
    });
  }

  // Category Pills filter
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => {
        p.classList.remove('btn-km-primary', 'active');
        p.classList.add('btn-outline-success');
      });
      pill.classList.add('btn-km-primary', 'active');
      pill.classList.remove('btn-outline-success');

      activeCategory = pill.getAttribute('data-cat') || 'All';
      renderMarketTable();
    });
  });

  // Search Input listeners
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderMarketTable();
    });
  }

  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      renderMarketTable();
      searchInput.focus();
    });
  }

  if (districtSelect) {
    districtSelect.addEventListener('change', () => {
      renderMarketTable();
    });
  }

  document.addEventListener('languageChanged', () => {
    renderMarketTable();
    updateChart(currentSelectedCropId);
  });

  renderMarketTable();
  updateChart(currentSelectedCropId);
}

// 7. Profile Controller (Real-Time Agro-Climatic Sync & GPS Auto-Detection)
function initProfile() {
  const form = document.getElementById('profile-form');
  const profile = ApiServices.FarmerProfile.getProfile() || {};

  // Kerala District Agro-Climatic Intelligence Knowledge Base (KAU Mapped)
  const KERALA_DISTRICT_AGRO_DATA = {
    'Thiruvananthapuram': {
      location: 'Neyyattinkara, Thiruvananthapuram',
      soil: 'Red Soil',
      crops: ['Tapioca', 'Banana', 'Paddy', 'Coconut', 'Vegetables'],
      water: 'Neyyar Canal & Open Well',
      coords: { lat: 8.5241, lon: 76.9366 }
    },
    'Kollam': {
      location: 'Kottarakkara, Kollam',
      soil: 'Laterite Soil',
      crops: ['Cashew', 'Tapioca', 'Rubber', 'Banana', 'Paddy'],
      water: 'Kallada Irrigation Canal & Well',
      coords: { lat: 8.8932, lon: 76.6141 }
    },
    'Pathanamthitta': {
      location: 'Ranni, Pathanamthitta',
      soil: 'Red Soil',
      crops: ['Rubber', 'Tapioca', 'Banana', 'Pepper', 'Paddy'],
      water: 'Pamba River Basin & Rainfed',
      coords: { lat: 9.2648, lon: 76.7870 }
    },
    'Alappuzha': {
      location: 'Kuttanad, Alappuzha',
      soil: 'Alluvial Soil',
      crops: ['Paddy (Kuttanad)', 'Coconut', 'Banana', 'Vegetables'],
      water: 'Pamba-Manimala River & Backwaters',
      coords: { lat: 9.4981, lon: 76.3388 }
    },
    'Kottayam': {
      location: 'Meenachil, Kottayam',
      soil: 'Laterite Soil',
      crops: ['Rubber', 'Cocoa', 'Banana', 'Pepper', 'Nutmeg'],
      water: 'Meenachil River Basin & Open Well',
      coords: { lat: 9.5916, lon: 76.5222 }
    },
    'Idukki': {
      location: 'Nedumkandam, Idukki',
      soil: 'Red Soil',
      crops: ['Cardamom', 'Black Pepper', 'Tea', 'Cocoa', 'Nutmeg'],
      water: 'Periyar Catchment & Mountain Streams',
      coords: { lat: 9.8500, lon: 76.9700 }
    },
    'Ernakulam': {
      location: 'Aluva / Perumbavoor, Ernakulam',
      soil: 'Alluvial Soil',
      crops: ['Nutmeg', 'Banana', 'Pineapple (Vazhakulam)', 'Vegetables'],
      water: 'Periyar River Canal & Open Well',
      coords: { lat: 9.9816, lon: 76.2999 }
    },
    'Thrissur': {
      location: 'Mannuthy, Thrissur',
      soil: 'Laterite Soil',
      crops: ['Rice / Paddy', 'Banana', 'Coconut', 'Nutmeg', 'Vegetables'],
      water: 'Peechi & Vazhani Canal System',
      coords: { lat: 10.5276, lon: 76.2144 }
    },
    'Palakkad': {
      location: 'Chittur / Alathur, Palakkad',
      soil: 'Black Soil',
      crops: ['Paddy', 'Groundnut', 'Sugarcane', 'Mango', 'Vegetables'],
      water: 'Malampuzha Dam Canal & Borewell',
      coords: { lat: 10.7867, lon: 76.6548 }
    },
    'Malappuram': {
      location: 'Manjeri / Nilambur, Malappuram',
      soil: 'Laterite Soil',
      crops: ['Rubber', 'Arecanut', 'Coconut', 'Banana', 'Spices'],
      water: 'Chaliyar & Kadalundi Basin & Open Well',
      coords: { lat: 11.0732, lon: 76.0740 }
    },
    'Kozhikode': {
      location: 'Koyilandy, Kozhikode',
      soil: 'Laterite Soil',
      crops: ['Coconut', 'Black Pepper', 'Ginger', 'Banana', 'Vegetables'],
      water: 'Kuttiyadi Irrigation Canal & Open Well',
      coords: { lat: 11.2588, lon: 75.7804 }
    },
    'Wayanad': {
      location: 'Kalpetta, Wayanad',
      soil: 'Red Soil',
      crops: ['Coffee (Robusta)', 'Tea', 'Black Pepper', 'Paddy (Gandhakasala)'],
      water: 'Kabini River Tributaries & Rainfed',
      coords: { lat: 11.6854, lon: 76.1320 }
    },
    'Kannur': {
      location: 'Taliparamba, Kannur',
      soil: 'Laterite Soil',
      crops: ['Coconut', 'Cashew', 'Rubber', 'Black Pepper', 'Vegetables'],
      water: 'Pazhassi Irrigation Scheme & Open Well',
      coords: { lat: 11.8745, lon: 75.3704 }
    },
    'Kasaragod': {
      location: 'Nileshwar, Kasaragod',
      soil: 'Coastal Sandy',
      crops: ['Arecanut', 'Coconut', 'Cashew', 'Black Pepper'],
      water: 'Chandragiri River Basin & Borewell',
      coords: { lat: 12.4996, lon: 74.9869 }
    }
  };

  function updateProfileBanner(p) {
    const displayName = p.name || (AppState.currentLang === 'ml' ? 'കർഷകൻ' : 'Raman Nair (രാമൻ നായർ)');
    const displayEl = document.getElementById('prof-display-name');
    if (displayEl) displayEl.textContent = displayName;

    // Compute Initials
    const initialsEl = document.getElementById('prof-initials');
    if (initialsEl) {
      const parts = displayName.split(/\s+/).filter(Boolean);
      let inits = 'RN';
      if (parts.length >= 2) {
        inits = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length >= 2) {
        inits = parts[0].substring(0, 2).toUpperCase();
      }
      initialsEl.textContent = inits;
    }

    // Quick Stats Badges
    const badgeDistrict = document.getElementById('badge-district');
    if (badgeDistrict) badgeDistrict.textContent = p.district || 'Thrissur';

    const badgeCrop = document.getElementById('badge-crop');
    if (badgeCrop) badgeCrop.textContent = p.crops || p.mainCrops || 'Paddy, Banana';

    const badgeLand = document.getElementById('badge-land');
    if (badgeLand) badgeLand.textContent = `${p.landArea || '2.5'} Acres`;
  }

  function renderCropSuggestions(district) {
    const container = document.getElementById('crop-suggestion-pills');
    if (!container) return;
    container.innerHTML = '';
    const dData = KERALA_DISTRICT_AGRO_DATA[district] || KERALA_DISTRICT_AGRO_DATA['Thrissur'];
    (dData.crops || []).forEach(crop => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'badge bg-light text-success border border-success-subtle px-2 py-1 cursor-pointer';
      pill.style.fontSize = '0.78rem';
      pill.style.textDecoration = 'none';
      pill.innerHTML = `<i class="fa-solid fa-plus me-1"></i>${crop}`;
      pill.addEventListener('click', () => {
        const cropsInput = document.getElementById('prof-crops');
        if (!cropsInput) return;
        const currentVal = cropsInput.value.trim();
        if (!currentVal) {
          cropsInput.value = crop;
        } else if (!currentVal.toLowerCase().includes(crop.toLowerCase())) {
          cropsInput.value = `${currentVal}, ${crop}`;
        }
        updateProfileBanner({
          name: document.getElementById('prof-name') ? document.getElementById('prof-name').value : '',
          district: document.getElementById('prof-district') ? document.getElementById('prof-district').value : 'Thrissur',
          crops: cropsInput.value,
          landArea: document.getElementById('prof-land') ? document.getElementById('prof-land').value : '2.5'
        });
      });
      container.appendChild(pill);
    });
  }

  async function syncAgroClimaticParameters(district, isAutoTriggered = false) {
    const agroData = KERALA_DISTRICT_AGRO_DATA[district] || KERALA_DISTRICT_AGRO_DATA['Thrissur'];
    
    // Auto-update Soil if not manually overridden
    const soilSelect = document.getElementById('prof-soil');
    if (soilSelect) {
      soilSelect.value = agroData.soil;
    }

    // Auto-fill Location if empty
    const locInput = document.getElementById('prof-location');
    if (locInput && (!locInput.value || isAutoTriggered || locInput.value.includes(profile.district || 'Thrissur'))) {
      locInput.value = agroData.location;
    }

    // Auto-fill Water Source if empty
    const waterInput = document.getElementById('prof-water');
    if (waterInput && (!waterInput.value || isAutoTriggered)) {
      waterInput.value = agroData.water;
    }

    renderCropSuggestions(district);

    // Fetch Live Weather for Status Banner
    const statusTextEl = document.getElementById('agro-status-text');
    if (statusTextEl) {
      statusTextEl.innerHTML = `<strong>Real-time Agro Sync:</strong> Connecting to ${district} WeatherAPI radar...`;
    }

    try {
      const weather = await ApiServices.Weather.getWeather(district);
      if (statusTextEl) {
        statusTextEl.innerHTML = `<strong>Real-Time Agro Sync:</strong> ${district} • ${agroData.soil} • ${weather.temp}°C • Rain ${weather.rainProbability} (${weather.conditionEn})`;
      }
    } catch (e) {
      if (statusTextEl) {
        statusTextEl.innerHTML = `<strong>Real-Time Agro Sync:</strong> ${district} • ${agroData.soil} • KAU Agro-Climatic Profile Active`;
      }
    }

    updateProfileBanner({
      name: document.getElementById('prof-name') ? document.getElementById('prof-name').value : '',
      district: district,
      crops: document.getElementById('prof-crops') ? document.getElementById('prof-crops').value : 'Paddy, Banana',
      landArea: document.getElementById('prof-land') ? document.getElementById('prof-land').value : '2.5'
    });
  }

  updateProfileBanner(profile);

  if (form) {
    const initialDistrict = profile.district || 'Thrissur';
    if (document.getElementById('prof-name')) document.getElementById('prof-name').value = profile.name || '';
    if (document.getElementById('prof-mobile')) document.getElementById('prof-mobile').value = profile.mobile || '';
    if (document.getElementById('prof-email')) document.getElementById('prof-email').value = profile.email || '';
    if (document.getElementById('prof-district')) document.getElementById('prof-district').value = initialDistrict;
    if (document.getElementById('prof-location')) document.getElementById('prof-location').value = profile.location || `${initialDistrict}, Kerala`;
    if (document.getElementById('prof-land')) document.getElementById('prof-land').value = profile.landArea || '2.5';
    if (document.getElementById('prof-crops')) document.getElementById('prof-crops').value = profile.crops || profile.mainCrops || 'Rice / Paddy, Banana';
    if (document.getElementById('prof-soil')) document.getElementById('prof-soil').value = profile.soil || profile.soilType || 'Laterite Soil';
    if (document.getElementById('prof-water')) document.getElementById('prof-water').value = profile.water || profile.waterSource || 'Open Well & Canal';
    if (document.getElementById('prof-lang')) document.getElementById('prof-lang').value = profile.language || AppState.currentLang || 'ml';
    if (document.getElementById('prof-auto-voice')) document.getElementById('prof-auto-voice').checked = (AppState.autoSpeak !== false);

    syncAgroClimaticParameters(initialDistrict, false);

    // Live Real-Time Typing Listeners for instant Header Banner reflection
    ['prof-name', 'prof-crops', 'prof-land'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          updateProfileBanner({
            name: document.getElementById('prof-name') ? document.getElementById('prof-name').value : '',
            district: document.getElementById('prof-district') ? document.getElementById('prof-district').value : 'Thrissur',
            crops: document.getElementById('prof-crops') ? document.getElementById('prof-crops').value : '',
            landArea: document.getElementById('prof-land') ? document.getElementById('prof-land').value : ''
          });
        });
      }
    });

    // District Change Listener: Real-Time Agro-Climatic Intelligence Sync
    const districtSelect = document.getElementById('prof-district');
    if (districtSelect) {
      districtSelect.addEventListener('change', (e) => {
        syncAgroClimaticParameters(e.target.value, true);
        showToast(
          AppState.currentLang === 'ml' 
            ? `${e.target.value} ജില്ലയിലെ കാലാവസ്ഥയും മണ്ണും തത്സമയം ബന്ധിപ്പിച്ചു!` 
            : `Synced real-time agro-climatic & soil parameters for ${e.target.value}!`,
          'success'
        );
      });
    }

    // Real-Time GPS Auto-Detection
    const gpsBtn = document.getElementById('btn-gps-detect');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        const btnText = document.getElementById('gps-btn-text');
        if (btnText) btnText.textContent = 'Detecting GPS...';
        gpsBtn.disabled = true;

        if (!navigator.geolocation) {
          showToast('Geolocation is not supported by your browser.', 'error');
          if (btnText) btnText.textContent = 'Auto-Detect via GPS';
          gpsBtn.disabled = false;
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;
            
            // Find closest Kerala District using Haversine distance
            let closestDistrict = 'Thrissur';
            let minDistance = Infinity;

            for (const [distName, dData] of Object.entries(KERALA_DISTRICT_AGRO_DATA)) {
              const dLat = (dData.coords.lat - userLat) * (Math.PI / 180);
              const dLon = (dData.coords.lon - userLon) * (Math.PI / 180);
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(userLat * (Math.PI / 180)) * Math.cos(dData.coords.lat * (Math.PI / 180)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const dist = 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
              if (dist < minDistance) {
                minDistance = dist;
                closestDistrict = distName;
              }
            }

            if (districtSelect) districtSelect.value = closestDistrict;
            syncAgroClimaticParameters(closestDistrict, true);
            
            if (btnText) btnText.textContent = `📍 ${closestDistrict}`;
            gpsBtn.disabled = false;
            
            showToast(
              AppState.currentLang === 'ml' 
                ? `GPS വഴി ${closestDistrict} ജില്ല വിജയകരമായി കണ്ടെത്തി!` 
                : `📍 GPS Auto-detected Location: ${closestDistrict} (${minDistance.toFixed(1)} km away)`,
              'success'
            );
          },
          (err) => {
            console.warn('[GPS Detection]', err.message);
            // Default fallback
            if (districtSelect) districtSelect.value = 'Thrissur';
            syncAgroClimaticParameters('Thrissur', true);
            if (btnText) btnText.textContent = 'Auto-Detect via GPS';
            gpsBtn.disabled = false;
            showToast(
              AppState.currentLang === 'ml' 
                ? 'തൃശ്ശൂർ കാർഷിക മേഖല തിരഞ്ഞെടുത്തു.' 
                : 'GPS access denied. Selected default agro-climatic hub (Thrissur).',
              'info'
            );
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        name: document.getElementById('prof-name') ? document.getElementById('prof-name').value.trim() : '',
        mobile: document.getElementById('prof-mobile') ? document.getElementById('prof-mobile').value.trim() : '',
        email: document.getElementById('prof-email') ? document.getElementById('prof-email').value.trim() : '',
        district: document.getElementById('prof-district') ? document.getElementById('prof-district').value : 'Thrissur',
        location: document.getElementById('prof-location') ? document.getElementById('prof-location').value.trim() : '',
        landArea: document.getElementById('prof-land') ? document.getElementById('prof-land').value.trim() : '2.5',
        crops: document.getElementById('prof-crops') ? document.getElementById('prof-crops').value.trim() : '',
        mainCrops: document.getElementById('prof-crops') ? document.getElementById('prof-crops').value.trim() : '',
        soil: document.getElementById('prof-soil') ? document.getElementById('prof-soil').value : 'Laterite Soil',
        soilType: document.getElementById('prof-soil') ? document.getElementById('prof-soil').value : 'Laterite Soil',
        water: document.getElementById('prof-water') ? document.getElementById('prof-water').value.trim() : '',
        waterSource: document.getElementById('prof-water') ? document.getElementById('prof-water').value.trim() : '',
        language: document.getElementById('prof-lang') ? document.getElementById('prof-lang').value : 'ml'
      };

      const autoVoiceChecked = document.getElementById('prof-auto-voice') ? document.getElementById('prof-auto-voice').checked : true;
      AppState.autoSpeak = autoVoiceChecked;
      localStorage.setItem('krishimitra_auto_speak', autoVoiceChecked);

      ApiServices.FarmerProfile.saveProfile(updated);
      updateProfileBanner(updated);
      switchLanguage(updated.language);

      showToast(
        AppState.currentLang === 'ml' 
          ? 'കൃഷി പ്രൊഫൈൽ വിവരങ്ങൾ വിജയകരമായി സംരക്ഷിച്ചു!' 
          : 'Farm profile details saved successfully!',
        'success'
      );
    });
  }
}

// 8. Login & Farmer Registration Controller
function initLogin() {
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const authHeading = document.getElementById('auth-heading');
  const authSubheading = document.getElementById('auth-subheading');
  const btnToggleAuthMode = document.getElementById('btn-toggle-auth-mode');
  const authSwitchPrompt = document.getElementById('auth-switch-prompt');
  const authSwitchBtnText = document.getElementById('auth-switch-btn-text');

  const btnLoginSendOtp = document.getElementById('btn-login-send-otp');
  const loginOtpSection = document.getElementById('login-otp-section');
  const btnLoginVerify = document.getElementById('btn-login-verify');
  const btnResendOtp = document.getElementById('btn-resend-otp');
  const otpTimerDisplay = document.getElementById('otp-timer-display');
  const btnQuickDemo = document.getElementById('btn-quick-demo');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');

  const otpBoxes = [
    document.getElementById('login-otp-1'),
    document.getElementById('login-otp-2'),
    document.getElementById('login-otp-3'),
    document.getElementById('login-otp-4')
  ].filter(Boolean);

  let otpCountdownTimer = null;
  let currentMode = 'login'; // 'login' or 'register'

  // Switch Auth Tabs (Login vs Register)
  function setAuthMode(mode) {
    currentMode = mode;
    const isMl = (AppState.currentLang === 'ml');

    if (mode === 'login') {
      if (tabLoginBtn) tabLoginBtn.classList.add('active');
      if (tabRegisterBtn) tabRegisterBtn.classList.remove('active');
      if (loginSection) loginSection.classList.remove('d-none');
      if (registerSection) registerSection.classList.add('d-none');

      if (authHeading) authHeading.textContent = isMl ? 'കർഷക ലോഗിൻ' : 'Farmer Login';
      if (authSubheading) authSubheading.textContent = isMl 
        ? 'വ്യക്തിഗത AI കൃഷി ഉപദേശങ്ങൾ, കാലാവസ്ഥ, വിപണി വിവരങ്ങൾ എന്നിവയ്ക്കായി ലോഗിൻ ചെയ്യുക' 
        : 'Sign in to access personalized AI crop advisories, weather radar, and market trends';

      if (authSwitchPrompt) authSwitchPrompt.textContent = isMl ? 'പുതിയ കർഷകനാണോ?' : 'New to KrishiMitra?';
      if (authSwitchBtnText) authSwitchBtnText.textContent = isMl ? 'പുതിയ കർഷക രജിസ്ട്രേഷൻ' : 'New Farmer Registration';

    } else {
      if (tabRegisterBtn) tabRegisterBtn.classList.add('active');
      if (tabLoginBtn) tabLoginBtn.classList.remove('active');
      if (registerSection) registerSection.classList.remove('d-none');
      if (loginSection) loginSection.classList.add('d-none');

      if (authHeading) authHeading.textContent = isMl ? 'പുതിയ കർഷക രജിസ്ട്രേഷൻ' : 'New Farmer Registration';
      if (authSubheading) authSubheading.textContent = isMl 
        ? 'നിങ്ങളുടെ കൃഷിയിട വിവരങ്ങൾ നൽകി കൃഷിമിത്ര AI സ്മാർട്ട് സേവനങ്ങൾ നേടുക' 
        : 'Register your farm profile to get precision agriculture advisories tailored to your soil & crop';

      if (authSwitchPrompt) authSwitchPrompt.textContent = isMl ? 'ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?' : 'Already registered?';
      if (authSwitchBtnText) authSwitchBtnText.textContent = isMl ? 'ലോഗിൻ ചെയ്യുക' : 'Farmer Login';
    }
  }

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => setAuthMode('login'));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => setAuthMode('register'));
  if (btnToggleAuthMode) {
    btnToggleAuthMode.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode(currentMode === 'login' ? 'register' : 'login');
    });
  }

  // Pre-fill existing profile values if available
  const existingProfile = ApiServices.FarmerProfile.getProfile();
  if (existingProfile) {
    if (document.getElementById('login-mobile') && existingProfile.mobile) document.getElementById('login-mobile').value = existingProfile.mobile;
    if (document.getElementById('reg-name') && existingProfile.name) document.getElementById('reg-name').value = existingProfile.name;
    if (document.getElementById('reg-mobile') && existingProfile.mobile) document.getElementById('reg-mobile').value = existingProfile.mobile;
    if (document.getElementById('reg-email') && existingProfile.email) document.getElementById('reg-email').value = existingProfile.email;
    if (document.getElementById('reg-district') && existingProfile.district) document.getElementById('reg-district').value = existingProfile.district;
    if (document.getElementById('reg-crop') && existingProfile.crops) document.getElementById('reg-crop').value = existingProfile.crops;
    if (document.getElementById('reg-soil') && existingProfile.soil) document.getElementById('reg-soil').value = existingProfile.soil;
    if (document.getElementById('reg-land') && existingProfile.landArea) document.getElementById('reg-land').value = existingProfile.landArea;
  }

  // OTP Countdown Timer (30s)
  function startOtpTimer() {
    let timeLeft = 30;
    if (btnResendOtp) btnResendOtp.disabled = true;
    if (otpCountdownTimer) clearInterval(otpCountdownTimer);

    if (otpTimerDisplay) {
      otpTimerDisplay.innerHTML = `<i class="fa-regular fa-clock me-1"></i><span>00:${timeLeft < 10 ? '0' : ''}${timeLeft}</span>`;
    }

    otpCountdownTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(otpCountdownTimer);
        if (btnResendOtp) btnResendOtp.disabled = false;
        if (otpTimerDisplay) {
          otpTimerDisplay.innerHTML = `<span class="text-success"><i class="fa-solid fa-check me-1"></i>Ready to resend</span>`;
        }
      } else {
        if (otpTimerDisplay) {
          otpTimerDisplay.innerHTML = `<i class="fa-regular fa-clock me-1"></i><span>00:${timeLeft < 10 ? '0' : ''}${timeLeft}</span>`;
        }
      }
    }, 1000);
  }

  // 4-Digit Segmented OTP Box Event Handlers
  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val && !/^\d+$/.test(val)) {
        e.target.value = '';
        return;
      }
      if (val.length === 1) {
        if (index < otpBoxes.length - 1) {
          otpBoxes[index + 1].focus();
        }
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
      if (e.key === 'Enter') {
        if (btnLoginVerify) btnLoginVerify.click();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{4}$/.test(pasteData)) {
        pasteData.split('').forEach((digit, i) => {
          if (otpBoxes[i]) otpBoxes[i].value = digit;
        });
        if (otpBoxes[3]) otpBoxes[3].focus();
      }
    });
  });

  function getEnteredOtp() {
    return otpBoxes.map(b => b.value.trim()).join('');
  }

  // 1. Send OTP Button Handler (Login)
  if (btnLoginSendOtp) {
    btnLoginSendOtp.addEventListener('click', () => {
      const mobileInput = document.getElementById('login-mobile');
      const mobile = mobileInput ? mobileInput.value.trim() : '';

      if (mobile.length < 10 || !/^\d{10}$/.test(mobile)) {
        showToast(AppState.currentLang === 'ml' ? 'ദയവായി സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക' : 'Please enter a valid 10-digit mobile number', 'warning');
        if (mobileInput) mobileInput.focus();
        return;
      }

      showToast(
        AppState.currentLang === 'ml' 
          ? `OTP മൊബൈൽ നമ്പർ +91 ${mobile}-ലേക്ക് അയച്ചിട്ടുണ്ട്! (ഡെമോ OTP: 1234)` 
          : `Verification OTP sent to +91 ${mobile}! (Demo OTP: 1234)`,
        'info'
      );

      if (loginOtpSection) {
        loginOtpSection.classList.remove('d-none');
        startOtpTimer();
        // Fill demo OTP into boxes automatically for effortless testing
        if (otpBoxes.length === 4) {
          ['1', '2', '3', '4'].forEach((d, idx) => {
            if (otpBoxes[idx]) otpBoxes[idx].value = d;
          });
          otpBoxes[3].focus();
        }
      }
    });
  }

  // Resend OTP Button Handler
  if (btnResendOtp) {
    btnResendOtp.addEventListener('click', () => {
      const mobile = document.getElementById('login-mobile') ? document.getElementById('login-mobile').value.trim() : '';
      showToast(
        AppState.currentLang === 'ml' 
          ? `പുതിയ OTP വീണ്ടും അയച്ചു! (OTP: 1234)` 
          : `New OTP sent successfully! (Demo OTP: 1234)`, 
        'info'
      );
      startOtpTimer();
      if (otpBoxes.length === 4) {
        ['1', '2', '3', '4'].forEach((d, idx) => {
          if (otpBoxes[idx]) otpBoxes[idx].value = d;
        });
      }
    });
  }

  // 2. Verify OTP & Login Button Handler
  if (btnLoginVerify) {
    btnLoginVerify.addEventListener('click', () => {
      const enteredOtp = getEnteredOtp();
      const mobile = document.getElementById('login-mobile') ? document.getElementById('login-mobile').value.trim() : '9876543210';
      const existing = ApiServices.FarmerProfile.getProfile() || {};

      if (enteredOtp === '1234' || enteredOtp.length === 4) {
        const farmerName = existing.name || (AppState.currentLang === 'ml' ? 'കർഷകൻ' : 'Farmer');
        const updatedProfile = {
          ...existing,
          name: farmerName,
          mobile: mobile,
          email: existing.email || 'farmer@example.com',
          district: existing.district || 'Thrissur',
          crops: existing.crops || 'Paddy, Banana',
          soil: existing.soil || 'Alluvial Soil',
          landArea: existing.landArea || '2.5'
        };

        ApiServices.FarmerProfile.saveProfile(updatedProfile);
        localStorage.setItem('krishimitra_logged_in', 'true');

        showToast(
          AppState.currentLang === 'ml' 
            ? `സ്വാഗതം, ${farmerName}! ലോഗിൻ വിജയകരമായി പൂർത്തിയായി.` 
            : `Welcome back, ${farmerName}! Login verified successfully.`, 
          'success'
        );

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } else {
        showToast(
          AppState.currentLang === 'ml' 
            ? 'തെറ്റായ OTP! ഡെമോയ്ക്കായി 1234 നൽകുക.' 
            : 'Invalid OTP! Enter 1234 for demo login.', 
          'danger'
        );
      }
    });
  }

  // 3. New Farmer Registration Handler
  if (btnRegisterSubmit) {
    btnRegisterSubmit.addEventListener('click', () => {
      const name = document.getElementById('reg-name') ? document.getElementById('reg-name').value.trim() : '';
      const mobile = document.getElementById('reg-mobile') ? document.getElementById('reg-mobile').value.trim() : '';
      const email = document.getElementById('reg-email') ? document.getElementById('reg-email').value.trim() : '';
      const district = document.getElementById('reg-district') ? document.getElementById('reg-district').value : 'Thrissur';
      const crop = document.getElementById('reg-crop') ? document.getElementById('reg-crop').value : 'Paddy';
      const land = document.getElementById('reg-land') ? document.getElementById('reg-land').value.trim() : '2.0';
      const soil = document.getElementById('reg-soil') ? document.getElementById('reg-soil').value : 'Laterite Soil';

      if (!name) {
        showToast(AppState.currentLang === 'ml' ? 'ദയവായി നിങ്ങളുടെ മുഴുവൻ പേര് നൽകുക' : 'Please enter your Full Name', 'warning');
        if (document.getElementById('reg-name')) document.getElementById('reg-name').focus();
        return;
      }

      if (mobile.length < 10 || !/^\d{10}$/.test(mobile)) {
        showToast(AppState.currentLang === 'ml' ? 'ദയവായി 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക' : 'Please enter a valid 10-digit mobile number', 'warning');
        if (document.getElementById('reg-mobile')) document.getElementById('reg-mobile').focus();
        return;
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        showToast(AppState.currentLang === 'ml' ? 'ദയവായി സാധുവായ ഇമെയിൽ വിലാസം നൽകുക' : 'Please enter a valid Email Address for farm advisory reports', 'warning');
        if (document.getElementById('reg-email')) document.getElementById('reg-email').focus();
        return;
      }

      // Save new registered profile
      const newFarmerProfile = {
        name: name,
        mobile: mobile,
        email: email,
        district: district,
        location: `${district}, Kerala`,
        crops: crop,
        landArea: land,
        soil: soil,
        language: AppState.currentLang
      };

      ApiServices.FarmerProfile.saveProfile(newFarmerProfile);
      localStorage.setItem('krishimitra_logged_in', 'true');

      showToast(
        AppState.currentLang === 'ml' 
          ? `അഭിനന്ദനങ്ങൾ, ${name}! നിങ്ങളുടെ കൃഷിയിടം രജിസ്റ്റർ ചെയ്തു. പ്രതിദിന റിപ്പോർട്ടുകൾ ${email}-ലേക്ക് ലഭിക്കും.` 
          : `Registration Successful, ${name}! Your farm is registered. Advisory reports will be sent to ${email}.`,
        'success'
      );

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 900);
    });
  }

  // 4. 1-Click Demo Login Handler (Desktop & Mobile)
  const handleQuickDemo = () => {
    const demoProfile = {
      name: 'Raman Nair (രാമൻ നായർ)',
      mobile: '9876543210',
      email: 'raman.nair@gmail.com',
      district: 'Thrissur',
      location: 'Mannuthy, Thrissur',
      crops: 'Rice / Paddy, Banana (നേന്ത്രൻ)',
      landArea: '3.5',
      soil: 'Alluvial Soil',
      water: 'Canal & Open Well',
      language: AppState.currentLang
    };

    ApiServices.FarmerProfile.saveProfile(demoProfile);
    localStorage.setItem('krishimitra_logged_in', 'true');

    showToast(
      AppState.currentLang === 'ml' 
        ? '⚡ ഡെമോ കർഷകനായി ലോഗിൻ ചെയ്യുന്നു: രാമൻ നായർ (തൃശ്ശൂർ)...' 
        : '⚡ Logging in as Demo Farmer: Raman Nair (Thrissur)...', 
      'success'
    );

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 700);
  };

  if (btnQuickDemo) {
    btnQuickDemo.addEventListener('click', handleQuickDemo);
  }
  const btnQuickDemoMobile = document.getElementById('btn-quick-demo-mobile');
  if (btnQuickDemoMobile) {
    btnQuickDemoMobile.addEventListener('click', handleQuickDemo);
  }
}

