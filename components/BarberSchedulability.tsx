

import React from 'react';
import { Barber, Business } from '../types';
import { LockClosedIcon, ClockIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { isBarberEffectivelyClosed } from '../utils';

interface BarberSchedulabilityProps {
    barber: Barber;
    business: Business | undefined;
}

const BarberSchedulability: React.FC<BarberSchedulabilityProps> = ({ barber, business }) => {
    const { t } = useLanguage();
    const isClosed = isBarberEffectivelyClosed(barber, business);

    if (isClosed) {
        return (
            <div className="my-2 p-2 bg-neutral-200 dark:bg-neutral-600 rounded-md w-full">
                <p className="text-sm text-amber-500 dark:text-amber-400 font-semibold flex items-center justify-center">
                    <LockClosedIcon className="w-4 h-4 me-1.5"/>
                    {t('barberStatusClosed')}
                </p>
            </div>
        );
    }

    return (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 flex items-center">
            <ClockIcon className="w-4 h-4 me-1.5"/> {barber.workStartTime} - {barber.workEndTime}
        </p>
    );
};

export default BarberSchedulability;
