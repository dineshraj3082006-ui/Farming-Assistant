import React, { createContext, useContext, useState, useEffect } from 'react';

export const GUEST_PROFILE = {
  name: "Kerala Farmer",
  mobile: "",
  district: "Thrissur",
  location: "Kerala Agro-Climatic Zone",
  farmSize: "0 acres",
  landArea: "0",
  mainCrop: "Paddy",
  mainCrops: "Paddy, Coconut, Banana",
  soilType: "Laterite Soil",
  waterAvailability: "Moderate",
  waterSource: "Open Well",
  language: "ml",
  email: "",
  autoVoice: true
};

export const DEFAULT_PROFILE = {
  name: "Raman Nair",
  mobile: "9876543210",
  district: "Thrissur",
  location: "Mannuthy, Thrissur",
  farmSize: "2.5 acres",
  landArea: "2.5",
  mainCrop: "Tomato",
  mainCrops: "Tomato, Paddy, Banana",
  soilType: "Laterite Soil",
  waterAvailability: "Moderate",
  waterSource: "Open Well & Canal",
  language: "ml",
  email: "raman.nair@keralafarm.in",
  autoVoice: true
};

const FarmerProfileContext = createContext();

export function FarmerProfileProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('krishimitra_logged_in') === 'true';
  });

  const [profile, setProfile] = useState(() => {
    const logged = localStorage.getItem('krishimitra_logged_in') === 'true';
    if (!logged) {
      return GUEST_PROFILE;
    }
    try {
      const stored = localStorage.getItem('krishimitra_profile');
      if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    } catch (e) {}
    return DEFAULT_PROFILE;
  });

  const [activeDiagnosis, setActiveDiagnosisState] = useState(() => {
    try {
      const storedDiag = localStorage.getItem('krishimitra_active_diagnosis');
      if (storedDiag) return JSON.parse(storedDiag);
    } catch (e) {}
    return null;
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((cur) => (cur && cur.message === message ? null : cur));
    }, 4000);
  };

  const updateProfile = async (newProfileData) => {
    const base = isLoggedIn ? profile : DEFAULT_PROFILE;
    const updated = { ...base, ...newProfileData };
    setProfile(updated);
    try {
      localStorage.setItem('krishimitra_profile', JSON.stringify(updated));

      // Save into registered accounts registry if mobile is present
      if (updated.mobile) {
        try {
          const accountsStr = localStorage.getItem('krishimitra_registered_accounts');
          const accounts = accountsStr ? JSON.parse(accountsStr) : {};
          accounts[updated.mobile] = updated;
          localStorage.setItem('krishimitra_registered_accounts', JSON.stringify(accounts));
        } catch (e) {}

        // Persist directly to MongoDB Atlas
        fetch('/api/farmer-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    }
    return updated;
  };

  const setActiveDiagnosis = (diagnosis) => {
    setActiveDiagnosisState(diagnosis);
    if (diagnosis) {
      localStorage.setItem('krishimitra_active_diagnosis', JSON.stringify(diagnosis));
      // Persist scan history to MongoDB Atlas
      const mobileToUse = profile?.mobile || '9876543210';
      fetch('/api/diagnosis-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileToUse, diagnosis })
      }).catch(() => {});
    } else {
      localStorage.removeItem('krishimitra_active_diagnosis');
    }
  };

  const login = (userData = {}) => {
    setIsLoggedIn(true);
    localStorage.setItem('krishimitra_logged_in', 'true');

    // For Demo user (9876543210), seed Raman Nair demo. For real/new users, seed clean profile:
    const isDemo = userData.mobile === '9876543210';
    const baseTemplate = isDemo ? DEFAULT_PROFILE : {
      name: userData.name || "Kerala Farmer",
      mobile: userData.mobile || "",
      district: userData.district || "Thrissur",
      location: userData.location || "Kerala Agro-Climatic Zone",
      farmSize: userData.farmSize || "2.0 acres",
      landArea: userData.landArea || "2.0",
      mainCrop: userData.mainCrop || userData.crop || "Paddy",
      mainCrops: userData.mainCrops || `${userData.mainCrop || userData.crop || "Paddy"}, Vegetables`,
      soilType: userData.soilType || userData.soil || "Laterite Soil",
      waterAvailability: "Moderate",
      waterSource: "Open Well",
      language: "ml",
      email: userData.email || "",
      autoVoice: true
    };

    let fullUser = { ...baseTemplate, ...userData };

    // Check if user previously registered with this mobile in localStorage
    if (userData.mobile) {
      try {
        const accountsStr = localStorage.getItem('krishimitra_registered_accounts');
        const accounts = accountsStr ? JSON.parse(accountsStr) : {};
        if (accounts[userData.mobile]) {
          fullUser = { ...fullUser, ...accounts[userData.mobile], ...userData };
        }
      } catch (e) {}

      // Retrieve existing profile from MongoDB Atlas database
      fetch(`/api/farmer-profile?mobile=${encodeURIComponent(userData.mobile)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.profile) {
            // Found existing user in Atlas - load their stored details!
            const merged = { ...fullUser, ...data.profile };
            setProfile(merged);
            localStorage.setItem('krishimitra_profile', JSON.stringify(merged));
          } else {
            // First time seeing this mobile in Atlas - create their new document!
            fetch('/api/farmer-profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fullUser)
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    setProfile(fullUser);
    localStorage.setItem('krishimitra_profile', JSON.stringify(fullUser));

    // Also persist to registered accounts
    if (fullUser.mobile) {
      try {
        const accountsStr = localStorage.getItem('krishimitra_registered_accounts');
        const accounts = accountsStr ? JSON.parse(accountsStr) : {};
        accounts[fullUser.mobile] = fullUser;
        localStorage.setItem('krishimitra_registered_accounts', JSON.stringify(accounts));
      } catch (e) {}
    }
    return fullUser;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('krishimitra_logged_in');
    localStorage.removeItem('krishimitra_profile');
    localStorage.removeItem('krishimitra_active_diagnosis');
    setProfile(GUEST_PROFILE); // Reset in-memory details to clean Guest
    setActiveDiagnosisState(null);
    showToast('Logged out successfully. Details reset.', 'info');
  };

  return (
    <FarmerProfileContext.Provider
      value={{
        profile,
        updateProfile,
        activeDiagnosis,
        setActiveDiagnosis,
        isLoggedIn,
        login,
        logout,
        toast,
        showToast
      }}
    >
      {children}
      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`toast show align-items-center border-0 shadow-lg ${
              toast.type === 'danger'
                ? 'bg-danger text-white'
                : toast.type === 'warning'
                ? 'bg-warning text-dark'
                : 'bg-success text-white'
            }`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body fw-medium">
                <i
                  className={`fa-solid me-2 ${
                    toast.type === 'danger'
                      ? 'fa-triangle-exclamation'
                      : toast.type === 'warning'
                      ? 'fa-circle-exclamation'
                      : 'fa-circle-check'
                  }`}
                ></i>
                {toast.message}
              </div>
              <button
                type="button"
                className={`btn-close me-2 m-auto ${toast.type !== 'warning' ? 'btn-close-white' : ''}`}
                onClick={() => setToast(null)}
              ></button>
            </div>
          </div>
        </div>
      )}
    </FarmerProfileContext.Provider>
  );
}

export function useFarmerProfile() {
  const context = useContext(FarmerProfileContext);
  if (!context) {
    throw new Error('useFarmerProfile must be used within a FarmerProfileProvider');
  }
  return context;
}

