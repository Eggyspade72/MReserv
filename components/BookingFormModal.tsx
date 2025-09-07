
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarIcon, ClockIcon, UserCircleIcon, PhoneIcon, CheckCircleIcon, XCircleIcon, HomeIcon, MapPinIcon, ExclamationTriangleIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { Barber, Service, AppConfig, Business } from '../types';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string, services: Service[], wantsEarlier?: boolean) => void;
  slotTime: string;
  barber: Barber;
  currentDate: Date;
  bookingType: 'in-shop' | 'on-location';
  appConfig: AppConfig;
  business: Business;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  slotTime,
  barber,
  currentDate,
  bookingType,
  appConfig,
  business,
}) => {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [wantsEarlier, setWantsEarlier] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setError('');
      setSelectedServices([]);
      setWantsEarlier(false);
    }
  }, [isOpen]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => 
        prev.some(s => s.id === service.id)
            ? prev.filter(s => s.id !== service.id)
            : [...prev, service]
    );
  };

  const { totalPrice, totalDuration } = useMemo(() => {
    return selectedServices.reduce((acc, service) => {
        acc.totalPrice += service.price;
        acc.totalDuration += service.duration;
        return acc;
    }, { totalPrice: 0, totalDuration: 0 });
  }, [selectedServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError(t('errorNamePhoneRequired'));
      return;
    }
    
    if (selectedServices.length === 0) {
        setError(t('errorNoServicesSelected'));
        return;
    }

    const cleanedPhone = phone.replace(/[\s.-]/g, '');

    // Regex for Belgian numbers (cleaned)
    const bePhoneRegex = /^((\+|00)32|0)4\d{8}$/;
    // Regex for both Belgian (cleaned) and Dutch (cleaned) numbers
    const beNePhoneRegex = /^((\+|00)316|06)\d{8}$|^((\+|00)324|04)\d{8}$/;

    const allowDutch = appConfig.allowDutchPhoneNumbers;
    const phoneRegex = allowDutch ? beNePhoneRegex : bePhoneRegex;
    
    if (!phoneRegex.test(cleanedPhone)) {
      setError(allowDutch ? t('errorInvalidBeNePhoneNumber') : t('errorInvalidBelgianPhoneNumber'));
      return;
    }
    
    try {
      await onSubmit(name, phone, selectedServices, wantsEarlier);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'CUSTOMER_BLOCKED') {
          setError(t('errorCustomerIsBlocked'));
        } else if (err.message === 'ALREADY_BOOKED_TODAY') {
          setError(t('errorAlreadyBookedToday'));
        } else {
          setError(err.message);
        }
      } else {
        setError(t('errorNamePhoneRequired'));
      }
    }
  };

  if (!isOpen) return null;
  
  const BookingTypeIcon = bookingType === 'in-shop' ? MapPinIcon : HomeIcon;
  const bookingTypeText = bookingType === 'in-shop' ? t('bookingTypeInShop') : t('bookingTypeOnLocation');
  const showWaitlist = appConfig.enableWaitlist && barber.enableWaitlist;
  const showCancellationWarning = appConfig.enableCancellationFee && business.enableCancellationFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100">
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary">{t('bookAppointmentTitle')}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" aria-label={t('ariaCloseModal')}>
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
        
        <div className="mb-6 space-y-2 text-neutral-600 dark:text-neutral-300">
            <p className="flex items-center"><UserCircleIcon className="w-5 h-5 me-2 text-secondary"/> {t('barberLabel')}: <span className="font-medium ms-1 text-neutral-800 dark:text-neutral-100">{barber.name}</span></p>
            <p className="flex items-center"><ClockIcon className="w-5 h-5 me-2 text-secondary"/> {t('timeLabel')}: <span className="font-medium ms-1 text-neutral-800 dark:text-neutral-100">{slotTime}</span></p>
            <p className="flex items-center"><CalendarIcon className="w-5 h-5 me-2 text-secondary"/> {t('dateLabel')}: <span className="font-medium ms-1 text-neutral-800 dark:text-neutral-100">{currentDate.toLocaleDateString(language)}</span></p>
            <p className="flex items-center"><BookingTypeIcon className="w-5 h-5 me-2 text-secondary"/> {t('bookingTypeLabel')}: <span className="font-medium ms-1 text-neutral-800 dark:text-neutral-100">{bookingTypeText}</span></p>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-3">{t('selectServicesTitle')}</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pe-2">
                {barber.services.map(service => (
                    <div key={service.id} onClick={() => handleServiceToggle(service)} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${selectedServices.some(s => s.id === service.id) ? 'bg-primary/20 ring-2 ring-primary' : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}>
                        <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{service.name}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{service.duration} {t('minutesSuffix')}</p>
                        </div>
                        {(barber.showPricesOnBooking ?? true) && <p className="font-semibold text-primary">€{service.price}</p>}
                    </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex justify-end items-center font-semibold gap-6">
                {(barber.showPricesOnBooking ?? true) && (
                    <p className="text-base text-neutral-700 dark:text-neutral-300">{t('totalPrice')}: <span className="text-primary text-lg ms-1">€{totalPrice}</span></p>
                )}
                <p className="text-base text-neutral-700 dark:text-neutral-300">{t('totalDuration')}: <span className="text-primary text-lg ms-1">{totalDuration} {t('minutesSuffix')}</span></p>
            </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('fullNameLabel')}
            </label>
            <div className="relative">
              <input
                type="text" id="customerName" value={name} onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary focus:border-primary"
                placeholder={t('fullNamePlaceholder')} required
              />
            </div>
          </div>
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('phoneNumberLabel')}
            </label>
             <div className="relative">
                <input
                    type="tel" id="customerPhone" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary focus:border-primary"
                    placeholder={t('phoneNumberPlaceholder')} required
                />
            </div>
          </div>
           {showWaitlist && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="wantsEarlier"
                checked={wantsEarlier}
                onChange={(e) => setWantsEarlier(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="wantsEarlier" className="ms-2 block text-sm text-neutral-600 dark:text-neutral-300">
                {t('waitlistCheckboxLabel')}
              </label>
            </div>
          )}

          {showCancellationWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/40 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('cancellationWarning', { hours: business.cancellationFeeHours, amount: business.cancellationFeeAmount})}
                </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 dark:text-red-400" role="alert">{error}</p>}
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-md transition"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-md transition flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 me-2" />
              {t('confirmBookingButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;