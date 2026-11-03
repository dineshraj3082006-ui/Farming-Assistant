import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { useVoice } from '../context/VoiceContext';
import { ApiService } from '../services/api';

export default function CropDisease() {
  const { t, currentLang } = useLanguage();
  const { profile, setActiveDiagnosis, showToast } = useFarmerProfile();
  const { speak, isSpeaking, stopSpeaking } = useVoice();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [imagePreview, setImagePreview] = useState('/assets/images/disease_tomato_blight.png');
  const [isDragging, setIsDragging] = useState(false);

  // Live Camera Scanner States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef(null);
  const resultCardRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera is not supported on this browser. Please use Google Chrome or upload an image file.');
      showToast('Live camera not supported by your browser', 'warning');
      return;
    }

    try {
      setIsCameraActive(true);
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      let errorMsg = 'Could not access camera. Please allow camera permissions or upload a photo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found. Please choose an image file from your device.';
      }
      setCameraError(errorMsg);
      showToast(errorMsg, 'warning');
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureLiveSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      showToast('Camera video stream is not ready yet.', 'warning');
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // If user camera is mirrored, flip snapshot horizontally for natural feel
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `live_crop_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          setIsCapturing(false);
          processFile(capturedFile);
        } else {
          setIsCapturing(false);
          showToast('Could not capture photo from video feed.', 'danger');
        }
      }, 'image/jpeg', 0.92);
    } catch (e) {
      console.error('Capture error:', e);
      setIsCapturing(false);
      showToast('Error capturing frame.', 'danger');
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setLoading(true);
    setDiagnosis(null);

    try {
      const result = await ApiService.analyzeCrop(file);
      setDiagnosis(result);
      setActiveDiagnosis(result);
      if (result) {
        ApiService.saveDiagnosisHistory(profile?.mobile || '9876543210', result);
      }
      showToast('Leaf diagnosis complete!', 'success');
      setTimeout(() => resultCardRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      showToast('AI analysis encountered an issue.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSample = async (presetKey) => {
    stopCamera();
    setLoading(true);
    setDiagnosis(null);
    try {
      const result = await ApiService.analyzeCrop(presetKey);
      setDiagnosis(result);
      if (result.imageUrl) {
        setImagePreview(result.imageUrl);
      }
      setActiveDiagnosis(result);
      if (result) {
        ApiService.saveDiagnosisHistory(profile?.mobile || '9876543210', result);
      }
      showToast('Leaf diagnosis complete!', 'success');
      setTimeout(() => resultCardRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (e) {
      showToast('Scan error. Using fallback analysis.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop event handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleListenDiagnosis = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!diagnosis) return;

    const speechText = currentLang === 'ml'
      ? `കണ്ടെത്തിയ രോഗം: ${diagnosis.condition}. രോഗ ലക്ഷണങ്ങൾ: ${diagnosis.symptoms?.join('. ')}. ജൈവ പ്രതിവിധി: ${diagnosis.organicSolution?.join('. ')}`
      : `Detected condition: ${diagnosis.condition}. Key symptoms: ${diagnosis.symptoms?.join('. ')}. Recommended organic solution: ${diagnosis.organicSolution?.join('. ')}`;

    speak(speechText, currentLang);
  };

  const handleAskAssistant = () => {
    if (diagnosis) {
      setActiveDiagnosis(diagnosis);
      navigate(`/chatbot?query=${encodeURIComponent(`I scanned my ${diagnosis.cropEn || diagnosis.crop} for ${diagnosis.diseaseEn || diagnosis.condition}. What should I do next?`)}`);
    } else {
      navigate('/chatbot');
    }
  };

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="text-center max-w-700 mx-auto mb-4">
        <h1 className="display-6 fw-bold page-header-title mb-2">{t('doctorTitle', 'AI Crop Doctor & Disease Scanner')}</h1>
        <p className="page-header-subtitle fs-5 text-muted">
          {t('doctorSubtitle', 'Instant diagnosis for leaves, fruits & vegetables with organic remedies & KAU certified treatments')}
        </p>
      </div>

      {/* Main Upload / Live Camera Scanner Box */}
      <div className="row justify-content-center mb-4">
        <div className="col-lg-8">
          <div className="km-card shadow-sm p-3 p-md-4">
            
            {/* 1. Live Camera Scanner Viewport */}
            {isCameraActive ? (
              <div className="live-scanner-modal">
                {/* Viewfinder Header Banner */}
                <div className="p-3 bg-dark d-flex align-items-center justify-content-between text-white border-bottom border-success">
                  <div className="d-flex align-items-center gap-2">
                    <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                    <strong className="small">
                      <i className="fa-solid fa-video text-success me-1"></i> Live Crop Scanner
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light py-1 px-2"
                    onClick={stopCamera}
                    title="Close Camera"
                  >
                    <i className="fa-solid fa-xmark me-1"></i> Close
                  </button>
                </div>

                {/* Live Video Preview with Scanner Overlay */}
                <div className="live-scanner-viewfinder">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                    }}
                  />

                  {/* Scanner Grid & Targeting Box */}
                  <div className="scanner-overlay-grid">
                    <div className="scanner-target-box">
                      <div className="scanner-corner-tr"></div>
                      <div className="scanner-corner-bl"></div>
                      {/* Animated Green Laser Scan Line */}
                      <div className="scanner-laser-line"></div>
                    </div>
                  </div>
                </div>

                {/* Scanner Instructions & Shutter Controls Bar */}
                <div className="p-2 text-center text-white-50 small bg-black border-top border-secondary">
                  <i className="fa-solid fa-crosshairs text-success me-1"></i>
                  Align the plant leaf or affected area inside the frame and tap the capture button.
                </div>

                <div className="scanner-controls-bar">
                  {/* Switch Front/Back Camera */}
                  <button
                    type="button"
                    className="scanner-action-btn"
                    onClick={toggleFacingMode}
                    title="Switch Camera (Front/Rear)"
                  >
                    <i className="fa-solid fa-camera-rotate"></i>
                  </button>

                  {/* Main Shutter Capture Button */}
                  <button
                    type="button"
                    className="scanner-shutter-btn"
                    onClick={captureLiveSnapshot}
                    disabled={isCapturing}
                    title="Capture & Diagnose Crop"
                  >
                    {isCapturing ? (
                      <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                    ) : (
                      <i className="fa-solid fa-camera"></i>
                    )}
                  </button>

                  {/* Close / Cancel Button */}
                  <button
                    type="button"
                    className="scanner-action-btn"
                    onClick={stopCamera}
                    title="Cancel Live Scanner"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            ) : (
              /* 2. Normal Dropzone Box (File Upload or Live Camera Trigger) */
              <div
                id="doctor-dropzone"
                className={`dropzone-box position-relative text-center p-4 ${isDragging ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                style={{ cursor: 'pointer' }}
              >
                <i className="fa-solid fa-camera-retro dropzone-icon mb-2"></i>
                <h3 className="h5 fw-bold mb-2">{t('dropzoneText', '📷 Upload or Capture Plant / Fruit / Vegetable Photo')}</h3>
                <p className="text-muted small mb-3">Click to select photo or drag & drop. Or launch live camera to scan directly.</p>

                {cameraError && (
                  <div className="alert alert-warning py-2 small mb-3 text-start" onClick={(e) => e.stopPropagation()}>
                    <i className="fa-solid fa-circle-exclamation me-1 text-warning"></i>
                    {cameraError}
                  </div>
                )}

                <div className="d-flex flex-wrap justify-content-center gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                  {/* Live Camera Scanner Button */}
                  <button
                    type="button"
                    className="btn btn-km-primary btn-lg shadow-sm px-4"
                    onClick={() => startCamera('environment')}
                  >
                    <i className="fa-solid fa-camera me-2"></i> Live Camera Scanner / ലൈവ് ക്യാമറ
                  </button>

                  {/* Choose Existing File Button */}
                  <button
                    type="button"
                    className="btn btn-km-outline btn-lg px-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fa-solid fa-folder-open me-2"></i> Choose File / ഫോട്ടോ തിരഞ്ഞെടുക്കുക
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  accept="image/*"
                  onChange={(e) => processFile(e.target.files?.[0])}
                />
              </div>
            )}

            {/* Loading Spinner */}
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="h5 fw-bold text-primary-dark mb-1">🔍 AI Plant Doctor is Scanning Image...</h4>
                <p className="text-muted small mb-0">Identifying plant species, disease symptoms, and KAU remedies</p>
              </div>
            )}

            {/* Quick Demo Sample Photos */}
            <div className="mt-4 pt-3 border-top text-center">
              <p className="small text-muted fw-bold mb-3">{t('samplePhotos', 'Or click a sample photo to test instant diagnosis:')}</p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm sample-crop-btn sample-btn-orange"
                  onClick={() => handleScanSample('tomato')}
                >
                  🍅 {t('sampleTomato', 'Tomato (Early Blight)')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm sample-crop-btn sample-btn-green"
                  onClick={() => handleScanSample('rice')}
                >
                  🌾 {t('sampleRice', 'Rice Paddy (Blast)')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm sample-crop-btn sample-btn-amber"
                  onClick={() => handleScanSample('banana')}
                >
                  🍌 Banana (Sigatoka)
                </button>
                <button
                  type="button"
                  className="btn btn-sm sample-crop-btn sample-btn-teal"
                  onClick={() => handleScanSample('coconut')}
                >
                  🥥 Coconut (Root Wilt)
                </button>
                <button
                  type="button"
                  className="btn btn-sm sample-crop-btn sample-btn-purple"
                  onClick={() => handleScanSample('chilli')}
                >
                  🌶️ Chilli (Leaf Curl)
                </button>
                <button
                  type="button"
                  className="btn btn-sm sample-crop-btn sample-btn-emerald"
                  onClick={() => handleScanSample('healthy')}
                >
                  🍃 {t('sampleHealthy', 'Healthy Crop Leaf')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results Card */}
      {diagnosis && (
        <div ref={resultCardRef} className="row justify-content-center mb-4">
          <div className="col-lg-9">
            <div className="km-card border-top border-4 border-success shadow-lg">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-success px-3 py-1 fs-6">
                      <i className="fa-solid fa-circle-check me-1"></i> AI Scan Complete
                    </span>
                    <span className={`badge px-3 py-1 fs-6 ${diagnosis.severity === 'Severe' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      Severity: {diagnosis.severity || 'Moderate'}
                    </span>
                  </div>
                  <h2 className="h3 fw-bold mb-0 text-primary-dark">Diagnosis & Prescription</h2>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={handleListenDiagnosis}
                    className={`btn ${isSpeaking ? 'btn-danger' : 'btn-outline-success'}`}
                  >
                    <i className={`fa-solid ${isSpeaking ? 'fa-stop' : 'fa-volume-high'} me-1`}></i>
                    <span>{isSpeaking ? 'Stop Audio' : t('listenBtn', 'Listen / ശ്രദ്ധിക്കൂ')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiagnosis(null); startCamera('environment'); }}
                    className="btn btn-km-outline"
                  >
                    <i className="fa-solid fa-camera me-1"></i> Scan Another (Live)
                  </button>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-5 text-center">
                  <img
                    src={imagePreview}
                    alt="Analyzed Plant Leaf"
                    className="img-fluid rounded border shadow-sm w-100"
                    style={{ objectFit: 'cover', maxHeight: '250px' }}
                  />
                  <small className="text-muted d-block mt-2">
                    <i className="fa-solid fa-image me-1"></i> Scanned Plant Sample
                  </small>
                </div>

                <div className="col-md-7">
                  <div className="p-3 bg-light rounded border mb-3">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block text-uppercase fw-bold">Plant / Crop</small>
                        <strong className="fs-5 text-dark">{diagnosis.crop}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block text-uppercase fw-bold">{t('confidenceScore', 'Confidence')}</small>
                        <strong className="fs-4 text-success fw-extrabold">{diagnosis.confidence}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-danger mb-0">
                    <small className="text-muted d-block text-uppercase fw-bold">{t('detectedDisease', 'Detected Disease / Condition')}</small>
                    <h3 className="h5 fw-bold mb-0 text-danger">{diagnosis.condition}</h3>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                {/* Symptoms */}
                <div className="col-md-6">
                  <div className="p-3 alert-box-rose h-100 shadow-xs rounded">
                    <h3 className="h5 fw-bold text-danger mb-3">
                      <i className="fa-solid fa-stethoscope text-danger me-2"></i>{t('symptomsTitle', 'Observed Symptoms')}
                    </h3>
                    <ul className="ps-3 mb-0 text-dark">
                      {diagnosis.symptoms?.map((s, idx) => (
                        <li key={idx} className="mb-1">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Organic Remedies */}
                <div className="col-md-6">
                  <div className="p-3 alert-box-green h-100 shadow-xs rounded">
                    <h3 className="h5 fw-bold text-success mb-3">
                      <i className="fa-solid fa-leaf text-success me-2"></i>Organic & Bio-Control Solution
                    </h3>
                    <ul className="ps-3 mb-0 text-dark">
                      {diagnosis.organicSolution?.map((sol, idx) => (
                        <li key={idx} className="mb-1">{sol}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Chemical Remedies */}
                <div className="col-md-6">
                  <div className="p-3 alert-box-blue h-100 shadow-xs rounded">
                    <h3 className="h5 fw-bold text-primary mb-3">
                      <i className="fa-solid fa-flask-vial text-primary me-2"></i>Chemical / Fertilizer Remedies
                    </h3>
                    <ul className="ps-3 mb-0 text-dark">
                      {diagnosis.chemicalSolution?.map((chem, idx) => (
                        <li key={idx} className="mb-1">{chem}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Prevention */}
                <div className="col-md-6">
                  <div className="p-3 alert-box-amber h-100 shadow-xs rounded">
                    <h3 className="h5 fw-bold text-dark mb-3">
                      <i className="fa-solid fa-shield-halved text-warning me-2"></i>Preventive Cultural Practices
                    </h3>
                    <p className="text-dark mb-0">{diagnosis.prevention}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top text-end">
                <button
                  type="button"
                  onClick={handleAskAssistant}
                  className="btn btn-km-primary"
                >
                  <i className="fa-solid fa-robot me-2"></i> Ask KrishiMitra AI Assistant About This
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
