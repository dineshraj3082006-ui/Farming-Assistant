import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { ApiService } from '../services/api';

export default function Weather() {
  const { t } = useLanguage();
  const { profile } = useFarmerProfile();

  const [selectedDistrict, setSelectedDistrict] = useState(profile.district || 'Thrissur');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ApiService.getWeather(selectedDistrict).then((data) => {
      if (active) {
        setWeatherData(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [selectedDistrict]);

  return (
    <div className="container py-4">
      {/* Header & District Selector */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold page-header-title mb-1">{t('weatherPageTitle', 'Smart Weather & Farm Alerts')}</h1>
          <p className="page-header-subtitle mb-0 text-muted">Hyper-local climate forecast for agricultural management in Kerala</p>
        </div>
        <div className="min-w-200 w-100 w-md-auto">
          <select
            className="form-select form-select-lg border-success fw-bold"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            {['Thrissur', 'Palakkad', 'Wayanad', 'Alappuzha', 'Ernakulam', 'Idukki', 'Kottayam', 'Kozhikode', 'Malappuram', 'Kannur', 'Kasaragod', 'Kollam', 'Pathanamthitta', 'Thiruvananthapuram'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Weather Alert Banner */}
      <div className="alert alert-warning border-start border-4 border-warning shadow-sm mb-4">
        <div className="d-flex align-items-start gap-3">
          <span className="fs-2 text-warning"><i className="fa-solid fa-cloud-bolt"></i></span>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h2 className="h5 fw-bold text-dark mb-1">{t('weatherAlertTitle', '⚠️ Farming Weather Advisory')}</h2>
              <span className="badge bg-success-subtle text-success border border-success px-2 py-1 small">
                <i className="fa-solid fa-circle-dot text-success me-1"></i> Live Radar
              </span>
            </div>
            <p className="mb-0 text-dark fs-6 mt-1">
              {weatherData?.advisory || 'Loading real-time agricultural weather advisory...'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Current Weather Cards */}
      <div className="row g-4 mb-4">
        {/* Big Temp & Condition Card */}
        <div className="col-lg-5">
          <div className="km-card bg-gradient-green text-white p-4 h-100 position-relative overflow-hidden shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge bg-white text-dark fw-bold px-3 py-2 shadow-sm">
                <i className="fa-solid fa-satellite-dish text-success me-1"></i> Live WeatherAPI
              </span>
              <span className="fs-1">{weatherData?.icon || '🌤️'}</span>
            </div>
            <div className="display-3 fw-bold text-white mb-1">{weatherData?.temp || '--°C'}</div>
            <div className="fs-4 text-white-50 mb-3">{weatherData?.condition || 'Fetching live radar...'}</div>

            <div className="pt-3 border-top border-white-50 d-flex justify-content-between align-items-center flex-wrap gap-2 small text-white-50">
              <span><i className="fa-solid fa-temperature-half me-1"></i> Feels like: <strong className="text-white">{weatherData?.feelsLike || '--°C'}</strong></span>
              <span><i className="fa-solid fa-location-dot me-1"></i> <strong className="text-white">{selectedDistrict}, Kerala</strong></span>
            </div>
          </div>
        </div>

        {/* Weather Metrics Grid */}
        <div className="col-lg-7">
          <div className="row g-3">
            <div className="col-6 col-md-4">
              <div className="vibrant-card-teal text-center py-3 px-2 h-100">
                <div className="vibrant-icon-circle mb-2"><i className="fa-solid fa-droplet text-info fs-3"></i></div>
                <small className="vibrant-label d-block text-muted">{t('humidity', 'Humidity')}</small>
                <span className="vibrant-val d-block fs-4 fw-bold">{weatherData?.humidity || '78%'}</span>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <div className="vibrant-card-blue text-center py-3 px-2 h-100">
                <div className="vibrant-icon-circle mb-2"><i className="fa-solid fa-cloud-showers-heavy text-primary fs-3"></i></div>
                <small className="vibrant-label d-block text-muted">{t('rainProb', 'Rain Probability')}</small>
                <span className="vibrant-val d-block fs-4 fw-bold">{weatherData?.rainProbability || '65%'}</span>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <div className="vibrant-card-purple text-center py-3 px-2 h-100">
                <div className="vibrant-icon-circle mb-2"><i className="fa-solid fa-wind text-purple fs-3"></i></div>
                <small className="vibrant-label d-block text-muted">{t('windSpeed', 'Wind Speed')}</small>
                <span className="vibrant-val d-block fs-4 fw-bold">{weatherData?.windSpeed || '14 km/h'}</span>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <div className="vibrant-card-amber text-center py-3 px-2 h-100">
                <div className="vibrant-icon-circle mb-2"><i className="fa-solid fa-sun text-warning fs-3"></i></div>
                <small className="vibrant-label d-block text-muted">UV Index</small>
                <span className="vibrant-val d-block fs-4 fw-bold">Moderate (5.2)</span>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <div className="vibrant-card-green text-center py-3 px-2 h-100">
                <div className="vibrant-icon-circle mb-2"><i className="fa-solid fa-gauge-high text-success fs-3"></i></div>
                <small className="vibrant-label d-block text-muted">Barometer</small>
                <span className="vibrant-val d-block fs-4 fw-bold">1008 hPa</span>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <div className="vibrant-card-rose text-center py-3 px-2 h-100">
                <div className="vibrant-icon-circle mb-2"><i className="fa-solid fa-cloud text-secondary fs-3"></i></div>
                <small className="vibrant-label d-block text-muted">Cloud Cover</small>
                <span className="vibrant-val d-block fs-4 fw-bold">72%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="km-card mb-4 shadow-sm">
        <h2 className="h5 fw-bold mb-3 text-primary-dark">
          <i className="fa-solid fa-calendar-week text-success me-2"></i>
          {t('forecast7Day', '7-Day Agricultural Weather Advisory')}
        </h2>
        <div id="forecast-grid">
          {weatherData?.forecast?.map((f, idx) => (
            <div key={idx} className="flex-grow-1" style={{ minWidth: '130px' }}>
              <div className="p-3 bg-light rounded-3 border text-center h-100 shadow-xs">
                <div className="fw-bold text-dark mb-1">{f.day}</div>
                <div className="fs-1 my-2">{f.icon}</div>
                <div className="fw-bold fs-5 text-dark">{f.temp}</div>
                <small className="text-muted d-block">{f.condition}</small>
                <div className="mt-2 pt-2 border-top small text-primary fw-medium">
                  <i className="fa-solid fa-droplet me-1"></i> Rain {f.rainProb}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
