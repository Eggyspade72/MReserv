

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, AtSymbolIcon, LockClosedIcon, CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAttempt: (email: string, passwordAttempt: string) => void;
  error: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginAttempt,
  error,
}) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginAttempt(email, password); 
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 id="login-title" className="text-2xl font-semibold text-primary flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2" /> {t('loginTitle')}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" aria-label={t('ariaCloseLoginModal')}>
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="loginEmail" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('ownerEmailLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSymbolIcon className="w-5 h-5 text-neutral-400" />
              </div>
              <input
                type="email"
                id="loginEmail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-primary focus:border-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                placeholder={t('emailPlaceholder')}
                required
                aria-required="true"
              />
            </div>
          </div>
          <div>
            <label htmlFor="loginPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('passwordLabel')}
            </label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                    type={showPassword ? 'text' : 'password'}
                    id="loginPassword"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-primary focus:border-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                    placeholder={t('passwordPlaceholder')}
                    required
                    aria-required="true"
                />
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                </button>
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
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-md transition flex items-center"
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

export default LoginModal;