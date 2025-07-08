import React from 'react';
import { Barber, Appointment, AppConfig } from '../types';
import { CogIcon, ExclamationTriangleIcon, TrashIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import BarberConfigRow from './BarberConfigRow';

interface AdminBarberConfigPanelProps {
  barbers: Barber[];
  appointments: Appointment[];
  appConfig: AppConfig;
  onUpdateBarber: (updatedBarber: Barber) => void;
  onRemoveBarber: (barberId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onResetAllAppointments: () => void;
  onUpdateAppConfig: (newConfig: AppConfig) => void;
  onImpersonateBarber: (barberId: string) => void;
}

const AdminBarberConfigPanel: React.FC<AdminBarberConfigPanelProps> = ({ 
  barbers, 
  appointments,
  appConfig,
  onUpdateBarber, 
  onRemoveBarber,
  onCancelAppointment,
  onResetAllAppointments,
  onUpdateAppConfig,
  onImpersonateBarber,
}) => {
  const { t } = useLanguage();

  const handleAppConfigChange = (field: keyof AppConfig, value: any) => {
    const newConfig = { ...appConfig, [field]: value };
    onUpdateAppConfig(newConfig); // Update immediately on change
  };

  return (
    <div className="bg-neutral-100 dark:bg-neutral-700 p-4 md:p-6 rounded-lg shadow-inner">
      <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md mb-6" role="alert">
        <div className="flex">
          <div className="py-1"><ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-4" /></div>
          <div>
            <p className="font-bold">{t('securityWarningTitle')}</p>
            <p className="text-sm">{t('securityWarningMessage')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2 sm:mb-0 text-center sm:text-left">{t('adminManageBarbersTitle')}</h2>
        <button
            type="button"
            onClick={onResetAllAppointments}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-150 flex items-center text-xs"
            title={t('confirmResetAllAppointmentsAdmin')}
        >
            <TrashIcon className="w-4 h-4 mr-2" />
            {t('resetAllAppointmentsAdminButton')}
        </button>
      </div>

      <div className="mb-6 p-4 bg-neutral-200 dark:bg-neutral-600 rounded-md shadow-md">
        <h3 className="text-xl font-medium text-primary mb-3 flex items-center"><CogIcon className="w-5 h-5 mr-2"/>{t('appSettingsTitle')}</h3>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="appName" className="block text-sm font-medium">{t('appNameLabel')}</label>
                  <input type="text" id="appName" value={appConfig.appName} onChange={e => handleAppConfigChange('appName', e.target.value)} className="w-full p-2 rounded-md text-sm" />
              </div>
              <div>
                  <label htmlFor="defaultSubPrice" className="block text-sm font-medium">{t('defaultSubscriptionPriceLabel')}</label>
                  <input type="number" id="defaultSubPrice" value={appConfig.defaultSubscriptionPrice} onChange={e => handleAppConfigChange('defaultSubscriptionPrice', Number(e.target.value))} className="w-full p-2 rounded-md text-sm" />
              </div>
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="showServicesOnSelector" checked={appConfig.showServicesOnSelector} onChange={e => handleAppConfigChange('showServicesOnSelector', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="showServicesOnSelector" className="ml-2 text-sm">{t('showServicesOnSelectorLabel')}</label>
            </div>
        </div>
      </div>
      
      {/* The "Add Barber" form has been removed from this component as it was redundant and contained faulty logic. The correct form is in SuperAdminPanel.tsx. */}

      {barbers.length === 0 && <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noBarbersConfigured')}</p>}
      
      <div className="space-y-6">
        {barbers.map(barber => (
          <BarberConfigRow
            key={barber.id}
            barber={barber}
            appointments={appointments.filter(a => a.barberId === barber.id)}
            onUpdateBarber={onUpdateBarber}
            onRemoveBarber={onRemoveBarber}
            onCancelAppointment={onCancelAppointment}
            onImpersonate={onImpersonateBarber}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminBarberConfigPanel;