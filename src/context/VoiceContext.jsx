import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';

const VoiceContext = createContext();

export function VoiceProvider({ children }) {
  const { currentLang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  const recognitionRef = useRef(null);
  const callbackRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isTtsSupported = typeof window !== 'undefined' && !!(window.speechSynthesis && window.SpeechSynthesisUtterance);

  useEffect(() => {
    if (isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      rec.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        setTranscript(text);
        if (final && callbackRef.current) {
          callbackRef.current(final);
          closeVoiceModal();
        }
      };

      rec.onerror = (e) => {
        console.warn('[VOICE] Recognition error:', e.error);
        if (e.error === 'no-speech') {
          setVoiceError('No speech was detected. Please try again.');
        } else if (e.error === 'not-allowed') {
          setVoiceError('Microphone permission denied.');
        } else {
          setVoiceError(`Voice error: ${e.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [isSupported]);

  const startVoiceInput = (onResultCallback) => {
    stopSpeaking();
    setTranscript('');
    setVoiceError(null);
    callbackRef.current = onResultCallback;
    setVoiceModalOpen(true);

    if (!isSupported) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = currentLang === 'ml' ? 'ml-IN' : 'en-IN';
        recognitionRef.current.start();
      }
    } catch (e) {
      console.warn('Recognition start exception:', e);
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      } catch (err) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const closeVoiceModal = () => {
    stopListening();
    setVoiceModalOpen(false);
    setTranscript('');
    setVoiceError(null);
  };

  const stopSpeaking = () => {
    if (isTtsSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text, lang = currentLang, onEnd) => {
    if (!isTtsSupported || !text) return;
    stopSpeaking();

    // Clean markdown and emojis for TTS
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) => (lang === 'ml' && (v.lang === 'ml-IN' || v.lang.startsWith('ml'))) ||
             (lang === 'en' && (v.lang === 'en-IN' || v.lang.startsWith('en')))
    );
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <VoiceContext.Provider
      value={{
        isSupported,
        isTtsSupported,
        isListening,
        isSpeaking,
        voiceModalOpen,
        transcript,
        voiceError,
        startVoiceInput,
        stopListening,
        closeVoiceModal,
        speak,
        stopSpeaking
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

