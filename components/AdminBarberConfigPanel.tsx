
import React, { useState } from 'react';
import { Barber, Appointment, AppConfig } from '../types';
import { PlusCircleIcon, SaveIcon, TrashIcon, CogIcon, ExclamationTriangleIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import BarberConfigRow from './BarberConfigRow';

interface AdminBarberConfigPanelProps {
  barbers: Barber[];
  appointments: Appointment[];
  appConfig: AppConfig;
  onAddBarber: (newBarber: Omit<Barber, 'id'>) => void;
  onUpdateBarber: (updatedBarber: Barber) => void;
  onRemoveBarber: (barberId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onResetAllAppointments: () => void;
  onUpdateAppConfig: (newConfig: AppConfig) => void;
  onImpersonateBarber: (barberId: string) => void;
}

type NewBarberState = Omit<Barber, 'id' | 'services' | 'timeOff' | 'scheduleOverrides' | 'preferredLanguage'>;

const AdminBarberConfigPanel: React.FC<AdminBarberConfigPanelProps> = ({ 
  barbers, 
  appointments,
  appConfig,
  onAddBarber, 
  onUpdateBarber, 
  onRemoveBarber,
  onCancelAppointment,
  onResetAllAppointments,
  onUpdateAppConfig,
  onImpersonateBarber,
}) => {
  const { t } = useLanguage();
  const [editableAppConfig, setEditableAppConfig] = useState<AppConfig>(appConfig);
  const [newBarber, setNewBarber] = useState<NewBarberState>({
    name: '',
    username: '',
    password: '',
    businessId: '',
    workStartTime: '09:00',
    workEndTime: '17:00',
    avatarUrl: '',
    phoneNumber: '',
    recurringClosedDays: [0, 6], // Default Sat, Sun closed
    bookableDaysInAdvance: 30,
    showPricesOnBooking: true,
    onLocationMode: 'none',
    onLocationDays: [],
  });
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);

  const handleAppConfigChange = (field: keyof AppConfig, value: any) => {
    const newConfig = { ...editableAppConfig, [field]: value };
    setEditableAppConfig(newConfig);
    onUpdateAppConfig(newConfig); // Update immediately on change
  };

  const handleNewBarberChange = (field: keyof NewBarberState, value: any) => {
    setNewBarber(prev => ({ ...prev, [field]: value }));
  };
  
  const handleWorkingDaysChange = (day: number) => {
    const currentClosedDays = newBarber.recurringClosedDays;
    const isCurrentlyClosed = currentClosedDays.includes(day);
    const newClosedDays = isCurrentlyClosed
      ? currentClosedDays.filter(d => d !== day) // It was closed, so we open it by removing it from closed days
      : [...currentClosedDays, day]; // It was open, so we close it by adding it to closed days
    
    handleNewBarberChange('recurringClosedDays', newClosedDays.sort());
  };

  const handleAddNewBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarber.name.trim() || !newBarber.username.trim() || !newBarber.password?.trim()) {
        alert(t('alertNameUsernamePasswordRequired'));
        return;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newBarber.workStartTime) || !timeRegex.test(newBarber.workEndTime)) {
        alert(t('alertInvalidTimeFormat'));
        return;
    }
    if (barbers.some(b => b.username === newBarber.username)) {
        alert(t('alertUsernameTaken'));
        return;
    }
    
    const barberToAdd: Omit<Barber, 'id'> = {
        ...newBarber,
        bookableDaysInAdvance: Number(newBarber.bookableDaysInAdvance),
        avatarUrl: newBarber.avatarUrl || `https://picsum.photos/seed/${new Date().getTime()}/200/200`,
        services: [],
        timeOff: [],
        scheduleOverrides: {},
        showPricesOnBooking: true,
        preferredLanguage: 'nl',
    };

    onAddBarber(barberToAdd);
    // Reset form
    setNewBarber({ name: '', username: '', password: '', businessId: '', workStartTime: '09:00', workEndTime: '17:00', avatarUrl: '', phoneNumber: '', recurringClosedDays: [0, 6], bookableDaysInAdvance: 30, showPricesOnBooking: true, onLocationMode: 'none', onLocationDays: [] });
    setShowAddBarberForm(false);
  };
  
  const daysMap = t('days');
  const dayOrder = ['1', '2', '3', '4', '5', '6', '0']; // Mon -> Sun

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
                  <input type="text" id="appName" value={editableAppConfig.appName} onChange={e => handleAppConfigChange('appName', e.target.value)} className="w-full p-2 rounded-md text-sm" />
              </div>
              <div>
                  <label htmlFor="defaultSubPrice" className="block text-sm font-medium">{t('defaultSubscriptionPriceLabel')}</label>
                  <input type="number" id="defaultSubPrice" value={editableAppConfig.defaultSubscriptionPrice} onChange={e => handleAppConfigChange('defaultSubscriptionPrice', Number(e.target.value))} className="w-full p-2 rounded-md text-sm" />
              </div>
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="showServicesOnSelector" checked={editableAppConfig.showServicesOnSelector} onChange={e => handleAppConfigChange('showServicesOnSelector', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="showServicesOnSelector" className="ml-2 text-sm">{t('showServicesOnSelectorLabel')}</label>
            </div>
        </div>
      </div>
      
      <div className="mb-6 text-center">
        <button
          type="button"
          onClick={() => {
            setShowAddBarberForm(!showAddBarberForm);
          }}
          className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center mx-auto"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          {showAddBarberForm ? t('cancelAddBarber') : t('addNewBarber')}
        </button>
      </div>

      {showAddBarberForm && (
        <form onSubmit={handleAddNewBarber} className="bg-neutral-200 dark:bg-neutral-600 p-4 rounded-md shadow-md mb-6 space-y-4">
          <h3 className="text-xl font-medium text-primary mb-3">{t('newBarberDetailsTitle')}</h3>
          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="newName" className="block text-sm font-medium">{t('fullNameLabel')}</label>
              <input type="text" id="newName" value={newBarber.name} onChange={e => handleNewBarberChange('name', e.target.value)} className="w-full p-2 rounded-md text-sm" required />
            </div>
            <div>
              <label htmlFor="newUsername" className="block text-sm font-medium">{t('usernameLabel')}</label>
              <input type="text" id="newUsername" value={newBarber.username} onChange={e => handleNewBarberChange('username', e.target.value)} className="w-full p-2 rounded-md text-sm" required />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium">{t('passwordLabel')}</label>
              <input type="password" id="newPassword" value={newBarber.password || ''} onChange={e => handleNewBarberChange('password', e.target.value)} className="w-full p-2 rounded-md text-sm" required />
            </div>
          </div>
          {/* Contact Details */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newAvatarUrl" className="block text-sm font-medium">{t('avatarUrlLabel')}</label>
              <input type="url" id="newAvatarUrl" value={newBarber.avatarUrl || ''} placeholder={t('avatarUrlPlaceholder')} onChange={e => handleNewBarberChange('avatarUrl', e.target.value)} className="w-full p-2 rounded-md text-sm" />
            </div>
            <div>
              <label htmlFor="newPhoneNumber" className="block text-sm font-medium">{t('phoneNumberLabel')}</label>
              <input type="tel" id="newPhoneNumber" value={newBarber.phoneNumber || ''} placeholder={t('phoneNumberPlaceholderOptional')} onChange={e => handleNewBarberChange('phoneNumber', e.target.value)} className="w-full p-2 rounded-md text-sm" />
            </div>
          </div>
          {/* Schedule */}
          <div className="p-3 bg-neutral-300 dark:bg-neutral-700 rounded-md">
            <h4 className="text-md font-semibold mb-2">{t('scheduleManagementTitle')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="newStartTime" className="block text-sm font-medium">{t('workStartTimeLabel')}</label>
                    <input type="time" id="newStartTime" value={newBarber.workStartTime} onChange={e => handleNewBarberChange('workStartTime', e.target.value)} className="w-full p-2 rounded-md text-sm" required/>
                </div>
                <div>
                    <label htmlFor="newEndTime" className="block text-sm font-medium">{t('workEndTimeLabel')}</label>
                    <input type="time" id="newEndTime" value={newBarber.workEndTime} onChange={e => handleNewBarberChange('workEndTime', e.target.value)} className="w-full p-2 rounded-md text-sm" required/>
                </div>
                <div>
                    <label htmlFor="bookableDaysInAdvance" className="block text-sm font-medium">{t('bookableDaysInAdvanceLabel')}</label>
                    <input type="number" id="bookableDaysInAdvance" value={newBarber.bookableDaysInAdvance} min="1" step="1" onChange={e => handleNewBarberChange('bookableDaysInAdvance', parseInt(e.target.value, 10))} className="w-full p-2 rounded-md text-sm" required/>
                </div>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium mb-2">{t('workingDaysLabel')}</label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {dayOrder.map(dayIndexStr => {
                        const dayIndex = Number(dayIndexStr);
                        return (
                            <div key={dayIndex} className="flex items-center">
                                <input type="checkbox" id={`new-day-${dayIndex}`} checked={!newBarber.recurringClosedDays.includes(dayIndex)} onChange={() => handleWorkingDaysChange(dayIndex)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <label htmlFor={`new-day-${dayIndex}`} className="ml-2 text-sm">{daysMap[dayIndexStr]}</label>
                            </div>
                        )
                    })}
                </div>
            </div>
          </div>
          <button type="submit" className="w-full mt-2 px-4 py-2.5 bg-secondary hover:bg-emerald-600 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center">
            <SaveIcon className="w-5 h-5 mr-2"/> {t('addBarberButton')}
          </button>
        </form>
      )}

      {barbers.length === 0 && !showAddBarberForm && <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noBarbersConfigured')}</p>}
      
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
