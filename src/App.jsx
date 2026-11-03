import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { FarmerProfileProvider, useFarmerProfile } from './context/FarmerProfileContext';
import { VoiceProvider } from './context/VoiceContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import VoiceModal from './components/VoiceModal';

// Code-split pages for faster load performance
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const CropDisease = lazy(() => import('./pages/CropDisease'));
const CropRecommendation = lazy(() => import('./pages/CropRecommendation'));
const Weather = lazy(() => import('./pages/Weather'));
const Market = lazy(() => import('./pages/Market'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5 my-5" style={{ minHeight: '50vh' }}>
      <div className="text-center">
        <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading KrishiMitra...</span>
        </div>
        <div className="fw-semibold text-secondary">Loading KrishiMitra...</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useFarmerProfile();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <FarmerProfileProvider>
        <VoiceProvider>
          <Router>
            <div className="d-flex flex-column min-vh-100">
              <Navbar />
              <main className="flex-grow-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes - Accessible only after login */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crop-disease"
                      element={
                        <ProtectedRoute>
                          <CropDisease />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crop-recommendation"
                      element={
                        <ProtectedRoute>
                          <CropRecommendation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/weather"
                      element={
                        <ProtectedRoute>
                          <Weather />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/market"
                      element={
                        <ProtectedRoute>
                          <Market />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chatbot"
                      element={
                        <ProtectedRoute>
                          <Chatbot />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legacy redirects */}
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login.html" element={<Navigate to="/login" replace />} />
                    <Route path="/crop-disease.html" element={<Navigate to="/crop-disease" replace />} />
                    <Route path="/crop-recommendation.html" element={<Navigate to="/crop-recommendation" replace />} />
                    <Route path="/weather.html" element={<Navigate to="/weather" replace />} />
                    <Route path="/market.html" element={<Navigate to="/market" replace />} />
                    <Route path="/chatbot.html" element={<Navigate to="/chatbot" replace />} />
                    <Route path="/profile.html" element={<Navigate to="/profile" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <MobileNav />
              <VoiceModal />
            </div>
          </Router>
        </VoiceProvider>
      </FarmerProfileProvider>
    </LanguageProvider>
  );
}
