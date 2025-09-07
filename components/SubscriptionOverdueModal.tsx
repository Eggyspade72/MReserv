import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ExclamationTriangleIcon } from './Icons';
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from '../constants';

interface SubscriptionOverdueModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionValidUntil: string;
}

const SubscriptionOverdueModal: React.FC<SubscriptionOverdueModalProps> = ({ isOpen, onClose, subscriptionValidUntil }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;
  
  const deadline = new Date(subscriptionValidUntil);
  deadline.setDate(deadline.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);
  const deadlineString = deadline.toLocaleDateString(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out opacity-100"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="overdue-title"
        aria-describedby="overdue-message"
    >
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
            </div>
            <div className="ml-4 text-left">
                <h3 id="overdue-title" className="text-lg leading-6 font-medium text-neutral-900 dark:text-neutral-100">
                    {t('subscriptionOverdueModalTitle')}
                </h3>
                <div className="mt-2">
                    <p id="overdue-message" className="text-sm text-neutral-600 dark:text-neutral-300">
                        {t('subscriptionOverdueModalMessage', { deadline: deadlineString })}
                    </p>
                </div>
            </div>
        </div>
        <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
          >
            {t('iUnderstandButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOverdueModal;
