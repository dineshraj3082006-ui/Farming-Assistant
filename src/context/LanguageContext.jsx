import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('krishimitra_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('krishimitra_lang', currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'en' ? 'ml' : 'en'));
  };

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'ml') {
      setCurrentLang(lang);
    }
  };

  const t = (key, fallback = '') => {
    const langDict = translations[currentLang] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

