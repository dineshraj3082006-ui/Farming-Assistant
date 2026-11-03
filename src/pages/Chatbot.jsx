import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { useVoice } from '../context/VoiceContext';
import { ApiService } from '../services/api';

// Helper to format simple markdown (bold, lists, breaks)
function renderFormattedMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    // Bullet list item
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const content = isBullet ? trimmed.slice(2) : line;

    // Parse **bold** parts
    const parts = content.split(/(\*\*.*?\*\*)/g);
    const parsedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lIdx} className="ms-3 mb-1">
          {parsedLine}
        </li>
      );
    }
    return (
      <span key={lIdx} className="d-block mb-1">
        {parsedLine}
      </span>
    );
  });
}

export default function Chatbot() {
  const [searchParams] = useSearchParams();
  const { t, currentLang } = useLanguage();
  const { profile, activeDiagnosis } = useFarmerProfile();
  const { speak, stopSpeaking, isSpeaking, startVoiceInput } = useVoice();

  const [autoVoice, setAutoVoice] = useState(profile.autoVoice !== false);
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: currentLang === 'ml'
        ? '👋 **നമസ്കാരം! ഞാൻ കൃഷിമിത്ര AI.** കേരളത്തിലെ കർഷകർക്കായുള്ള വ്യക്തിഗത കാർഷിക സഹായിയാണ്. വിള പരിപാലനം, രോഗങ്ങൾ, കാലാവസ്ഥ, വിപണി വിവരങ്ങൾ എന്നിവയെക്കുറിച്ച് ഏതു സംശയവും ചോദിക്കാം.'
        : '👋 **Namaskaram! I am KrishiMitra AI.** I am your personal agricultural assistant for Kerala. Ask me any query in English or Malayalam, or upload a photo of your crop!',
      sources: []
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Live Camera Snapshot in Chat
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatVideoRef = useRef(null);
  const chatStreamRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const initialQuery = searchParams.get('query');
    if (initialQuery) {
      sendMessage(initialQuery);
    }
  }, [searchParams]);

  // Clean up live stream on unmount
  useEffect(() => {
    return () => {
      stopChatCamera();
    };
  }, []);

  const stopChatCamera = () => {
    if (chatStreamRef.current) {
      chatStreamRef.current.getTracks().forEach((track) => track.stop());
      chatStreamRef.current = null;
    }
    if (chatVideoRef.current) {
      chatVideoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
  };

  const startChatCamera = async (mode = cameraFacing) => {
    stopChatCamera();
    setShowAttachMenu(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Live camera is not supported on this browser.');
      return;
    }

    try {
      setIsLiveCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      chatStreamRef.current = stream;
      if (chatVideoRef.current) {
        chatVideoRef.current.srcObject = stream;
        await chatVideoRef.current.play();
      }
    } catch (err) {
      console.warn('Chat camera error:', err);
      setIsLiveCameraOpen(false);
      alert('Could not access camera. Please check permissions or select a file instead.');
    }
  };

  const captureChatSnapshot = () => {
    const video = chatVideoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `chat_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        stopChatCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  const toggleChatCameraMode = () => {
    const nextMode = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextMode);
    startChatCamera(nextMode);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setShowAttachMenu(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleSpeak = (msgId, text) => {
    if (isSpeaking && activeSpeakingId === msgId) {
      stopSpeaking();
      setActiveSpeakingId(null);
    } else {
      setActiveSpeakingId(msgId);
      speak(text, currentLang, () => setActiveSpeakingId(null));
    }
  };

  const sendMessage = async (textToSend = inputText) => {
    const query = textToSend.trim();
    if (!query && !selectedImage) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query || 'Uploaded crop leaf photo',
      imageUrl: imagePreview
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    const hadImage = !!selectedImage;
    removeImage();
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await ApiService.sendChatMessage({
        message: query,
        language: currentLang,
        farmerProfile: profile,
        history: historyPayload,
        hasImage: hadImage,
        activeDiagnosis: activeDiagnosis
      });

      const replyText = response.reply || response.answer || "I analyzed your query according to Kerala Agricultural University standards.";
      const newBotId = Date.now() + 1;

      const botMessage = {
        id: newBotId,
        sender: 'bot',
        text: replyText,
        sources: response.sources || []
      };

      setMessages((prev) => [...prev, botMessage]);

      if (autoVoice) {
        setActiveSpeakingId(newBotId);
        speak(replyText, currentLang, () => setActiveSpeakingId(null));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I experienced a network connection delay. Please ensure the backend server is running.",
          sources: []
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceButtonClick = () => {
    startVoiceInput((recognizedText) => {
      if (recognizedText) {
        setInputText(recognizedText);
        sendMessage(recognizedText);
      }
    });
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="chat-container">
            
            {/* Chat Header */}
            <div className="chat-header p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3">
                <div className="chat-header-avatar-box">
                  <img src="/assets/images/krishimitra_icon.png" alt="KrishiMitra AI" className="chat-header-robot-avatar" style={{ width: '42px', height: '42px' }} />
                </div>
                <div>
                  <h1 className="h5 mb-0 text-white fw-bold">{t('chatbotTitle', 'Ask KrishiMitra AI')}</h1>
                  <small className="text-white-50">
                    <i className="fa-solid fa-circle text-success me-1 fs-6"></i>
                    Malayalam & English Agricultural RAG Engine
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${autoVoice ? 'btn-light text-success' : 'btn-outline-light'} fw-bold d-flex align-items-center gap-1 shadow-sm`}
                  onClick={() => setAutoVoice(!autoVoice)}
                  title="Toggle Auto-Voice"
                >
                  <i className={`fa-solid ${autoVoice ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                  <span className="d-none d-md-inline">
                    {autoVoice ? t('autoVoiceOn', 'Auto-Voice: ON') : t('autoVoiceOff', 'Auto-Voice: OFF')}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setMessages([])}
                  title="Clear Conversation"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>

                <button
                  type="button"
                  className="btn btn-km-voice"
                  onClick={handleVoiceButtonClick}
                  aria-label="Start voice assistant"
                >
                  <i className="fa-solid fa-microphone me-1"></i>
                  <span className="d-none d-sm-inline">{t('speakBtn', 'Speak to KrishiMitra')}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                  {msg.imageUrl && (
                    <div className="mb-2">
                      <img src={msg.imageUrl} alt="Attached plant" className="rounded border shadow-xs" style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div className="chat-content">
                    {renderFormattedMessage(msg.text)}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-1 border-top small text-muted" style={{ fontSize: '0.8rem' }}>
                      <i className="fa-solid fa-book-open me-1 text-success"></i>
                      <strong>Source:</strong> {msg.sources.join(', ')}
                    </div>
                  )}

                  {msg.sender === 'bot' && (
                    <button
                      type="button"
                      className={`btn-listen mt-2 ${isSpeaking && activeSpeakingId === msg.id ? 'speaking' : ''}`}
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                    >
                      <i className={`fa-solid ${isSpeaking && activeSpeakingId === msg.id ? 'fa-stop' : 'fa-volume-high'} me-1`}></i>
                      <span>{isSpeaking && activeSpeakingId === msg.id ? t('stopListening', 'Stop') : t('listenBtn', 'Listen')}</span>
                    </button>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="chat-bubble bot">
                  <div className="d-flex align-items-center gap-2">
                    <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                    <span className="small text-muted">KrishiMitra AI is formulating agricultural advice...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Live Camera Scanner Modal in Chat */}
            {isLiveCameraOpen && (
              <div className="p-3 bg-dark text-white border-top border-success position-relative">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-success fw-bold">
                    <i className="fa-solid fa-camera me-1"></i> Live Crop Photo Scanner
                  </span>
                  <button type="button" className="btn-close btn-close-white" onClick={stopChatCamera}></button>
                </div>

                <div className="live-scanner-viewfinder rounded-3 mb-2" style={{ maxHeight: '280px' }}>
                  <video
                    ref={chatVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      maxHeight: '280px',
                      objectFit: 'cover',
                      transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none'
                    }}
                  />
                  <div className="scanner-overlay-grid">
                    <div className="scanner-target-box" style={{ width: '85%', height: '80%' }}>
                      <div className="scanner-corner-tr"></div>
                      <div className="scanner-corner-bl"></div>
                      <div className="scanner-laser-line"></div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center align-items-center gap-3">
                  <button type="button" className="scanner-action-btn" onClick={toggleChatCameraMode} title="Flip Camera">
                    <i className="fa-solid fa-camera-rotate"></i>
                  </button>
                  <button type="button" className="scanner-shutter-btn" onClick={captureChatSnapshot} title="Capture Snapshot">
                    <i className="fa-solid fa-camera"></i>
                  </button>
                  <button type="button" className="scanner-action-btn" onClick={stopChatCamera} title="Close Camera">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Input & Quick Chips Area */}
            <div className="chat-input-area position-relative">
              
              {/* Hidden Image Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="d-none"
                accept="image/*"
                onChange={handleImageSelect}
              />

              {/* Image Preview Bar */}
              {imagePreview && (
                <div className="d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded border">
                  <div className="d-flex align-items-center gap-2">
                    <img src={imagePreview} alt="Leaf Preview" className="rounded border" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                    <span className="small fw-bold text-dark">📷 Plant Leaf Image Attached</span>
                  </div>
                  <button type="button" className="btn-close" onClick={removeImage}></button>
                </div>
              )}

              {/* Attach Dropdown Menu */}
              {showAttachMenu && (
                <div
                  className="position-absolute bg-white rounded-3 shadow-lg border p-2 d-flex flex-column gap-2"
                  style={{ bottom: '70px', left: '15px', zIndex: 100, minWidth: '200px' }}
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-light text-start d-flex align-items-center gap-2 py-2"
                    onClick={() => startChatCamera('environment')}
                  >
                    <i className="fa-solid fa-video text-success fs-6"></i>
                    <span>Live Camera Scanner</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light text-start d-flex align-items-center gap-2 py-2"
                    onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                  >
                    <i className="fa-solid fa-folder-open text-primary fs-6"></i>
                    <span>Choose from Files / Gallery</span>
                  </button>
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="chat-quick-chips">
                {[
                  { text: t('q1', "My tomato leaves have black spots. What should I do?"), color: 'chip-accent-orange' },
                  { text: t('q2', "What should I plant now in Thrissur?"), color: 'chip-accent-green' },
                  { text: t('q3', "Is heavy rain expected tomorrow?"), color: 'chip-accent-blue' },
                  { text: t('q4', "Why are my banana leaves turning yellow?"), color: 'chip-accent-teal' },
                  { text: t('q5', "What is today's coconut market price in Kozhikode?"), color: 'chip-accent-purple' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`chip-btn ${chip.color}`}
                    onClick={() => sendMessage(chip.text)}
                  >
                    {chip.text}
                  </button>
                ))}
              </div>

              {/* Text Input Row */}
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="input-group">
                <button
                  type="button"
                  className={`btn ${showAttachMenu ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  title="Attach Photo or Open Camera"
                >
                  <i className="fa-solid fa-camera fs-5"></i>
                </button>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder={t('chatbotPlaceholder', 'Type your query or speak in Malayalam/English...')}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-km-primary px-4">
                  <i className="fa-solid fa-paper-plane fs-5"></i>
                </button>
              </form>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
