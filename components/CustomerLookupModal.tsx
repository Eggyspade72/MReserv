
import React, { useState, useEffect } from 'react';
import { SearchIcon, PhoneIcon, XCircleIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLookup: (phoneNumber: string) => void;
  error: string;
}

const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({
  isOpen,
  onClose,
  onLookup,
  error,
}) => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
        // Using existing error message for simplicity or create a more specific one
        alert(t('errorInvalidPhoneNumber')); 
        return;
    }
    onLookup(phoneNumber);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-lookup-title"
    >
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 id="customer-lookup-title" className="text-2xl font-semibold text-primary flex items-center">
            <SearchIcon className="w-6 h-6 mr-2" /> {t('customerLookupTitle')}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" aria-label={t('ariaCloseCustomerLookupModal')}>
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        
        <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-sm">{t('customerLookupPrompt')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customerPhoneNumberLookup" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('phoneNumberLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhoneIcon className="w-5 h-5 text-neutral-400" />
              </div>
              <input
                type="tel"
                id="customerPhoneNumberLookup"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-md focus:ring-primary focus:border-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                placeholder={t('phoneNumberPlaceholder')}
                required
                aria-required="true"
                aria-describedby="phone-hint"
              />
            </div>
            <p id="phone-hint" className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              {t('phoneNumberHintCustomerLookup')}
            </p>
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
              <SearchIcon className="w-5 h-5 mr-2" />
              {t('findMyAppointmentsButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerLookupModal;