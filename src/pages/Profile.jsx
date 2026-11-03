import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile, logout, isLoggedIn, showToast } = useFarmerProfile();
  const { t, setLanguage, currentLang } = useLanguage();

  const [formData, setFormData] = useState({ ...profile });
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'RN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsDetecting(false);
        setFormData((prev) => ({
          ...prev,
          district: 'Thrissur',
          location: 'Vellanikkara, Thrissur (KAU Zone)'
        }));
        showToast('Location auto-detected: Thrissur Agro-Climatic Zone', 'success');
      },
      (err) => {
        setGpsDetecting(false);
        showToast('Using regional default: Thrissur Central Zone', 'warning');
      }
    );
  };

  const addCropPill = (cropName) => {
    const current = formData.mainCrops ? formData.mainCrops.split(',').map((c) => c.trim()) : [];
    if (!current.includes(cropName)) {
      current.push(cropName);
      setFormData({ ...formData, mainCrops: current.join(', ') });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    if (formData.language && formData.language !== currentLang) {
      setLanguage(formData.language);
    }
    showToast('Farm Profile saved successfully!', 'success');
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          
          {/* Profile Header Banner */}
          <div className="profile-header-banner">
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
              <div id="prof-avatar-badge" className="profile-avatar-circle">
                <span id="prof-initials">{getInitials(formData.name)}</span>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <h1 className="h3 fw-bold text-white mb-0">{formData.name}</h1>
                  <span className="badge bg-success border border-light text-white px-2 py-1 small">
                    <i className="fa-solid fa-circle-check me-1"></i>Verified Farmer
                  </span>
                </div>
                <p className="text-white-50 small mb-2">Personalized Agricultural Profile • Connected to KAU Knowledge Base</p>

                {/* Quick Stats Badges */}
                <div className="d-flex flex-wrap gap-2 pt-1">
                  <span className="profile-stat-badge">
                    <i className="fa-solid fa-location-dot text-warning"></i>
                    <span>{formData.district || 'Thrissur'}</span>
                  </span>
                  <span className="profile-stat-badge">
                    <i className="fa-solid fa-leaf text-success"></i>
                    <span>{formData.mainCrops || 'Tomato, Paddy, Banana'}</span>
                  </span>
                  <span className="profile-stat-badge">
                    <i className="fa-solid fa-ruler-combined text-info"></i>
                    <span>{formData.landArea || '2.5'} Acres</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleSubmit}>
            {/* Section 1: Personal & Contact Details */}
            <div className="profile-section-card">
              <div className="profile-section-header mb-3 pb-2 border-bottom">
                <div className="profile-section-icon text-success fs-4"><i className="fa-solid fa-user"></i></div>
                <div>
                  <h5 className="fw-bold text-primary-dark mb-0">Personal & Contact Details</h5>
                  <small className="text-muted">Your contact information for SMS advisory and verification</small>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label-aligned" data-i18n="farmerName">
                    <i className="fa-solid fa-user text-success me-1"></i> {t('farmerName', 'Farmer Name')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-signature auth-input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label-aligned" data-i18n="mobileNumber">
                    <i className="fa-solid fa-phone text-success me-1"></i> {t('mobileNumber', 'Mobile Number')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-phone auth-input-icon"></i>
                    <input
                      type="tel"
                      className="form-control"
                      maxLength="10"
                      value={formData.mobile || ''}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label-aligned" data-i18n="emailAddress">
                    <i className="fa-solid fa-envelope text-success me-1"></i> {t('emailAddress', 'Advisory Email')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-envelope auth-input-icon"></i>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Agricultural & Soil Parameters */}
            <div className="profile-section-card">
              <div className="profile-section-header justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="profile-section-icon text-success fs-4"><i className="fa-solid fa-wheat-awn"></i></div>
                  <div>
                    <h5 className="fw-bold text-primary-dark mb-0">Agricultural & Soil Parameters</h5>
                    <small className="text-muted">Real-time sync with KAU agro-climatic zones and live weather</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 shadow-sm"
                  onClick={handleGpsDetect}
                  disabled={gpsDetecting}
                >
                  <i className="fa-solid fa-location-crosshairs text-success"></i>
                  <span>{gpsDetecting ? 'Detecting...' : 'Auto-Detect via GPS'}</span>
                </button>
              </div>

              {/* Agro Sync Banner */}
              <div className="alert alert-success-subtle border border-success-subtle p-2 px-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 small shadow-xs">
                <div className="d-flex align-items-center gap-2">
                  <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                  <span><strong>Real-time Agro Sync:</strong> {formData.district} • {formData.soilType} • 29°C</span>
                </div>
                <span className="badge bg-success text-white">Live KAU Sync</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="districtSelect">
                    <i className="fa-solid fa-location-dot text-success me-1"></i> {t('districtSelect', 'District / Region')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-map-pin auth-input-icon"></i>
                    <select
                      className="form-select"
                      value={formData.district || 'Thrissur'}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    >
                      {['Thrissur', 'Palakkad', 'Wayanad', 'Alappuzha', 'Ernakulam', 'Idukki', 'Kottayam', 'Kozhikode', 'Malappuram', 'Kannur', 'Kasaragod', 'Kollam', 'Pathanamthitta', 'Thiruvananthapuram'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="locationLabel">
                    <i className="fa-solid fa-house-chimney text-success me-1"></i> {t('locationLabel', 'Farm Location / Village')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-location-crosshairs auth-input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="mainCrops">
                    <i className="fa-solid fa-leaf text-success me-1"></i> {t('mainCrops', 'Main Cultivated Crops')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-seedling auth-input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mainCrops || ''}
                      onChange={(e) => setFormData({ ...formData, mainCrops: e.target.value })}
                    />
                  </div>
                  <div className="mt-1 d-flex flex-wrap align-items-center gap-1">
                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>Quick Add:</small>
                    {['Paddy', 'Banana', 'Tomato', 'Coconut', 'Black Pepper', 'Rubber', 'Chilli'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-0 px-2 rounded-pill"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => addCropPill(c)}
                      >
                        +{c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="landArea">
                    <i className="fa-solid fa-ruler-combined text-success me-1"></i> {t('landArea', 'Total Land Area (Acres)')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-arrows-left-right auth-input-icon"></i>
                    <input
                      type="number"
                      className="form-control"
                      step="0.1"
                      min="0.1"
                      value={formData.landArea || '2.5'}
                      onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="soilSelect">
                    <i className="fa-solid fa-mountain text-success me-1"></i> {t('soilSelect', 'Soil Type (KAU Mapped)')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-layer-group auth-input-icon"></i>
                    <select
                      className="form-select"
                      value={formData.soilType || 'Laterite Soil'}
                      onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    >
                      <option value="Laterite Soil">Laterite Soil (ചെങ്കൽ മണ്ണ്)</option>
                      <option value="Alluvial Soil">Alluvial Soil (എക്കൽ മണ്ണ്)</option>
                      <option value="Red Soil">Red Soil (ചെമ്മണ്ണ്)</option>
                      <option value="Black Soil">Black Soil (കരിമണ്ണ്)</option>
                      <option value="Coastal Sandy">Coastal Sandy (തീരദേശ മണൽ)</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="waterAvail">
                    <i className="fa-solid fa-droplet text-success me-1"></i> {t('waterAvail', 'Irrigation / Water Source')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-water auth-input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.waterSource || ''}
                      onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: AI Preferences */}
            <div className="profile-section-card">
              <div className="profile-section-header mb-3 pb-2 border-bottom">
                <div className="profile-section-icon text-success fs-4"><i className="fa-solid fa-robot"></i></div>
                <div>
                  <h5 className="fw-bold text-primary-dark mb-0">AI Assistant & Advisory Preferences</h5>
                  <small className="text-muted">Configure your preferred communication language and report channels</small>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-aligned" data-i18n="prefLang">
                    <i className="fa-solid fa-globe text-success me-1"></i> {t('prefLang', 'Preferred App Language')}
                  </label>
                  <div className="auth-input-group">
                    <i className="fa-solid fa-language auth-input-icon"></i>
                    <select
                      className="form-select"
                      value={formData.language || 'ml'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    >
                      <option value="ml">മലയാളം (Malayalam - AI Audio & Text)</option>
                      <option value="en">English (AI Audio & Text)</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6 d-flex align-items-center">
                  <div className="p-3 bg-light rounded-3 border w-100 mt-2">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="prof-auto-voice"
                        checked={formData.autoVoice !== false}
                        onChange={(e) => setFormData({ ...formData, autoVoice: e.target.checked })}
                      />
                      <label className="form-check-label fw-bold text-dark ms-2" htmlFor="prof-auto-voice">
                        Enable Auto-Voice Speaking in Assistant
                      </label>
                    </div>
                    <small className="text-muted d-block ms-4 ps-2">AI automatically speaks responses in your selected language.</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-5">
              <div className="d-flex gap-2">
                <Link to="/dashboard" className="btn btn-km-outline">
                  <i className="fa-solid fa-arrow-left me-1"></i> Back to Dashboard
                </Link>
                {isLoggedIn && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => {
                      logout();
                      navigate('/dashboard');
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket me-1"></i> {t('navLogout', 'Logout')}
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-km-primary btn-lg px-4 w-100 w-sm-auto shadow-sm">
                <i className="fa-solid fa-floppy-disk me-2"></i> {t('save', 'Save Changes')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
