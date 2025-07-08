
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MailIcon, XCircleIcon } from './Icons';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactEmail?: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, contactEmail }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out opacity-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
    >
      <div className="relative bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            aria-label={t('closeButton')}
        >
            <XCircleIcon className="w-7 h-7" />
        </button>
        
        <div className="flex items-center gap-3 mb-4">
            <MailIcon className="w-8 h-8 text-primary"/>
            <h3 id="contact-modal-title" className="text-xl leading-6 font-semibold text-primary">
                {t('contactModalTitle')}
            </h3>
        </div>

        <div className="mt-2 text-left">
            {contactEmail ? (
                <>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {t('contactModalBody', { email: '' })}
                        <a href={`mailto:${contactEmail}`} className="font-bold text-primary hover:underline break-all">{contactEmail}</a>
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                        {t('contactModalSubtitle')}
                    </p>
                </>
            ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {t('contactModalNoEmail')}
                </p>
            )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-primary text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
          >
            {t('closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;