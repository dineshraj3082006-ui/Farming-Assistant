import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t, currentLang } = useLanguage();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <header className="hero-section position-relative overflow-hidden">
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-4">
            <div className="col-lg-7 fade-in-up">
              <div className="hero-badge hero-badge-animated">
                <i className="fa-solid fa-sparkles text-warning"></i>
                <span>{t('poweredByAI', 'Powered by AI • Designed for Kerala Farmers')}</span>
              </div>
              
              <h1 className="display-4 fw-extrabold mb-3">
                {t('heroTitle', 'Your AI-Powered Farming Assistant')}
              </h1>
              
              <p className="lead fs-5 mb-4 text-white-90" style={{ maxWidth: '640px' }}>
                {t('heroSubtitle', 'Smart farming guidance for every Kerala farmer.')}
              </p>
              
              {/* Primary Call-to-Actions */}
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link to="/dashboard" className="btn btn-km-primary btn-lg w-100 w-sm-auto shadow-sm">
                  {t('getStarted', 'Get Started')} <i className="fa-solid fa-arrow-right ms-2"></i>
                </Link>
                <Link to="/chatbot" className="btn btn-km-outline text-white border-white btn-lg w-100 w-sm-auto">
                  <i className="fa-solid fa-robot me-2"></i> {t('askAI', 'Ask AI Assistant')}
                </Link>
                <Link to="/crop-disease" className="btn btn-outline-light btn-lg w-100 w-sm-auto d-none d-md-inline-flex align-items-center">
                  <i className="fa-solid fa-camera me-2"></i> Scan Crop
                </Link>
              </div>

              {/* Kerala Agro Stats Pill Bar */}
              <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
                <div className="hero-stat-pill">
                  <i className="fa-solid fa-seedling text-success fs-4"></i>
                  <div>
                    <div className="hero-stat-num">50+</div>
                    <div className="hero-stat-desc">Mandi Crops Tracked</div>
                  </div>
                </div>

                <div className="hero-stat-pill">
                  <i className="fa-solid fa-cloud-bolt text-warning fs-4"></i>
                  <div>
                    <div className="hero-stat-num">14</div>
                    <div className="hero-stat-desc">Kerala Districts Weather</div>
                  </div>
                </div>

                <div className="hero-stat-pill">
                  <i className="fa-solid fa-microphone-lines text-info fs-4"></i>
                  <div>
                    <div className="hero-stat-num">24/7</div>
                    <div className="hero-stat-desc">Malayalam Voice AI</div>
                  </div>
                </div>

                <div className="hero-stat-pill">
                  <i className="fa-solid fa-microscope text-primary fs-4"></i>
                  <div>
                    <div className="hero-stat-num">94%</div>
                    <div className="hero-stat-desc">KAU Verified Diagnostic</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Hero Image with Floating Animation */}
            <div className="col-lg-5 text-center">
              <div className="position-relative d-inline-block">
                <img
                  src="/assets/images/kerala_farmer_hero.png"
                  alt="Kerala Farmer holding AI Assistant app"
                  className="hero-img img-fluid motion-float"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Showcase Section */}
      <section className="features-showcase-section py-5" id="features">
        <div className="container">
          <div className="text-center max-w-800 mx-auto mb-5">
            <h2 className="features-showcase-heading fw-bold">{t('featuresHeading', 'Smart Farming. Better Future.')}</h2>
            <p className="features-showcase-subheading text-muted fs-5">
              {t('featuresSubheading', 'Empowering farmers with artificial intelligence, local weather advisory, and real-time market insights.')}
            </p>
          </div>

          <div className="row g-4">
            {/* Feature 1: AI Farming Assistant (Green) */}
            <div className="col-md-6 col-lg-4">
              <div className="feature-card feature-card-green h-100 d-flex flex-column">
                <div className="feature-card-icon-box">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <h3 className="feature-card-title">{t('feature1Title', 'AI Farming Assistant')}</h3>
                <p className="feature-card-desc flex-grow-1">{t('feature1Desc', 'Interactive 24/7 farming guide answering your crop queries in Malayalam & English.')}</p>
                <Link to="/chatbot" className="feature-card-btn text-decoration-none mt-auto">
                  {t('explore', 'Explore')} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            {/* Feature 2: Crop Recommendation (Blue) */}
            <div className="col-md-6 col-lg-4">
              <div className="feature-card feature-card-blue h-100 d-flex flex-column">
                <div className="feature-card-icon-box">
                  <i className="fa-solid fa-seedling"></i>
                </div>
                <h3 className="feature-card-title">{t('feature2Title', 'Crop Recommendation')}</h3>
                <p className="feature-card-desc flex-grow-1">{t('feature2Desc', 'Data-driven crop selection based on soil type, district, season & water availability.')}</p>
                <Link to="/crop-recommendation" className="feature-card-btn text-decoration-none mt-auto">
                  {t('explore', 'Explore')} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            {/* Feature 3: Plant Disease Detection (Orange) */}
            <div className="col-md-6 col-lg-4">
              <div className="feature-card feature-card-orange h-100 d-flex flex-column">
                <div className="feature-card-icon-box">
                  <i className="fa-solid fa-bug"></i>
                </div>
                <h3 className="feature-card-title">{t('feature3Title', 'Plant Disease Detection')}</h3>
                <p className="feature-card-desc flex-grow-1">{t('feature3Desc', 'Instant diagnosis of plant leaf diseases with actionable treatment advice.')}</p>
                <Link to="/crop-disease" className="feature-card-btn text-decoration-none mt-auto">
                  {t('explore', 'Explore')} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            {/* Feature 4: Weather Alerts (Purple) */}
            <div className="col-md-6 col-lg-4">
              <div className="feature-card feature-card-purple h-100 d-flex flex-column">
                <div className="feature-card-icon-box">
                  <i className="fa-solid fa-cloud-sun-rain"></i>
                </div>
                <h3 className="feature-card-title">{t('feature4Title', 'Weather Alerts')}</h3>
                <p className="feature-card-desc flex-grow-1">{t('feature4Desc', 'Hyper-local weather warnings and irrigation advisories tailored for Kerala districts.')}</p>
                <Link to="/weather" className="feature-card-btn text-decoration-none mt-auto">
                  {t('explore', 'Explore')} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            {/* Feature 5: Market Price Insights (Teal) */}
            <div className="col-md-6 col-lg-4">
              <div className="feature-card feature-card-teal h-100 d-flex flex-column">
                <div className="feature-card-icon-box">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <h3 className="feature-card-title">{t('feature5Title', 'Market Price Insights')}</h3>
                <p className="feature-card-desc flex-grow-1">{t('feature5Desc', 'Compare live market prices across Kerala mandis with trend analytics.')}</p>
                <Link to="/market" className="feature-card-btn text-decoration-none mt-auto">
                  {t('explore', 'Explore')} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            {/* Feature 6: Malayalam Voice Assistant (Pink/Rose) */}
            <div className="col-md-6 col-lg-4">
              <div className="feature-card feature-card-rose h-100 d-flex flex-column">
                <div className="feature-card-icon-box">
                  <i className="fa-solid fa-microphone"></i>
                </div>
                <h3 className="feature-card-title">{t('feature6Title', 'Malayalam Voice Assistant')}</h3>
                <p className="feature-card-desc flex-grow-1">{t('feature6Desc', 'Speak directly in Malayalam for effortless hands-free farming help.')}</p>
                <Link to="/chatbot" className="feature-card-btn text-decoration-none mt-auto">
                  {t('explore', 'Explore')} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Flow Section: How KrishiMitra Works */}
      <section className="py-5 arch-section" id="how-it-works">
        <div className="container text-center">
          <h2 className="display-6 fw-bold mb-3 arch-heading">{t('archTitle', 'How KrishiMitra Works')}</h2>
          <p className="arch-subheading mb-5 text-muted">Intelligent workflow connecting Kerala farmers with AI analysis and agricultural expertise</p>
          
          <div className="arch-timeline d-flex flex-wrap justify-content-center align-items-center gap-2">
            {/* Step 1 */}
            <div className="arch-card arch-card-green">
              <div className="arch-icon-box"><i className="fa-solid fa-user-gear"></i></div>
              <h4 className="arch-card-title">{t('archStep1', 'Farmer Input')}</h4>
            </div>
            <div className="arch-arrow d-none d-md-block"><i className="fa-solid fa-chevron-right"></i></div>

            {/* Step 2 */}
            <div className="arch-card arch-card-blue">
              <div className="arch-icon-box"><i className="fa-solid fa-brain"></i></div>
              <h4 className="arch-card-title">{t('archStep2', 'AI Analysis Engine')}</h4>
            </div>
            <div className="arch-arrow d-none d-md-block"><i className="fa-solid fa-chevron-right"></i></div>

            {/* Step 3 */}
            <div className="arch-card arch-card-teal">
              <div className="arch-icon-box"><i className="fa-solid fa-cloud-showers-water"></i></div>
              <h4 className="arch-card-title">{t('archStep3', 'Weather & Soil Data')}</h4>
            </div>
            <div className="arch-arrow d-none d-md-block"><i className="fa-solid fa-chevron-right"></i></div>

            {/* Step 4 */}
            <div className="arch-card arch-card-orange">
              <div className="arch-icon-box"><i className="fa-solid fa-lightbulb"></i></div>
              <h4 className="arch-card-title">{t('archStep4', 'Smart Advisory')}</h4>
            </div>
            <div className="arch-arrow d-none d-md-block"><i className="fa-solid fa-chevron-right"></i></div>

            {/* Step 5 */}
            <div className="arch-card arch-card-purple">
              <div className="arch-icon-box"><i className="fa-solid fa-wheat-awn"></i></div>
              <h4 className="arch-card-title">{t('archStep5', 'Farmer Action')}</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Bottom CTA Banner */}
      <section className="py-5 bg-gradient-green text-white position-relative overflow-hidden my-4 rounded-4 mx-3 mx-md-4 shadow-lg">
        <div className="container text-center py-3 position-relative" style={{ zIndex: 2 }}>
          <span className="badge bg-white text-success px-3 py-2 fw-bold mb-3 shadow-xs">
            <i className="fa-solid fa-wand-magic-sparkles me-1"></i>
            {currentLang === 'ml' ? 'സ്മാർട്ട് കൃഷി ആരംഭിക്കൂ' : 'Start Farming Smarter Today'}
          </span>
          <h2 className="display-6 fw-bold mb-3 text-white">
            {currentLang === 'ml'
              ? 'നിങ്ങളുടെ കൃഷിയിടത്തിന് AI കരുത്ത് പകരൂ'
              : 'Empower Your Farm with Kerala\'s #1 AI Farming Assistant'}
          </h2>
          <p className="lead text-white-90 max-w-700 mx-auto mb-4 fs-6">
            {currentLang === 'ml'
              ? 'സൗജന്യമായി രജിസ്റ്റർ ചെയ്ത് രോഗനിർണയവും പ്രാദേശിക കാലാവസ്ഥയും തത്സമയ വിപണി വിലയും അറിയാം.'
              : 'Sign in to access personalized crop health prescriptions, localized rainfall radar, and wholesale mandi price insights.'}
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link to="/crop-disease" className="btn btn-light text-success btn-lg fw-bold shadow-sm px-4">
              <i className="fa-solid fa-camera me-2"></i> Try Crop Doctor
            </Link>
            <Link to="/chatbot" className="btn btn-outline-light btn-lg px-4">
              <i className="fa-solid fa-comments me-2"></i> Ask KrishiMitra AI
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
