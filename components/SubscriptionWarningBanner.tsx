import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ExclamationTriangleIcon } from './Icons';
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from '../constants';

interface SubscriptionWarningBannerProps {
  subscriptionValidUntil: string;
}

const SubscriptionWarningBanner: React.FC<SubscriptionWarningBannerProps> = ({ subscriptionValidUntil }) => {
  const { t, language } = useLanguage();

  const deadline = new Date(subscriptionValidUntil);
  deadline.setDate(deadline.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);
  const deadlineString = deadline.toLocaleDateString(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500 text-amber-700 dark:text-amber-300 p-4 rounded-md shadow-md mb-6" role="alert">
      <div className="flex">
        <div className="py-1">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-4" />
        </div>
        <div>
          <p className="font-bold">{t('subscriptionGracePeriodTitle')}</p>
          <p className="text-sm">{t('subscriptionGracePeriodMessage', { deadline: deadlineString })}</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWarningBanner;
