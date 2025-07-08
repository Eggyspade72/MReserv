
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ExclamationTriangleIcon, ArrowPathIcon } from './Icons';

interface NetworkErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  appUrl: string;
}

const NetworkErrorModal: React.FC<NetworkErrorModalProps> = ({ isOpen, onClose, onRetry, appUrl }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out opacity-100"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="network-error-title"
        aria-describedby="network-error-message"
    >
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="ms-4 text-start">
                <h3 id="network-error-title" className="text-lg leading-6 font-medium text-neutral-900 dark:text-neutral-100">
                    {t('networkErrorModalTitle')}
                </h3>
                <div className="mt-2" id="network-error-message">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {t('networkErrorModalMessage')}
                    </p>
                </div>
                 <div className="mt-4">
                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t('networkErrorModalInstructionsTitle')}</h4>
                    <ol className="list-decimal list-inside mt-1 text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                        <li>{t('networkErrorModalInstruction1')}</li>
                        <li>{t('networkErrorModalInstruction2')}</li>
                        <li>{t('networkErrorModalInstruction3', { appUrl: '' })} <code className="text-xs bg-neutral-200 dark:bg-neutral-900 p-1 rounded-md text-red-600 dark:text-red-400">{appUrl}</code></li>
                        <li>{t('networkErrorModalInstruction4')}</li>
                    </ol>
                </div>
            </div>
        </div>
        <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
          >
            <ArrowPathIcon className="w-5 h-5 me-2"/>
            {t('retryButton')}
          </button>
           <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-neutral-500 shadow-sm px-4 py-2 bg-white dark:bg-neutral-700 text-base font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            {t('closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkErrorModal;
