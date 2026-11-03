import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerProfile } from '../context/FarmerProfileContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { currentLang, toggleLanguage, t } = useLanguage();
  const { isLoggedIn, logout, profile } = useFarmerProfile();
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

  const handleLogout = () => {
    logout();
    closeNav();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/" onClick={closeNav}>
          <img src="/assets/images/krishimitra_icon.png" alt="KrishiMitra AI Logo" className="navbar-brand-logo" />
          <span className="fw-bold">{t('brandName', 'KrishiMitra AI')}</span>
        </Link>

        {/* Right side controls: Language toggle, User profile/login, and Hamburger */}
        <div className="d-flex align-items-center gap-2 order-lg-last">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="btn btn-lang-toggle d-inline-flex align-items-center gap-2"
            aria-label="Switch Language"
          >
            <i className="fa-solid fa-language fs-5"></i>
            <span className="fw-semibold">{currentLang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>

          {/* Login or My Farm & Logout */}
          {isLoggedIn ? (
            <div className="d-none d-sm-inline-flex align-items-center gap-2">
              <NavLink to="/profile" className="btn btn-km-outline btn-sm" onClick={closeNav}>
                <i className="fa-solid fa-user-gear me-1"></i>
                <span>{profile.name?.split(' ')[0] || t('navProfile', 'My Farm')}</span>
              </NavLink>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleLogout}
                title={t('navLogout', 'Logout')}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-km-outline btn-sm d-none d-sm-inline-flex" onClick={closeNav}>
              <i className="fa-solid fa-user me-1"></i>
              <span>{t('navLogin', 'Farmer Login')}</span>
            </NavLink>
          )}

          {/* Responsive Hamburger Toggle */}
          <button
            className={`navbar-toggler ${navOpen ? '' : 'collapsed'}`}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        {/* Nav Links */}
        <div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto me-3 py-2 py-lg-0">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-house me-1 d-lg-none"></i>
                <span>{t('navHome', 'Home')}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-gauge-high me-1 d-lg-none"></i>
                <span>{t('navDashboard', 'Dashboard')}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/chatbot" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-robot me-1 d-lg-none"></i>
                <span>{t('navChatbot', 'AI Assistant')}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/crop-disease" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-bug me-1 d-lg-none"></i>
                <span>{t('navDisease', 'Crop Doctor')}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/crop-recommendation" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-seedling me-1 d-lg-none"></i>
                <span>{t('navCropRec', 'Crop Rec')}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/weather" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-cloud-sun-rain me-1 d-lg-none"></i>
                <span>{t('navWeather', 'Weather')}</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                <i className="fa-solid fa-store me-1 d-lg-none"></i>
                <span>{t('navMarket', 'Market Prices')}</span>
              </NavLink>
            </li>
            
            {/* Mobile-only login/profile link in collapse */}
            <li className="nav-item d-sm-none border-top pt-2 mt-2">
              {isLoggedIn ? (
                <div className="d-flex justify-content-between align-items-center">
                  <NavLink to="/profile" className="nav-link py-1" onClick={closeNav}>
                    <i className="fa-solid fa-user-gear me-2"></i> {t('navProfile', 'My Farm')} ({profile.name?.split(' ')[0]})
                  </NavLink>
                  <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={handleLogout}>
                    {t('navLogout', 'Logout')}
                  </button>
                </div>
              ) : (
                <NavLink to="/login" className="nav-link text-success fw-bold py-1" onClick={closeNav}>
                  <i className="fa-solid fa-user me-2"></i> {t('navLogin', 'Farmer Login')}
                </NavLink>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
