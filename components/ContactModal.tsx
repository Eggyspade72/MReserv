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
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
            <h3 id="contact-modal-title" className="text-xl leading-6 font-semibold text-primary flex items-center gap-2">
                <MailIcon className="w-6 h-6"/>
                {t('contactModalTitle')}
            </h3>
            <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                aria-label={t('closeButton')}
            >
                <XCircleIcon className="w-7 h-7" />
            </button>
        </div>
        <div className="mt-2 text-center">
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
