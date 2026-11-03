import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiService } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isLoggedIn, profile, showToast } = useFarmerProfile();
  const { t } = useLanguage();

  const targetPath = location.state?.from?.pathname || '/dashboard';

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form States
  const [loginMobile, setLoginMobile] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDeliveryNotice, setOtpDeliveryNotice] = useState('');

  // Registration Form States
  const [regData, setRegData] = useState({
    name: '',
    mobile: '',
    email: '',
    district: 'Thrissur',
    crop: 'Paddy',
    land: '2.0',
    soil: 'Laterite Soil'
  });

  const otpInputsRef = useRef([]);

  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // Quick Demo Login Action
  const handleQuickDemo = () => {
    const demoProfile = {
      name: "Raman Nair",
      mobile: "9876543210",
      district: "Thrissur",
      location: "Mannuthy, Thrissur",
      mainCrop: "Tomato",
      mainCrops: "Tomato, Paddy, Banana",
      landArea: "2.5",
      soilType: "Laterite Soil",
      email: "raman.nair@keralafarm.in"
    };
    login(demoProfile);
    showToast('Demo Login Successful! Welcome Raman Nair', 'success');
    navigate(targetPath, { replace: true });
  };

  const handleSendOtp = async () => {
    if (loginMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }
    setIsSendingOtp(true);
    setOtpDeliveryNotice('');
    try {
      const res = await ApiService.sendOtp(loginMobile);
      setIsSendingOtp(false);
      if (res && res.success) {
        setOtpSent(true);
        setTimer(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);

        if (res.delivered) {
          setOtpDeliveryNotice(`SMS sent via Twilio to +91 ${loginMobile}. Check your phone.`);
          showToast(`Real-time OTP sent to +91 ${loginMobile} via Twilio SMS!`, 'success');
        } else if (res.devOtp) {
          setOtpDeliveryNotice(`Twilio Notice: ${res.message}`);
          showToast(`OTP Code: ${res.devOtp} (Twilio: ${res.error || 'Set credentials in .env'})`, 'info');
        } else {
          setOtpDeliveryNotice(res.message || 'OTP dispatched');
          showToast(res.message || 'OTP sent successfully', 'success');
        }
      } else {
        showToast(res?.error || 'Failed to send OTP. Please check mobile number.', 'danger');
      }
    } catch (err) {
      setIsSendingOtp(false);
      showToast('Network error while requesting OTP. Using local verification.', 'warning');
      setOtpSent(true);
      setTimer(60);
      setCanResend(false);
    }
  };

  const handleOtpChange = (index, val) => {
    // If user pastes multi-digit code (e.g. 6 digits)
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 1) {
        const newDigits = [...otpDigits];
        pasted.split('').forEach((char, idx) => {
          if (idx < 6) newDigits[idx] = char;
        });
        setOtpDigits(newDigits);
        const nextFocus = Math.min(pasted.length, 5);
        if (otpInputsRef.current[nextFocus]) otpInputsRef.current[nextFocus].focus();
        return;
      }
      val = val.slice(-1);
    }

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  const handleVerifyLogin = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join('').trim();
    if (enteredOtp.length < 4) {
      showToast('Please enter the verification code sent to your phone.', 'warning');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await ApiService.verifyOtp(loginMobile, enteredOtp);
      setIsVerifyingOtp(false);

      if (res && res.success) {
        login({
          mobile: loginMobile,
          name: loginMobile === '9876543210' ? 'Raman Nair' : 'Kerala Farmer'
        });
        showToast('OTP Verified! Welcome to KrishiMitra AI', 'success');
        navigate(targetPath, { replace: true });
      } else {
        showToast(res?.error || 'Incorrect OTP. Verification failed. Please check your SMS.', 'danger');
      }
    } catch (err) {
      setIsVerifyingOtp(false);
      // Fallback demo check if backend is offline
      if (enteredOtp === '1234' || enteredOtp === '123456') {
        login({
          mobile: loginMobile,
          name: loginMobile === '9876543210' ? 'Raman Nair' : 'Kerala Farmer'
        });
        showToast('Demo Verified! Welcome to KrishiMitra AI', 'success');
        navigate(targetPath, { replace: true });
      } else {
        showToast('Incorrect OTP. Verification failed.', 'danger');
      }
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regData.name || regData.mobile.length < 10) {
      showToast('Please fill in your name and a valid 10-digit mobile number.', 'warning');
      return;
    }

    login({
      name: regData.name,
      mobile: regData.mobile,
      email: regData.email,
      district: regData.district,
      mainCrop: regData.crop,
      mainCrops: `${regData.crop}, Vegetables`,
      landArea: regData.land,
      soilType: regData.soil
    });

    showToast('Farm Registered Successfully! Welcome to KrishiMitra', 'success');
    navigate(targetPath, { replace: true });
  };

  return (
    <main className="auth-wrapper flex-grow-1 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-11 col-lg-12">
            <div className="auth-card-main">
              <div className="row g-0">
                
                {/* Left Column: Agricultural Showcase (Desktop) */}
                <div className="col-lg-5 auth-showcase-panel d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5">
                  <div>
                    <div className="auth-showcase-logo-card mb-3">
                      <img src="/assets/images/krishimitra_logo.png" alt="KrishiMitra AI" className="auth-showcase-logo" />
                    </div>
                    <div className="auth-showcase-badge mb-3">
                      <i className="fa-solid fa-sparkles text-warning me-1"></i>
                      <span>{t('poweredByAI', 'Powered by AI • Designed for Kerala Farmers')}</span>
                    </div>

                    <h2 className="h3 fw-bold text-white mb-2">{t('showcaseTitle', 'Empowering Kerala Farmers with AI')}</h2>
                    <p className="text-white-50 mb-4">{t('loginSubtitle', 'Sign in to access personalized AI crop advisories, weather radar, and market trends.')}</p>

                    <div className="showcase-feature-list mb-4">
                      <div className="showcase-feature-item d-flex gap-3 mb-3">
                        <div className="showcase-feature-icon text-white"><i className="fa-solid fa-microscope"></i></div>
                        <div>
                          <div className="fw-bold text-white fs-6">{t('showcase1', '🔬 24/7 AI Crop Doctor & Disease Diagnostics')}</div>
                          <small className="text-white-50">Instant botanical leaf analysis & KAU verified remedies</small>
                        </div>
                      </div>

                      <div className="showcase-feature-item d-flex gap-3 mb-3">
                        <div className="showcase-feature-icon text-white"><i className="fa-solid fa-cloud-bolt"></i></div>
                        <div>
                          <div className="fw-bold text-white fs-6">{t('showcase2', '🌦️ Hyperlocal Kerala Rainfall & Weather Radar')}</div>
                          <small className="text-white-50">Severe monsoon alerts & smart irrigation schedules</small>
                        </div>
                      </div>

                      <div className="showcase-feature-item d-flex gap-3 mb-3">
                        <div className="showcase-feature-icon text-white"><i className="fa-solid fa-chart-line"></i></div>
                        <div>
                          <div className="fw-bold text-white fs-6">{t('showcase3', '📈 Live Mandi Crop Prices & Trend Analytics')}</div>
                          <small className="text-white-50">50+ crops tracked daily across all 14 Kerala districts</small>
                        </div>
                      </div>

                      <div className="showcase-feature-item d-flex gap-3">
                        <div className="showcase-feature-icon text-white"><i className="fa-solid fa-seedling"></i></div>
                        <div>
                          <div className="fw-bold text-white fs-6">{t('showcase4', '🌱 Data-Driven Crop & Fertilizer Advisory')}</div>
                          <small className="text-white-50">Customized NPK, bio-fertilizers & organic schedules</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button type="button" onClick={handleQuickDemo} className="auth-demo-badge-btn w-100 py-3">
                      <i className="fa-solid fa-bolt-lightning text-warning me-2"></i>
                      <span>{t('quickDemoLogin', '⚡ 1-Click Demo Login')}</span>
                    </button>
                    <p className="text-center text-white-50 small mt-2 mb-0">{t('demoNote', '(Demo Mode: Auto-fills Raman Nair, OTP: 1234)')}</p>
                  </div>
                </div>

                {/* Right Column: Interactive Tabbed Form */}
                <div className="col-lg-7 p-3 p-sm-4 p-md-5">
                  {isLoggedIn ? (
                    <div className="logged-in-panel p-4 bg-light rounded-4 border shadow-sm text-center">
                      <div className="mb-3">
                        <div
                          className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle shadow-sm"
                          style={{ width: '64px', height: '64px', fontSize: '28px' }}
                        >
                          <i className="fa-solid fa-user-check"></i>
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle mb-2 px-3 py-1 fs-6">
                        <i className="fa-solid fa-circle-check me-1"></i> Active Farmer Session
                      </span>
                      <h3 className="fw-bold text-dark mb-1">{profile.name}</h3>
                      <p className="text-muted mb-3">
                        <i className="fa-solid fa-phone me-1"></i> +91 {profile.mobile || '9876543210'} &bull; <i className="fa-solid fa-location-dot me-1"></i> {profile.district || 'Kerala'}
                      </p>

                      <div className="p-3 bg-white rounded-3 border mb-4 text-start shadow-xs">
                        <div className="row g-2 small">
                          <div className="col-6"><strong>Primary Crop:</strong> {profile.mainCrop || 'Paddy'}</div>
                          <div className="col-6"><strong>Land Area:</strong> {profile.landArea || profile.farmSize || '2.5'} Acres</div>
                          <div className="col-12 text-truncate"><strong>Location:</strong> {profile.location || `${profile.district}, Kerala`}</div>
                          {profile.email && <div className="col-12 text-truncate"><strong>Email:</strong> {profile.email}</div>}
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          type="button"
                          className="btn btn-km-primary btn-lg shadow-sm"
                          onClick={() => navigate('/dashboard')}
                        >
                          <i className="fa-solid fa-gauge-high me-2"></i>
                          <span>{t('goToDashboard', 'Go to Farm Dashboard')}</span>
                        </button>

                        <div className="row g-2 mt-1">
                          <div className="col-6">
                            <button
                              type="button"
                              className="btn btn-outline-danger w-100 py-2 fw-semibold"
                              onClick={() => {
                                logout();
                                setLoginMobile('');
                                setOtpSent(false);
                                setOtpDigits(['', '', '', '', '', '']);
                              }}
                            >
                              <i className="fa-solid fa-right-from-bracket me-1"></i>
                              <span>{t('navLogout', 'Logout')}</span>
                            </button>
                          </div>
                          <div className="col-6">
                            <button
                              type="button"
                              className="btn btn-outline-secondary w-100 py-2 fw-semibold"
                              onClick={() => {
                                logout();
                                setLoginMobile('');
                                setOtpSent(false);
                                setOtpDigits(['', '', '', '', '', '']);
                              }}
                            >
                              <i className="fa-solid fa-arrow-right-arrow-left me-1"></i>
                              <span>Switch Account</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Quick Demo Banner */}
                      <div className="d-lg-none mb-4">
                        <button type="button" onClick={handleQuickDemo} className="btn btn-warning w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2">
                          <i className="fa-solid fa-bolt-lightning text-dark"></i>
                          <span>{t('quickDemoLogin', '⚡ 1-Click Demo Login')}</span>
                        </button>
                        <div className="text-center text-muted small mt-1">
                          <small>{t('demoNote', '(Demo Mode: Auto-fills Raman Nair, OTP: 1234)')}</small>
                        </div>
                      </div>

                      {/* Mode Switch Tabs */}
                      <div className="auth-nav-tabs mb-4">
                        <button
                          type="button"
                          className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                          onClick={() => setActiveTab('login')}
                        >
                          <i className="fa-solid fa-right-to-bracket me-2"></i>
                          <span>{t('loginTab', 'Farmer Login')}</span>
                        </button>
                        <button
                          type="button"
                          className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                          onClick={() => setActiveTab('register')}
                        >
                          <i className="fa-solid fa-user-plus me-2"></i>
                          <span>{t('registerTab', 'New Farmer Registration')}</span>
                        </button>
                      </div>

                      {/* Form Header */}
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div>
                          <h3 className="fw-bold text-primary-dark mb-1">
                            {activeTab === 'login' ? t('loginTab', 'Farmer Login') : t('registerTab', 'New Farmer Registration')}
                          </h3>
                          <p className="text-muted small mb-0">
                            {activeTab === 'login'
                              ? t('loginSubtitle', 'Sign in to access personalized AI crop advisories, weather radar, and market trends')
                              : 'Register your land and crops to receive customized fertilizer schedules and automated alerts'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 1. LOGIN FORM SECTION */}
                  {!isLoggedIn && activeTab === 'login' && (
                    <div>
                      <form onSubmit={(e) => { e.preventDefault(); if (!otpSent) handleSendOtp(); else handleVerifyLogin(); }}>
                        <div className="mb-3">
                          <label className="form-label fw-bold text-dark">{t('mobileNumber', 'Mobile Number')}</label>
                          <div className="auth-input-group">
                            <i className="fa-solid fa-phone auth-input-icon"></i>
                            <input
                              type="tel"
                              className="form-control form-control-lg"
                              placeholder="9876543210"
                              maxLength="10"
                              value={loginMobile}
                              onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                              required
                            />
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <small className="text-muted">Enter 10-digit mobile number</small>
                            <span className="badge bg-light text-success border">Verified SMS / OTP</span>
                          </div>
                        </div>

                        <div className="mb-4 form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="remember-me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <label className="form-check-label text-muted small" htmlFor="remember-me">
                            {t('rememberMe', 'Remember me on this device')}
                          </label>
                        </div>

                        {!otpSent ? (
                          <div className="d-grid mb-3">
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={isSendingOtp || loginMobile.length < 10}
                              className="btn btn-km-primary btn-lg shadow-sm d-flex align-items-center justify-content-center gap-2"
                            >
                              {isSendingOtp ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  <span>Sending Twilio SMS...</span>
                                </>
                              ) : (
                                <>
                                  <span>{t('sendOtp', 'Send Verification OTP')}</span>
                                  <i className="fa-solid fa-paper-plane"></i>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 bg-light rounded-4 border shadow-xs">
                            {otpDeliveryNotice && (
                              <div className={`alert ${otpDeliveryNotice.includes('Twilio') ? 'alert-warning' : 'alert-success'} py-2 px-3 small d-flex align-items-start gap-2 mb-3`}>
                                <i className={`fa-solid ${otpDeliveryNotice.includes('Twilio') ? 'fa-triangle-exclamation text-warning' : 'fa-circle-check text-success'} fs-6 mt-1`}></i>
                                <div>{otpDeliveryNotice}</div>
                              </div>
                            )}
                            <div className="text-center mb-3">
                              <label className="form-label fw-bold text-dark d-block">
                                <i className="fa-solid fa-shield-halved text-success me-1"></i>
                                {t('enterOtp', 'Enter SMS Verification Code')}
                              </label>
                              <div className="otp-digit-grid mt-2 d-flex justify-content-center gap-1 gap-sm-2">
                                {[0, 1, 2, 3, 4, 5].map((idx) => (
                                  <input
                                    key={idx}
                                    ref={(el) => (otpInputsRef.current[idx] = el)}
                                    type="text"
                                    className="otp-box text-center fs-4 fw-bold rounded border shadow-xs"
                                    style={{ width: '40px', height: '48px', maxWidth: '14vw' }}
                                    maxLength="1"
                                    inputMode="numeric"
                                    value={otpDigits[idx]}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                    autoFocus={idx === 0}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                              <span className="otp-timer-badge text-muted small">
                                <i className="fa-regular fa-clock me-1"></i>
                                <span>00:{timer < 10 ? `0${timer}` : timer}</span>
                              </span>
                              <button
                                type="button"
                                className="btn btn-link btn-sm text-decoration-none text-success p-0"
                                onClick={handleSendOtp}
                                disabled={!canResend || isSendingOtp}
                              >
                                <i className="fa-solid fa-rotate-right me-1"></i>
                                <span>{isSendingOtp ? 'Sending...' : t('resendOtp', 'Resend OTP')}</span>
                              </button>
                            </div>

                            <div className="d-grid">
                              <button
                                type="button"
                                onClick={handleVerifyLogin}
                                disabled={isVerifyingOtp}
                                className="btn btn-success btn-lg fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                              >
                                {isVerifyingOtp ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    <span>Verifying OTP...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>{t('verifyLogin', 'Verify & Enter Dashboard')}</span>
                                    <i className="fa-solid fa-arrow-right"></i>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  )}

                  {/* 2. REGISTRATION FORM SECTION */}
                  {!isLoggedIn && activeTab === 'register' && (
                    <div>
                      <form onSubmit={handleRegisterSubmit}>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">{t('fullName', 'Full Name')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-user auth-input-icon"></i>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Raman Nair / രാമൻ നായർ"
                                value={regData.name}
                                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">{t('mobileNumber', 'Mobile Number')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-phone auth-input-icon"></i>
                              <input
                                type="tel"
                                className="form-control"
                                placeholder="9876543210"
                                maxLength="10"
                                value={regData.mobile}
                                onChange={(e) => setRegData({ ...regData, mobile: e.target.value.replace(/\D/g, '') })}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-12">
                            <label className="form-label fw-bold text-dark">{t('emailAddress', 'Email Address (for Reports & Alerts)')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-envelope auth-input-icon"></i>
                              <input
                                type="email"
                                className="form-control"
                                placeholder="farmer@example.com"
                                value={regData.email}
                                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">{t('districtSelect', 'District / Region')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-location-dot auth-input-icon"></i>
                              <select
                                className="form-select"
                                value={regData.district}
                                onChange={(e) => setRegData({ ...regData, district: e.target.value })}
                              >
                                {['Thrissur', 'Palakkad', 'Wayanad', 'Alappuzha', 'Ernakulam', 'Idukki', 'Kottayam', 'Kozhikode', 'Malappuram', 'Kannur', 'Kasaragod', 'Kollam', 'Pathanamthitta', 'Thiruvananthapuram'].map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">{t('primaryCrop', 'Primary Crop')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-leaf auth-input-icon"></i>
                              <select
                                className="form-select"
                                value={regData.crop}
                                onChange={(e) => setRegData({ ...regData, crop: e.target.value })}
                              >
                                <option value="Paddy">Rice / Paddy (നെല്ല്)</option>
                                <option value="Banana">Banana (വാഴ)</option>
                                <option value="Coconut">Coconut (തെങ്ങ്)</option>
                                <option value="Pepper">Black Pepper (കുരുമുളക്)</option>
                                <option value="Rubber">Rubber (റബ്ബർ)</option>
                                <option value="Vegetables">Vegetables (പച്ചക്കറികൾ)</option>
                                <option value="Cardamom">Cardamom (ഏലം)</option>
                                <option value="Tea">Tea (തേയില)</option>
                              </select>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">{t('landArea', 'Land Area (Acres)')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-ruler-combined auth-input-icon"></i>
                              <input
                                type="number"
                                className="form-control"
                                step="0.1"
                                min="0.1"
                                placeholder="2.0"
                                value={regData.land}
                                onChange={(e) => setRegData({ ...regData, land: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold text-dark">{t('soilType', 'Soil Type')}</label>
                            <div className="auth-input-group">
                              <i className="fa-solid fa-mountain auth-input-icon"></i>
                              <select
                                className="form-select"
                                value={regData.soil}
                                onChange={(e) => setRegData({ ...regData, soil: e.target.value })}
                              >
                                <option value="Laterite Soil">Laterite Soil (ചെങ്കൽ മണ്ണ്)</option>
                                <option value="Alluvial Soil">Alluvial Soil (എക്കൽ മണ്ണ്)</option>
                                <option value="Red Soil">Red Soil (ചെമ്മണ്ണ്)</option>
                                <option value="Black Soil">Black Soil (കരിമണ്ണ്)</option>
                                <option value="Coastal Sandy">Coastal Sandy (തീരദേശ മണൽ)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="d-grid mt-4">
                          <button type="submit" className="btn btn-km-primary btn-lg shadow-sm">
                            <span>{t('registerBtn', 'Register & Start Farming Smart')}</span>
                            <i className="fa-solid fa-user-check ms-2"></i>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Footer Quick Toggle */}
                  {!isLoggedIn && (
                    <div className="text-center mt-4 pt-3 border-top">
                      <span className="text-muted small">
                        {activeTab === 'login' ? t('newFarmerPrompt', 'New to KrishiMitra? Register your farm here') : t('alreadyRegistered', 'Already registered? Switch to Login')}
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-success fw-bold text-decoration-none ms-1"
                        onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                      >
                        {activeTab === 'login' ? t('registerTab', 'New Farmer Registration') : t('loginTab', 'Farmer Login')}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
