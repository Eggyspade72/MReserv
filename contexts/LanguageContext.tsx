import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations, TranslationKey, Language, LocaleTranslations } from '../translations';

// Overloaded function type for `t`. This is the most explicit structure.
// 1. Handle the specific case for 'days', which returns an object.
// 2. Handle all other known keys, which return a string.
// TypeScript will check these signatures from top to bottom.
interface TFunction {
  (key: 'days'): { [key: string]: string };
  (key: Exclude<TranslationKey, 'days'>, params?: Record<string, string | number>): string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// The core translation logic, separated for clarity.
const tImplementation = (
  key: TranslationKey, 
  language: Language, 
  params?: Record<string, string | number>
): string | { [key: string]: string } => {
  const langTranslations = translations[language] as LocaleTranslations;
  const fallbackTranslations = translations.en as LocaleTranslations;

  // Use a type assertion to safely access properties on the translation objects.
  const value = (langTranslations as any)[key] || (fallbackTranslations as any)[key] || key;
  
  if (typeof value === 'string') {
    if (params) {
      let tempValue = value;
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        tempValue = tempValue.replace(regex, String(params[paramKey]));
      });
      return tempValue;
    }
  }
  return value;
};


export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    return storedLang && ['en', 'nl', 'fr', 'es', 'ar'].includes(storedLang) ? storedLang : 'nl'; // Default to Dutch
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('appLanguage', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
    // The cast here tells TypeScript to trust that our implementation
    // correctly adheres to the overloaded TFunction interface.
    return tImplementation(key, language, params);
  }, [language]) as TFunction;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Re-export 'Language' type for external usage.
export type { Language };