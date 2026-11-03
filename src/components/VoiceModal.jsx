import React from 'react';
import { useVoice } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceModal() {
  const { voiceModalOpen, closeVoiceModal, transcript, isListening, voiceError } = useVoice();
  const { t } = useLanguage();

  if (!voiceModalOpen) return null;

  return (
    <div
      className="voice-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={closeVoiceModal}
    >
      <div
        className="voice-modal-card text-center p-4 bg-white rounded-4 shadow-2xl"
        style={{ maxWidth: '420px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="badge bg-success-subtle text-success border border-success px-3 py-1">
            <i className="fa-solid fa-microphone me-1"></i> Malayalam & English
          </span>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={closeVoiceModal}
          ></button>
        </div>

        {/* Pulse animation circle */}
        <div className="my-4 d-flex justify-content-center">
          <div
            className={`voice-ripple-circle ${isListening ? 'animate-pulse' : ''}`}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: '#1b5e20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 0 15px rgba(27, 94, 32, 0.2)'
            }}
          >
            <i className="fa-solid fa-microphone-lines fs-1"></i>
          </div>
        </div>

        <h4 className="h5 fw-bold text-dark mb-1">
          {isListening ? t('voiceListeningTitle', 'Listening...') : 'Processing Voice...'}
        </h4>
        <p className="text-muted small mb-3">
          {t('voiceSpeakNow', 'Speak your farming question now')}
        </p>

        {transcript && (
          <div className="p-3 bg-light rounded-3 border mb-3 text-start">
            <small className="text-muted d-block fw-bold mb-1">{t('voiceYouSaid', 'You said:')}</small>
            <p className="mb-0 text-dark fw-medium fs-6">{transcript}</p>
          </div>
        )}

        {voiceError && (
          <div className="alert alert-danger py-2 small mb-3">
            <i className="fa-solid fa-triangle-exclamation me-1"></i> {voiceError}
          </div>
        )}

        <button
          type="button"
          className="btn btn-outline-danger w-100 rounded-pill py-2"
          onClick={closeVoiceModal}
        >
          <i className="fa-solid fa-stop me-1"></i> {t('voiceStopBtn', 'Stop Listening')}
        </button>
      </div>
    </div>
  );
}

