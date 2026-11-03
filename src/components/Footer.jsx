import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t, currentLang } = useLanguage();

  return (
    <footer className="km-modern-footer">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* Brand & Mission Column */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img
                src="/assets/images/krishimitra_icon.png"
                alt="KrishiMitra AI Logo"
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
              <span className="fs-4 fw-bold text-white tracking-wide">
                {t('brandName', 'KrishiMitra AI')}
              </span>
            </div>
            <p className="text-white-50 small mb-3" style={{ lineHeight: '1.6' }}>
              {currentLang === 'ml'
                ? 'കേരളത്തിലെ കർഷകർക്കായുള്ള AI അസിസ്റ്റന്റ്. കേരള കാർഷിക സർവ്വകലാശാലയുടെ (KAU) വിവരങ്ങളും ശാസ്ത്രീയ വളപ്രയോഗങ്ങളും നിങ്ങളുടെ വിരൽത്തുമ്പിൽ.'
                : 'AI-Powered Personal Farming Assistant designed for Kerala farmers. Integrating Kerala Agricultural University (KAU) agronomic intelligence with hyper-local weather and mandi market analytics.'}
            </p>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-success-subtle text-success border border-success px-2 py-1 small">
                <i className="fa-solid fa-seedling me-1"></i> KAU Certified POP
              </span>
              <span className="badge bg-success-subtle text-success border border-success px-2 py-1 small">
                <i className="fa-solid fa-microphone me-1"></i> Malayalam Voice AI
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="col-lg-2 col-md-6 col-6">
            <h4 className="km-footer-heading">
              <i className="fa-solid fa-compass text-success"></i>
              <span>Navigation</span>
            </h4>
            <ul className="km-footer-links">
              <li><Link to="/"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navHome', 'Home')}</Link></li>
              <li><Link to="/dashboard"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navDashboard', 'Dashboard')}</Link></li>
              <li><Link to="/chatbot"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navChatbot', 'AI Assistant')}</Link></li>
              <li><Link to="/crop-disease"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navDisease', 'Crop Doctor')}</Link></li>
              <li><Link to="/crop-recommendation"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navCropRec', 'Crop Rec')}</Link></li>
              <li><Link to="/weather"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navWeather', 'Weather')}</Link></li>
              <li><Link to="/market"><i className="fa-solid fa-chevron-right text-success small"></i> {t('navMarket', 'Market Prices')}</Link></li>
            </ul>
          </div>

          {/* Agricultural Support & KAU Portals */}
          <div className="col-lg-3 col-md-6 col-6">
            <h4 className="km-footer-heading">
              <i className="fa-solid fa-book-open text-success"></i>
              <span>Agro Resources</span>
            </h4>
            <ul className="km-footer-links">
              <li>
                <a href="https://kau.in" target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-arrow-up-right-from-square text-success small"></i> Kerala Agri University (KAU)
                </a>
              </li>
              <li>
                <a href="http://karshikakeralam.gov.in" target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-arrow-up-right-from-square text-success small"></i> Karshika Information Portal
                </a>
              </li>
              <li>
                <a href="https://agricoop.nic.in" target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-arrow-up-right-from-square text-success small"></i> Dept of Agriculture Kerala
                </a>
              </li>
              <li>
                <span className="text-white-50 small d-block mt-2">
                  <i className="fa-solid fa-headset text-warning me-1"></i>
                  <strong>Kisan Call Centre:</strong>
                  <br />
                  <a href="tel:18001801551" className="text-warning text-decoration-none fw-bold">1800-180-1551 (Toll-Free)</a>
                </span>
              </li>
            </ul>
          </div>

          {/* District Coverage & Technology */}
          <div className="col-lg-3 col-md-6">
            <h4 className="km-footer-heading">
              <i className="fa-solid fa-layer-group text-success"></i>
              <span>Kerala Coverage</span>
            </h4>
            <p className="text-white-50 small mb-2">
              Serving farmers across all 14 agro-ecological districts from Kasaragod to Thiruvananthapuram.
            </p>
            <div className="p-3 bg-white-10 rounded-3 border border-white-10 text-white-50 small" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span>Vision AI Disease Scanner:</span>
                <strong className="text-white">Active</strong>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span>Malayalam RAG Engine:</span>
                <strong className="text-white">Online</strong>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <span>Daily Mandi Rates Sync:</span>
                <strong className="text-success">50+ Crops</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-3 border-top border-white-10 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-white-50" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div>
            © {new Date().getFullYear()} <strong>KrishiMitra AI</strong> (SIH25074 Prototype). Designed for Kerala Farmers.
          </div>
          <div className="d-flex gap-3">
            <span>References KAU Package of Practices (POP)</span>
            <span>•</span>
            <span>Smart India Hackathon</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
