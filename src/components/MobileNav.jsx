import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function MobileNav() {
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {/* Mobile Services Drawer Sheet Backdrop */}
      <div
        id="mobileServicesBackdrop"
        className={`mobile-services-backdrop ${drawerOpen ? 'show' : ''}`}
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
        style={{
          display: drawerOpen ? 'block' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1040,
          backdropFilter: 'blur(3px)'
        }}
      >
        <div
          className="mobile-services-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="KrishiMitra Services"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-sheet-handle"></div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h6 fw-bold text-primary-dark mb-0">
              <i className="fa-solid fa-shapes text-success me-2"></i>KrishiMitra Services
            </h3>
            <button
              type="button"
              className="btn-close"
              aria-label="Close services sheet"
              onClick={closeDrawer}
            ></button>
          </div>

          <div className="mobile-sheet-grid">
            <NavLink to="/" end className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-house"></i></div>
              <span className="mobile-sheet-label">{t('navHome', 'Home')}</span>
            </NavLink>
            <NavLink to="/dashboard" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-gauge-high"></i></div>
              <span className="mobile-sheet-label">{t('navDashboard', 'Dashboard')}</span>
            </NavLink>
            <NavLink to="/chatbot" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-robot"></i></div>
              <span className="mobile-sheet-label">{t('askAI', 'Ask AI')}</span>
            </NavLink>
            <NavLink to="/crop-disease" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-bug"></i></div>
              <span className="mobile-sheet-label">{t('navDisease', 'Doctor')}</span>
            </NavLink>
            <NavLink to="/crop-recommendation" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-seedling"></i></div>
              <span className="mobile-sheet-label">{t('navCropRec', 'Crop Rec')}</span>
            </NavLink>
            <NavLink to="/weather" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-cloud-sun-rain"></i></div>
              <span className="mobile-sheet-label">{t('navWeather', 'Weather')}</span>
            </NavLink>
            <NavLink to="/market" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-store"></i></div>
              <span className="mobile-sheet-label">{t('navMarket', 'Market')}</span>
            </NavLink>
            <NavLink to="/profile" className="mobile-sheet-card text-decoration-none" onClick={closeDrawer}>
              <div className="mobile-sheet-icon"><i className="fa-solid fa-user-gear"></i></div>
              <span className="mobile-sheet-label">{t('navProfile', 'My Farm')}</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-house"></i>
          <span>{t('navHome', 'Home')}</span>
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-gauge-high"></i>
          <span>{t('navDashboard', 'Dashboard')}</span>
        </NavLink>
        <NavLink to="/chatbot" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-robot"></i>
          <span>{t('askAI', 'Ask AI')}</span>
        </NavLink>
        <NavLink to="/crop-disease" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fa-solid fa-bug"></i>
          <span>{t('navDisease', 'Doctor')}</span>
        </NavLink>
        <button
          type="button"
          className="mobile-nav-item border-0 bg-transparent"
          aria-label="Open More Services"
          onClick={() => setDrawerOpen(true)}
        >
          <i className="fa-solid fa-ellipsis"></i>
          <span>More</span>
        </button>
      </div>
    </>
  );
}
