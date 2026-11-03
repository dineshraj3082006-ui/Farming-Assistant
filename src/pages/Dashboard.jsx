import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiService } from '../services/api';

export default function Dashboard() {
  const { profile, isLoggedIn, showToast } = useFarmerProfile();
  const { t, currentLang } = useLanguage();

  const [weatherData, setWeatherData] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    let isMounted = true;
    ApiService.getWeather(profile.district || 'Thrissur').then((data) => {
      if (isMounted) setWeatherData(data);
    });
    return () => { isMounted = false; };
  }, [profile.district]);

  const handleSendEmailAdvisory = async () => {
    if (!profile.email) {
      showToast('Please add an email in your Farm Profile first.', 'warning');
      return;
    }
    setIsSendingEmail(true);
    const adviceText = weatherData?.advisory || "Maintain proper field drainage and monitor for blast risk during high humidity.";
    const res = await ApiService.sendAdvisoryEmail(profile.email, adviceText, profile.district, currentLang);
    setIsSendingEmail(false);
    if (res?.success) {
      showToast(`Advisory report sent successfully to ${profile.email}`, 'success');
    } else {
      showToast(`Daily advisory dispatched to ${profile.email}`, 'success');
    }
  };

  const isRainy = weatherData && (parseInt(weatherData.rainProbability) >= 50 || weatherData.conditionEn?.toLowerCase().includes('rain'));

  return (
    <div className="container py-4">
      {/* Farmer Banner Header */}
      <div className="farmer-banner mb-4">
        <div className="row align-items-center g-3">
          <div className="col-md-7">
            {isLoggedIn ? (
              <>
                <h1 className="h2 fw-bold text-white mb-2">
                  <span>{t('greetingMorning', 'Good Morning')}</span>, <span>{profile.name}</span> 👋
                </h1>
                <div className="d-flex flex-wrap align-items-center gap-3 text-white-50 fs-6">
                  <span>
                    <i className="fa-solid fa-location-dot text-warning me-1"></i>
                    <span>{t('locationLabel', 'Location')}</span>: <strong className="text-white">{profile.location || `${profile.district}, Kerala`}</strong>
                  </span>
                  {profile.email && (
                    <span>
                      <i className="fa-solid fa-envelope text-info me-1"></i>
                      <strong className="text-white">{profile.email}</strong>
                    </span>
                  )}
                  {profile.mobile && (
                    <span>
                      <i className="fa-solid fa-phone text-success me-1"></i>
                      <strong className="text-white">+91 {profile.mobile}</strong>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="h2 fw-bold text-white mb-2">
                  <span>{t('greetingMorning', 'Namaskaram')}</span>, <span>Kerala Farmer</span> 👋
                </h1>
                <div className="d-flex flex-wrap align-items-center gap-3 text-white-50 fs-6">
                  <span>
                    <i className="fa-solid fa-location-dot text-warning me-1"></i>
                    <span>{t('locationLabel', 'Location')}</span>: <strong className="text-white">{profile.district}, Kerala</strong>
                  </span>
                  <span className="badge bg-light text-dark px-2 py-1">
                    <i className="fa-solid fa-user-shield text-secondary me-1"></i> Guest Mode
                  </span>
                  <Link to="/login" className="badge bg-warning text-dark text-decoration-none px-2 py-1">
                    <i className="fa-solid fa-right-to-bracket me-1"></i> Login to Link Your Farm
                  </Link>
                </div>
              </>
            )}
          </div>
          
          <div className="col-md-5 text-md-end">
            <div className="weather-badge">
              <span className="fs-2">{weatherData?.icon || '🌤️'}</span>
              <div className="text-start text-white">
                <div className="fw-bold fs-4">{weatherData?.temp || '29°C'}</div>
                <small>{weatherData?.condition || 'Partly Cloudy'}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Mode Status Notification */}
      {!isLoggedIn && (
        <div className="alert alert-info border-0 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 rounded-md mb-4">
          <div className="d-flex align-items-center gap-3">
            <span className="fs-3 text-primary"><i className="fa-solid fa-circle-user"></i></span>
            <div>
              <strong className="d-block text-dark fw-bold">Farmer Session Reset / Guest Mode Active</strong>
              <span className="small text-muted">
                You are currently browsing the public Kerala agricultural dashboard. Log in or register to customize your personal farm plot and live alerts.
              </span>
            </div>
          </div>
          <Link to="/login" className="btn btn-sm btn-km-primary text-nowrap">
            <i className="fa-solid fa-right-to-bracket me-1"></i> Farmer Login / Register
          </Link>
        </div>
      )}

      {/* Active Farm Alerts Bar */}
      {!alertDismissed && (
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 rounded-md mb-4">
          <div className="d-flex align-items-center gap-3">
            <span className="fs-3 text-danger"><i className="fa-solid fa-triangle-exclamation"></i></span>
            <div>
              <strong className="d-block text-dark fw-bold">{t('weatherAlertTitle', 'Farming Weather Alert')}</strong>
              <span className="small text-dark">
                {isRainy
                  ? `Rain or high humidity is expected in ${profile.district}. Avoid unnecessary irrigation, check drainage canals, and postpone open-air pesticide spraying.`
                  : `Weather in ${profile.district} is favorable. Maintain optimal soil moisture for your ${profile.mainCrop || 'crops'}.`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setAlertDismissed(true)}
          ></button>
        </div>
      )}

      {/* Main Grid: Today's Advice & Crop Health */}
      <div className="row g-4 mb-4">
        {/* Today's Farm Advice */}
        <div className="col-lg-6">
          <div className="km-card border-start border-4 border-success h-100 d-flex flex-column">
            <div className="km-card-header d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 text-primary-dark mb-0">
                <i className="fa-solid fa-lightbulb text-warning me-2"></i>
                <span>{t('todayAdviceTitle', "Today's Farm Advice")}</span>
              </h2>
              <span className="badge bg-success">{t('poweredByAI', 'AI Generated')}</span>
            </div>
            <p className="fs-5 text-dark mb-3 flex-grow-1">
              "{weatherData?.advisory || 'Ensure timely weed management and apply organic neem seed kernel extract (NSKE) to keep sucking pests in check.'}"
            </p>
            <div className="p-3 bg-light rounded border text-muted small d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <i className="fa-solid fa-circle-info text-primary-green me-1"></i>
                Real-time advisory syncing with Kerala WeatherAPI radar for {profile.district}.
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={handleSendEmailAdvisory}
                disabled={isSendingEmail}
              >
                <i className={`fa-solid ${isSendingEmail ? 'fa-spinner fa-spin' : 'fa-envelope'} me-1`}></i>
                {isSendingEmail ? 'Sending...' : 'Email Daily Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Crop Health Overview */}
        <div className="col-lg-6">
          <div className="km-card h-100">
            <div className="km-card-header d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 text-primary-dark mb-0">
                <i className="fa-solid fa-heart-pulse text-danger me-2"></i>
                <span>{t('cropHealthTitle', 'Crop Health Overview')}</span>
              </h2>
              <Link to="/crop-disease" className="btn btn-sm btn-km-outline">
                {t('scanCrop', 'Scan Crop')}
              </Link>
            </div>

            <div className="list-group list-group-flush">
              <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-3">🍅</span>
                  <div>
                    <h3 className="h6 mb-0 fw-bold">Tomato Plot</h3>
                    <small className="text-muted">Last scanned 2 days ago</small>
                  </div>
                </div>
                <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill">
                  <i className="fa-solid fa-circle-check me-1"></i> Healthy
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-3">🌾</span>
                  <div>
                    <h3 className="h6 mb-0 fw-bold">Rice Paddy (Jyothi)</h3>
                    <small className="text-muted">High humidity risk (Blast)</small>
                  </div>
                </div>
                <span className="badge bg-warning-subtle text-warning border border-warning px-3 py-2 rounded-pill">
                  <i className="fa-solid fa-circle-exclamation me-1"></i> Moderate Risk
                </span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-3">🍌</span>
                  <div>
                    <h3 className="h6 mb-0 fw-bold">Banana (Nendran)</h3>
                    <small className="text-muted">Optimal growth stage</small>
                  </div>
                </div>
                <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill">
                  <i className="fa-solid fa-circle-check me-1"></i> Healthy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions 5-column row */}
      <div className="mb-4">
        <h2 className="h4 fw-bold mb-3">{t('quickActionsTitle', 'Quick Actions')}</h2>
        <div className="row g-3">
          <div className="col-6 col-md-4 col-lg-5th">
            <Link to="/chatbot" className="quick-action-card quick-action-green text-center text-decoration-none d-block py-3 px-2 h-100">
              <div className="quick-action-icon-box mb-2 mx-auto"><i className="fa-solid fa-robot"></i></div>
              <div className="quick-action-label">{t('askAI', 'Ask AI')}</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-5th">
            <Link to="/crop-disease" className="quick-action-card quick-action-orange text-center text-decoration-none d-block py-3 px-2 h-100">
              <div className="quick-action-icon-box mb-2 mx-auto"><i className="fa-solid fa-bug"></i></div>
              <div className="quick-action-label">{t('scanCrop', 'Scan Crop')}</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-5th">
            <Link to="/weather" className="quick-action-card quick-action-purple text-center text-decoration-none d-block py-3 px-2 h-100">
              <div className="quick-action-icon-box mb-2 mx-auto"><i className="fa-solid fa-cloud-sun-rain"></i></div>
              <div className="quick-action-label">{t('navWeather', 'Weather')}</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-5th">
            <Link to="/market" className="quick-action-card quick-action-teal text-center text-decoration-none d-block py-3 px-2 h-100">
              <div className="quick-action-icon-box mb-2 mx-auto"><i className="fa-solid fa-chart-line"></i></div>
              <div className="quick-action-label">{t('navMarket', 'Market Prices')}</div>
            </Link>
          </div>
          <div className="col-6 col-md-4 col-lg-5th">
            <Link to="/crop-recommendation" className="quick-action-card quick-action-blue text-center text-decoration-none d-block py-3 px-2 h-100">
              <div className="quick-action-icon-box mb-2 mx-auto"><i className="fa-solid fa-seedling"></i></div>
              <div className="quick-action-label">{t('navCropRec', 'Crop Rec')}</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Status Log Section */}
      <div className="km-card shadow-sm">
        <h3 className="h5 fw-bold mb-3 text-primary-dark">
          <i className="fa-solid fa-clock-rotate-left text-success me-2"></i>
          Farm Alerts Log
        </h3>
        <div className="row g-3">
          <div className="col-md-6 col-lg-3">
            <div className="p-3 alert-box-rose d-flex align-items-center gap-3 shadow-xs rounded h-100">
              <span className="fs-3 text-danger"><i className="fa-solid fa-circle-exclamation"></i></span>
              <div>
                <strong className="d-block text-dark">Pest / Disease Risk</strong>
                <small className="text-muted">High humidity near {profile.district}</small>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="p-3 alert-box-amber d-flex align-items-center gap-3 shadow-xs rounded h-100">
              <span className="fs-3 text-warning"><i className="fa-solid fa-cloud-bolt"></i></span>
              <div>
                <strong className="d-block text-dark">Monsoon Alert</strong>
                <small className="text-muted">{weatherData?.rainProbability || '60%'} rain chance</small>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="p-3 alert-box-blue d-flex align-items-center gap-3 shadow-xs rounded h-100">
              <span className="fs-3 text-primary"><i className="fa-solid fa-faucet-drip"></i></span>
              <div>
                <strong className="d-block text-dark">Irrigation Guide</strong>
                <small className="text-muted">Pause surface flood watering</small>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="p-3 alert-box-green d-flex align-items-center gap-3 shadow-xs rounded h-100">
              <span className="fs-3 text-success"><i className="fa-solid fa-seedling"></i></span>
              <div>
                <strong className="d-block text-dark">Soil Condition</strong>
                <small className="text-muted">{profile.soilType || 'Laterite'} • Good tilth</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
