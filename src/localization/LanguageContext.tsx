import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Direction, translations, Translations } from './translations';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'm737_app_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'ar'; // Default Arabic
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    
    // Update document title accordingly
    if (language === 'ar') {
      document.title = 'M737 — مجمع الطب الأول بالعراق';
    } else {
      document.title = 'M737 — Premier Iraqi Medical Platform';
    }
  }, [language, direction]);

  const value: LanguageContextType = {
    language,
    direction,
    t: translations[language],
    setLanguage,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
