


import React, { useState, useRef, useEffect } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { useLanguage } from '../contexts/LanguageContext';
import { Barber } from '../types';
import { ChevronDownIcon, LoginIcon, LogoutIcon, UserCircleIcon } from './Icons';

type AppSession = {
    auth: SupabaseSession;
    profile: Barber | null; // For barbers
    isOwner: boolean;
} | null;

interface AuthMenuProps {
  session: AppSession;
  onLogout: () => void;
  onLoginClick: () => void;
}

const AuthMenu: React.FC<AuthMenuProps> = ({ session, onLogout, onLoginClick }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const closeMenu = () => setIsOpen(false);

  if (!session) {
    return (
        <button
            onClick={onLoginClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md transition-colors text-sm font-medium"
            aria-label={t('loginButton')}
        >
            <LoginIcon className="w-5 h-5" />
            <span>{t('loginButton')}</span>
        </button>
    )
  }

  const name = session.isOwner 
    ? session.auth.user.user_metadata.name || 'Owner'
    : session.profile?.name.split(' ')[0] || 'Barber';

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <UserCircleIcon className="w-5 h-5 text-primary"/>
        <span className="text-sm font-medium hidden sm:inline">{t('welcomeMessage', { name: name || '' })}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform text-neutral-600 dark:text-neutral-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute end-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-50 border border-neutral-200 dark:border-neutral-700"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{session.isOwner ? 'Super Admin' : session.profile?.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{session.auth.user.email}</p>
          </div>
          <button
            onClick={() => { onLogout(); closeMenu(); }}
            className="w-full text-start flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            role="menuitem"
          >
            <LogoutIcon className="w-5 h-5"/>
            <span>{t('logoutButton')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthMenu;
