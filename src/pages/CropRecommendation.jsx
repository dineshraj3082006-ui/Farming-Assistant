import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerProfile } from '../context/FarmerProfileContext';
import { ApiService } from '../services/api';

export default function CropRecommendation() {
  const { t } = useLanguage();
  const { profile, showToast } = useFarmerProfile();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  const [formData, setFormData] = useState({
    district: profile.district || 'Thrissur',
    soilType: profile.soilType || 'Laterite Soil',
    season: 'Virippu (Kharif)',
    landArea: profile.landArea || '2.5',
    waterAvailability: profile.waterAvailability || 'High',
    previousCrop: 'Paddy'
  });

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecommendations(null);

    try {
      const data = await ApiService.getCropRecommendations(formData);
      setRecommendations(data.recommendations || []);
      showToast('AI Recommendations calculated!', 'success');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      showToast('Error calculating recommendations.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="text-center max-w-700 mx-auto mb-4">
        <h1 className="display-6 fw-bold page-header-title mb-2">{t('recTitle', 'Smart Crop Recommendation')}</h1>
        <p className="page-header-subtitle fs-5 text-muted">
          {t('recSubtitle', 'Enter your farm parameters to get AI-calculated crop suitability scores')}
        </p>
      </div>

      {/* Input Form Card */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-10">
          <div className="km-card shadow-sm">
            <form id="crop-rec-form" onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* District */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    <i className="fa-solid fa-location-dot text-success me-1"></i> {t('districtSelect', 'District')}
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  >
                    {['Thrissur', 'Palakkad', 'Wayanad', 'Alappuzha', 'Ernakulam', 'Idukki', 'Kottayam', 'Kozhikode', 'Malappuram', 'Kannur', 'Kasaragod', 'Kollam', 'Pathanamthitta', 'Thiruvananthapuram'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Soil Type */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    <i className="fa-solid fa-mountain text-success me-1"></i> {t('soilSelect', 'Soil Type')}
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  >
                    <option value="Laterite Soil">Laterite Soil (ലാറ്ററൈറ്റ് മണ്ണ്)</option>
                    <option value="Alluvial Soil">Alluvial Soil (എക്കൽ മണ്ണ്)</option>
                    <option value="Red Soil">Red Soil (ചെമ്മണ്ണ്)</option>
                    <option value="Black Soil">Black Soil (കരിമണ്ണ്)</option>
                    <option value="Coastal Sandy">Coastal Sandy (തീരദേശ പൂഴി)</option>
                  </select>
                </div>

                {/* Season */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    <i className="fa-solid fa-calendar text-success me-1"></i> {t('seasonSelect', 'Season')}
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  >
                    <option value="Virippu (Kharif)">Virippu / Kharif (വിരിപ്പ് - മെയ്-സെപ്റ്റംബർ)</option>
                    <option value="Mundakan (Rabi)">Mundakan / Rabi (മുണ്ടകൻ - ഒക്ടോബർ-ജനുവരി)</option>
                    <option value="Puncha (Summer)">Puncha / Summer (പുഞ്ച - ജനുവരി-മേയ്)</option>
                  </select>
                </div>

                {/* Land Area */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    <i className="fa-solid fa-ruler-combined text-success me-1"></i> {t('landArea', 'Land Area (Acres)')}
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    step="any"
                    min="0.01"
                    placeholder="2.5"
                    value={formData.landArea}
                    onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                  />
                </div>

                {/* Water Availability */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    <i className="fa-solid fa-droplet text-success me-1"></i> {t('waterAvail', 'Water Availability')}
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.waterAvailability}
                    onChange={(e) => setFormData({ ...formData, waterAvailability: e.target.value })}
                  >
                    <option value="High">High (Canal / River / Continuous Well)</option>
                    <option value="Moderate">Moderate (Seasonal Irrigation)</option>
                    <option value="Low">Low (Purely Rainfed)</option>
                  </select>
                </div>

                {/* Previous Crop */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    <i className="fa-solid fa-rotate text-success me-1"></i> {t('prevCrop', 'Previous Crop')}
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.previousCrop}
                    onChange={(e) => setFormData({ ...formData, previousCrop: e.target.value })}
                  >
                    <option value="Paddy">Paddy (നെല്ല്)</option>
                    <option value="Banana">Banana (വാഴ)</option>
                    <option value="Vegetables">Vegetables (പച്ചക്കറികൾ)</option>
                    <option value="Legumes">Legumes / Pulses (പയർ വർഗ്ഗങ്ങൾ)</option>
                    <option value="Fallow">Fallow Land (തരിശ്)</option>
                  </select>
                </div>
              </div>

              <div className="text-center mt-4 pt-3 border-top">
                <button type="submit" className="btn btn-km-primary btn-lg px-5 w-100 w-md-auto shadow-sm">
                  {t('getRecBtn', 'Get AI Recommendation')} <i className="fa-solid fa-wand-magic-sparkles ms-2"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Loading Box */}
      {loading && (
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8">
            <div className="km-card text-center p-4 bg-light border-0 shadow-sm">
              <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h2 className="h5 fw-bold text-primary-dark mb-1">Calculating Best Crop Suitability...</h2>
              <p className="text-muted small mb-0">Analyzing Kerala soil, climate, water levels & market viability...</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Results */}
      {recommendations && (
        <div ref={resultsRef} className="row justify-content-center">
          <div className="col-lg-10">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
              <h2 className="h3 fw-bold mb-0 text-primary-dark">{t('recResultsTitle', 'Recommended Crops for Your Farm')}</h2>
              <span className="badge bg-success px-3 py-2 fs-6">
                <i className="fa-solid fa-circle-check me-1"></i> AI Calculated Suitability
              </span>
            </div>

            <div className="row g-4">
              {recommendations.map((item, idx) => (
                <div key={idx} className="col-md-6 col-lg-4">
                  <div className="km-card km-crop-card h-100 d-flex flex-column border-top border-4 border-success shadow-sm">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                      <span className="badge bg-light text-dark border text-wrap">{item.category}</span>
                      <span className="badge bg-success crop-suitability-badge flex-shrink-0">{item.suitability}% Match</span>
                    </div>

                    <h3 className="crop-card-title fw-bold text-primary-dark mb-2">{item.crop}</h3>

                    {/* Metadata Grid */}
                    <div className="crop-meta-grid mb-3">
                      <div className="crop-meta-item">
                        <i className="fa-regular fa-clock text-success"></i>
                        <span className="crop-meta-label">{t('growingPeriod', 'Duration')}:</span>
                        <span className="crop-meta-val">{item.duration}</span>
                      </div>
                      <div className="crop-meta-item">
                        <i className="fa-solid fa-droplet text-info"></i>
                        <span className="crop-meta-label">{t('waterReq', 'Water')}:</span>
                        <span className="crop-meta-val">{item.waterNeed}</span>
                      </div>
                      <div className="crop-meta-item" style={{ gridColumn: 'span 2' }}>
                        <i className="fa-solid fa-chart-line text-primary"></i>
                        <span className="crop-meta-label">Expected Yield:</span>
                        <span className="crop-meta-val">{item.expectedYield}</span>
                      </div>
                    </div>

                    {/* KAU Fertilizer Advisory Box */}
                    <div className="crop-kau-box bg-light rounded border small mb-3 flex-grow-1">
                      <strong className="d-block text-dark mb-1">
                        <i className="fa-solid fa-flask text-success me-1"></i>
                        KAU Fertilizer Advice:
                      </strong>
                      <span className="text-secondary">{item.fertilizer}</span>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success w-100"
                        onClick={() => navigate(`/chatbot?query=${encodeURIComponent(`Tell me the package of practices, nursery management and planting steps for ${item.crop} in ${formData.district}.`)}`)}
                      >
                        <i className="fa-solid fa-robot me-1"></i> Ask AI Planting Guide
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
