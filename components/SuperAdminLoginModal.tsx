
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, UserCircleIcon, LockClosedIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SuperAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAttempt: (username: string, passwordHash: string) => void;
  error: string;
}

const SuperAdminLoginModal: React.FC<SuperAdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginAttempt,
  error,
}) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginAttempt(username, password); 
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="super-admin-login-title"
    >
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 id="super-admin-login-title" className="text-2xl font-semibold text-red-500 flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2" /> {t('superAdminLoginTitle')}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" aria-label={t('ariaCloseLoginModal')}>
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="superAdminUsername" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('usernameLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircleIcon className="w-5 h-5 text-neutral-400" />
              </div>
              <input
                type="text"
                id="superAdminUsername"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-red-500 focus:border-red-500 placeholder-neutral-500 dark:placeholder-neutral-400"
                placeholder={t('usernamePlaceholder')}
                required
                aria-required="true"
              />
            </div>
          </div>
          <div>
            <label htmlFor="superAdminPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('passwordLabel')}
            </label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                    type="password"
                    id="superAdminPassword"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-red-500 focus:border-red-500 placeholder-neutral-500 dark:placeholder-neutral-400"
                    placeholder={t('passwordPlaceholder')}
                    required
                    aria-required="true"
                />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 dark:text-red-400" role="alert">{error}</p>}
          <div className="flex justify-end space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-md transition"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {t('loginButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLoginModal;
