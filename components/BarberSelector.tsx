

import React from 'react';
import { Barber, Business } from '../types';
import { ChevronRightIcon, PhoneIcon, MapPinIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { isBarberEffectivelyClosed } from '../utils';
import BarberSchedulability from './BarberSchedulability';

interface BarberSelectorProps {
  barbers: Barber[];
  businesses: Business[];
  onSelectBarber: (barberId: string) => void;
  showServicesOnSelector: boolean;
}

const BarberSelector: React.FC<BarberSelectorProps> = ({ barbers, businesses, onSelectBarber, showServicesOnSelector }) => {
  const { t } = useLanguage();
  
  // Correctly filter and sort barbers by their effective status, including subscription checks.
  const activeBarbers = barbers.filter(b => !isBarberEffectivelyClosed(b, businesses.find(biz => biz.id === b.businessId)));
  const closedBarbers = barbers.filter(b => isBarberEffectivelyClosed(b, businesses.find(biz => biz.id === b.businessId)));
  const sortedBarbers = [...activeBarbers, ...closedBarbers];

  if (sortedBarbers.length === 0) {
    return <p className="text-center text-neutral-500 dark:text-neutral-400">{t('noBarbersAvailable')}</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {sortedBarbers.map(barber => {
        const business = businesses.find(b => b.id === barber.businessId);
        // This check is now consistent with the one used for filtering.
        const isClosed = isBarberEffectivelyClosed(barber, business);
        const shouldShowServices = showServicesOnSelector && (barber.showServicesOnSelector ?? true);

        return (
          <div
            key={barber.id}
            onClick={() => !isClosed && onSelectBarber(barber.id)}
            className={`bg-neutral-100 dark:bg-neutral-700 p-6 rounded-lg shadow-lg flex flex-col items-center text-center transition-all duration-300 w-full max-w-sm
              ${isClosed 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:shadow-xl transform hover:-translate-y-1 cursor-pointer'
              }`}
            role="button"
            tabIndex={isClosed ? -1 : 0}
            onKeyPress={(e) => !isClosed && e.key === 'Enter' && onSelectBarber(barber.id)}
            aria-label={isClosed ? t('ariaBarberNotAcceptingAppointments', {name: barber.name}) : t('ariaSelectBarber', { name: barber.name })}
            aria-disabled={isClosed}
          >
            {barber.avatarUrl ? (
              <img 
                src={barber.avatarUrl} 
                alt={barber.name} 
                className="w-24 h-24 rounded-full mb-4 border-4 border-primary object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mb-4 border-4 border-primary bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center">
                <span className="text-3xl text-neutral-500 dark:text-neutral-400">{barber.name.charAt(0)}</span>
              </div>
            )}
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2">{barber.name}</h3>
            
            <BarberSchedulability barber={barber} business={business} />

            {barber.phoneNumber && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 flex items-center">
                <PhoneIcon className="w-3 h-3 me-1.5 text-gray-400 dark:text-gray-500"/> {barber.phoneNumber}
              </p>
            )}
            {business?.address && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 flex items-center text-center max-w-xs">
                <MapPinIcon className="w-3 h-3 me-1.5 text-gray-400 dark:text-gray-500 flex-shrink-0"/> {business.address}
              </p>
            )}
            
            {!isClosed && (
                <div className="mt-auto w-full">
                    {shouldShowServices && barber.services && barber.services.length > 0 && (
                        <div className='my-2 text-start'>
                            <p className='text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1'>{t('servicesOffered')}</p>
                            <div className='flex flex-col text-xs text-neutral-600 dark:text-neutral-300 items-start'>
                                {barber.services.slice(0, 3).map(s => <span key={s.id} className='px-2 py-0.5 rounded-full'>{s.name} (€{s.price}, {s.duration}{t('minutesSuffix')})</span>)}
                                {barber.services.length > 3 && <span className='px-2 text-xs'>...</span>}
                            </div>
                        </div>
                    )}
                    <button 
                        type="button"
                        className="mt-3 flex items-center justify-center w-full px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150"
                        aria-hidden="true"
                        tabIndex={-1}
                    >
                        {t('viewScheduleButton')} <ChevronRightIcon className="w-5 h-5 ms-1" />
                    </button>
                </div>
            )}
          </div>
        )
      })}
    </div>
  );
};

export default BarberSelector;
