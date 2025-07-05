
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { ChevronDownIcon } from './Icons';

interface LanguageSwitcherProps {
  allowedLanguages?: Language[];
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ allowedLanguages }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const allLanguages: Record<Language, { name: string; flag: string, nativeName: string }> = {
    en: { name: 'EN', flag: '🇬🇧', nativeName: 'English' },
    nl: { name: 'NL', flag: '🇳🇱', nativeName: 'Nederlands' },
    fr: { name: 'FR', flag: '🇫🇷', nativeName: 'Français' },
    es: { name: 'ES', flag: '🇪🇸', nativeName: 'Español' },
    ar: { name: 'AR', flag: '🇸🇦', nativeName: 'العربية' },
  };

  const languagesToShow = useMemo(() => {
    if (allowedLanguages && allowedLanguages.length > 0) {
      return allowedLanguages;
    }
    return Object.keys(allLanguages) as Language[];
  }, [allowedLanguages]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('language')}
      >
        <span className="text-xl leading-none" role="img" aria-label={`${language} flag`}>{allLanguages[language].flag}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform text-neutral-600 dark:text-neutral-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute end-0 mt-2 w-40 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-50 border border-neutral-200 dark:border-neutral-700"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu-button"
        >
          {languagesToShow.map(lang => (
            <button
                key={lang}
                type="button"
                onClick={() => selectLanguage(lang)}
                className="w-full text-start flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                role="menuitem"
            >
                <span className="text-lg" role="img" aria-label={`${allLanguages[lang].nativeName} flag`}>{allLanguages[lang].flag}</span>
                <span>{allLanguages[lang].nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
