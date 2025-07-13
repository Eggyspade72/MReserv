

import React, { useState, useEffect, useMemo } from 'react';
import type { TranslationKey, Language } from '../translations';
import { Barber, Appointment, Service, TimeOff, AppointmentStatus, AppConfig, BlockedSlot } from '../types';
import { UserCircleIcon, ClockIcon, SaveIcon, PencilIcon, CalendarIcon, PhoneIcon, LogoutIcon, KeyIcon, TrashIcon, MapPinIcon, CalendarDaysIcon, PlusCircleIcon, ChartPieIcon, ChartBarIcon, ChevronDownIcon, ChevronUpIcon, CurrencyEuroIcon, UsersIcon, ExclamationTriangleIcon, GlobeAltIcon, AtSymbolIcon, XCircleIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import ScheduleCalendar from './ScheduleCalendar';

interface ScheduleData {
  recurringClosedDays: number[];
  scheduleOverrides: Record<string, { closed: boolean }>;
}

interface DaySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (mode: 'default' | 'in-shop-exclusive' | 'on-location-exclusive') => void;
    currentMode: 'default' | 'in-shop-exclusive' | 'on-location-exclusive';
    date: Date;
}

const DaySettingsModal: React.FC<DaySettingsModalProps> = ({ isOpen, onClose, onSave, currentMode, date }) => {
    const { t, language } = useLanguage();
    const [selectedMode, setSelectedMode] = useState(currentMode);

    useEffect(() => {
        setSelectedMode(currentMode);
    }, [currentMode, isOpen]);
    
    if (!isOpen) return null;

    const handleSave = () => {
        onSave(selectedMode);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-1">{t('daySettingsTitle')}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{date.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="space-y-2">
                    <label className="flex items-center p-3 rounded-md bg-neutral-100 dark:bg-neutral-700 has-[:checked]:bg-primary/20 has-[:checked]:ring-2 has-[:checked]:ring-primary cursor-pointer">
                        <input type="radio" name="day-mode" value="default" checked={selectedMode === 'default'} onChange={() => setSelectedMode('default')} className="w-4 h-4 text-primary focus:ring-primary"/>
                        <span className="ms-3">{t('daySettings_default')}</span>
                    </label>
                     <label className="flex items-center p-3 rounded-md bg-neutral-100 dark:bg-neutral-700 has-[:checked]:bg-primary/20 has-[:checked]:ring-2 has-[:checked]:ring-primary cursor-pointer">
                        <input type="radio" name="day-mode" value="in-shop-exclusive" checked={selectedMode === 'in-shop-exclusive'} onChange={() => setSelectedMode('in-shop-exclusive')} className="w-4 h-4 text-primary focus:ring-primary"/>
                        <span className="ms-3">{t('daySettings_inShopOnly')}</span>
                    </label>
                     <label className="flex items-center p-3 rounded-md bg-neutral-100 dark:bg-neutral-700 has-[:checked]:bg-primary/20 has-[:checked]:ring-2 has-[:checked]:ring-primary cursor-pointer">
                        <input type="radio" name="day-mode" value="on-location-exclusive" checked={selectedMode === 'on-location-exclusive'} onChange={() => setSelectedMode('on-location-exclusive')} className="w-4 h-4 text-primary focus:ring-primary"/>
                        <span className="ms-3">{t('daySettings_onLocationOnly')}</span>
                    </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-neutral-200 dark:bg-neutral-600">{t('cancelButton')}</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-primary text-white">{t('saveButton')}</button>
                </div>
            </div>
        </div>
    );
}


interface BarberDashboardProps {
  barber: Barber;
  allAppointments: Appointment[]; // All appointments for this barber
  onUpdateDetails: (updatedDetails: Partial<Barber>, newServices: Service[], newPassword?: string) => void;
  onMarkAsNoShow: (appointment: Appointment) => void;
  onLogout: () => void;
  onCancelAppointment: (appointmentId: string) => void;
  onResetMyAppointments: () => void;
  showGracePeriodWarning: boolean;
  allowBarberLanguageControl: boolean;
  appConfig: AppConfig;
}

// Simple chart components
const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) return null;

    let cumulative = 0;
    const gradients = data.map(item => {
        const percentage = (item.value / total) * 100;
        const start = cumulative;
        const end = cumulative + percentage;
        cumulative = end;
        return `${item.color} ${start}% ${end}%`;
    });

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div
                className="w-40 h-40 rounded-full"
                style={{ background: `conic-gradient(${gradients.join(', ')})` }}
                role="img"
                aria-label="Pie chart"
            ></div>
            <ul className="text-sm space-y-2">
                {data.map(item => (
                    <li key={item.label} className="flex items-center">
                        <span className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: item.color }}></span>
                        <span>{item.label}: €{item.value.toFixed(2)} ({((item.value / total) * 100).toFixed(0)}%)</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SimpleBarChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    if (maxValue === 0) return null;
    
    return (
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md">
            <div className="flex justify-around items-end h-64 gap-x-2 sm:gap-x-4">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center justify-end h-full flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-bold mb-1" style={{ color: item.color }}>€{item.value.toFixed(0)}</div>
                        <div
                            className="w-full rounded-t-md mt-1 transition-all duration-300 ease-in-out opacity-90 hover:opacity-100"
                            style={{
                                height: `${(item.value / maxValue) * 85}%`, // Use 85% to leave space for label
                                backgroundColor: item.color,
                            }}
                        ></div>
                        <div className="mt-2 text-[10px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-400 text-center break-words">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

type DashboardTab = 'schedule' | 'history' | 'earnings' | 'waitlist';

interface TabButtonProps {
  tabId: DashboardTab;
  activeTab: DashboardTab;
  onClick: (tabId: DashboardTab) => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ tabId, activeTab, onClick, children }) => (
  <button onClick={() => onClick(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}>
      {children}
  </button>
);

const BarberDashboard: React.FC<BarberDashboardProps> = ({
    barber,
    allAppointments,
    onUpdateDetails,
    onMarkAsNoShow,
    onLogout,
    onCancelAppointment,
    onResetMyAppointments,
    allowBarberLanguageControl,
    appConfig
}) => {
  const { t, language } = useLanguage();
  const { showConfirmation } = useConfirmation();
  const [activeTab, setActiveTab] = useState<DashboardTab>('schedule');

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editableBarber, setEditableBarber] = useState(barber);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [newBlockDate, setNewBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBlockTime, setNewBlockTime] = useState('12:00');
  const [newBlockDuration, setNewBlockDuration] = useState(30);

  const [earningsPeriod, setEarningsPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  
  const [daySettingsModalOpen, setDaySettingsModalOpen] = useState(false);
  const [selectedDateForSettings, setSelectedDateForSettings] = useState<Date | null>(null);

  useEffect(() => {
    setEditableBarber(barber);
    setIsEditingDetails(false);
  }, [barber]);
  
  const handleDetailChange = (field: keyof Omit<Barber, 'services' | 'timeOff'>, value: any) => {
    setEditableBarber(prev => ({ ...prev, [field]: value }));
  };
  
  const handleOnLocationDaysChange = (day: number) => {
    const currentDays = editableBarber.onLocationDays || [];
    const isCurrentlySet = currentDays.includes(day);
    const newDays = isCurrentlySet
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
    handleDetailChange('onLocationDays', newDays.sort());
  };

  const handleAllowedLanguageChange = (lang: Language) => {
    const currentLangs = editableBarber.allowedLanguages || [];
    const isAllowed = currentLangs.includes(lang);
    const newLangs = isAllowed
        ? currentLangs.filter(l => l !== lang)
        : [...currentLangs, lang];
    handleDetailChange('allowedLanguages', newLangs);
  };


  const handleServiceChange = (index: number, field: keyof Service, value: string | number) => {
    const updatedServices = [...editableBarber.services];
    const serviceToUpdate = { ...updatedServices[index] };
    (serviceToUpdate[field] as any) = (field === 'price' || field === 'duration') ? Number(value) : value;
    updatedServices[index] = serviceToUpdate;
    setEditableBarber(prev => ({ ...prev, services: updatedServices }));
  };

  const handleAddService = () => {
    const newService = { id: `service_${Date.now()}`, name: '', price: 20, duration: 30 };
    setEditableBarber(prev => ({ ...prev, services: [...prev.services, newService]}));
  };

  const handleRemoveService = (index: number) => {
    const updatedServices = editableBarber.services.filter((_, i) => i !== index);
    setEditableBarber(prev => ({ ...prev, services: updatedServices }));
  };

  const handleScheduleChange = (newSchedule: ScheduleData) => {
    setEditableBarber(prev => ({
        ...prev,
        recurringClosedDays: newSchedule.recurringClosedDays,
        scheduleOverrides: newSchedule.scheduleOverrides,
    }));
  };
  
  const handleDaySettingsSave = (mode: 'default' | 'in-shop-exclusive' | 'on-location-exclusive') => {
      if (!selectedDateForSettings) return;
      const dateStr = selectedDateForSettings.toISOString().split('T')[0];
      const newOverrides = { ...(editableBarber.daily_location_overrides || {}) };

      if (mode === 'default') {
          delete newOverrides[dateStr];
      } else {
          newOverrides[dateStr] = mode;
      }
      handleDetailChange('daily_location_overrides', newOverrides);
  };
  
  const parseDateAsUTC = (date: Date) => {
      return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  const upcomingAppointments = useMemo(() => {
      const today = parseDateAsUTC(new Date());
      return allAppointments
        .filter(apt => new Date(apt.date) >= today && apt.status === 'booked')
        .sort((a, b) => new Date(`${a.date}T${a.slotTime}`).getTime() - new Date(`${b.date}T${b.slotTime}`).getTime());
    }, [allAppointments]);

  const pastAppointments = useMemo(() => {
      const today = parseDateAsUTC(new Date());
      return allAppointments
        .filter(apt => new Date(apt.date) < today || apt.status !== 'booked')
        .sort((a, b) => new Date(`${b.date}T${b.slotTime}`).getTime() - new Date(`${a.date}T${a.slotTime}`).getTime());
  }, [allAppointments]);

  const waitlistAppointments = useMemo(() => {
      return allAppointments
        .filter(apt => apt.wantsEarlierSlot && apt.status === 'booked')
        .sort((a, b) => new Date(`${a.date}T${a.slotTime}`).getTime() - new Date(`${b.date}T${b.slotTime}`).getTime());
  }, [allAppointments]);

  const earningsData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    
    switch (earningsPeriod) {
        case 'day':
            startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            break;
        case 'week': {
            const todayForWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const dayOfWeek = todayForWeek.getUTCDay(); // 0 for Sunday, 1 for Monday, etc.
            const diffToMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
            startDate = new Date(todayForWeek.setUTCDate(todayForWeek.getUTCDate() - diffToMonday));
            break;
        }
        case 'month':
            startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            break;
        case 'all':
        default:
            startDate = new Date(0); // The dawn of time
            endDate = new Date(8640000000000000); // Far future
    }

    const relevantAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= startDate && aptDate <= endDate;
    });

    const completedAppointments = relevantAppointments.filter(apt => apt.status === 'completed');
    const totalEarnings = completedAppointments.reduce((sum, apt) => sum + apt.totalPrice, 0);
    const totalCustomers = new Set(relevantAppointments.map(apt => apt.customerPhone)).size;
    const totalNoShows = relevantAppointments.filter(apt => apt.status === 'no-show').length;

    const earningsByService = completedAppointments
        .flatMap(apt => apt.services)
        .reduce((acc, service) => {
            if (!acc[service.name]) {
                acc[service.name] = 0;
            }
            acc[service.name] += service.price;
            return acc;
        }, {} as Record<string, number>);

    return { totalEarnings, totalCustomers, totalNoShows, earningsByService };
  }, [allAppointments, earningsPeriod]);
  
  const handleSaveChanges = () => {
    if (!editableBarber.name.trim()) { alert(t('alertBarberNameEmpty')); return; }
    if (newPassword && newPassword !== confirmNewPassword) { setPasswordError(t('errorPasswordsDoNotMatch')); return; }
    if (newPassword && newPassword.length < 6) { setPasswordError(t('errorPasswordTooShort')); return; }
    
    const { services, ...detailsToUpdate } = editableBarber;

    onUpdateDetails(detailsToUpdate, editableBarber.services, newPassword || undefined);
    setIsEditingDetails(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
  };
  
  const handleCancelAppointmentClick = (appointmentId: string) => {
    showConfirmation({
        message: t('confirmCancelAppointment'),
        onConfirm: () => onCancelAppointment(appointmentId)
    });
  };

  const handleMarkAsNoShowClick = (appointment: Appointment) => {
    showConfirmation({
        message: t('confirmMarkAsNoShow'),
        onConfirm: () => onMarkAsNoShow(appointment)
    });
  };

  const handleAddBlockedSlot = () => {
    const newBlock: BlockedSlot = {
      id: `block_${Date.now()}`,
      date: newBlockDate,
      startTime: newBlockTime,
      duration: newBlockDuration,
    };
    const updatedBlocks = [...editableBarber.blockedSlots, newBlock];
    handleDetailChange('blockedSlots', updatedBlocks);
  };

  const handleRemoveBlockedSlot = (id: string) => {
    const updatedBlocks = editableBarber.blockedSlots.filter(b => b.id !== id);
    handleDetailChange('blockedSlots', updatedBlocks);
  }

  const renderScheduleTab = () => {
    const daysMap = t('days');
    const allDays = [1, 2, 3, 4, 5, 6, 0];
    const workingDaysLabels = allDays
        .filter(d => !barber.recurringClosedDays.includes(d))
        .map(d => (daysMap as {[key:string]: string})[d])
        .join(', ');

    const inputClasses = "w-full p-1.5 rounded-md text-sm bg-white dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-500 focus:ring-primary focus:border-primary";
    const dayOrder = ['1', '2', '3', '4', '5', '6', '0']; // Mon -> Sun
    const allLanguages: Language[] = ['en', 'nl', 'fr', 'es', 'ar'];

    const activeBlockedSlots = editableBarber.blockedSlots
      .filter(b => new Date(b.date) >= new Date(new Date().toISOString().split('T')[0]))
      .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    return (
      <div>
        <DaySettingsModal 
            isOpen={daySettingsModalOpen}
            onClose={() => setDaySettingsModalOpen(false)}
            onSave={handleDaySettingsSave}
            currentMode={editableBarber.daily_location_overrides?.[selectedDateForSettings?.toISOString().split('T')[0] || ''] || 'default'}
            date={selectedDateForSettings || new Date()}
        />
        <section className="mb-8 p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
           <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h3 className="text-xl font-semibold text-secondary">{t('myDetailsAndScheduleTitle')}</h3>
              <div className="flex items-center gap-2">
                {isEditingDetails ? (
                   <div className='flex items-center gap-2'>
                    <button onClick={() => { setIsEditingDetails(false); setEditableBarber(barber); }} className="px-3 py-1.5 text-sm rounded-md flex items-center transition-colors bg-neutral-600 hover:bg-neutral-500 text-white">
                            {t('cancelButton')}
                        </button>
                    <button onClick={handleSaveChanges} className='px-3 py-1.5 text-sm rounded-md flex items-center transition-colors bg-primary hover:bg-blue-600 text-white'>
                        <SaveIcon className="w-4 h-4 me-1.5"/>
                        {t('saveChangesButton')}
                    </button>
                   </div>
                ) : (
                    <button onClick={() => setIsEditingDetails(true)} className='px-3 py-1.5 text-sm rounded-md flex items-center transition-colors bg-accent hover:bg-yellow-600 text-neutral-900'>
                        <PencilIcon className="w-4 h-4 me-1.5"/>
                        {t('editDetailsButton')}
                    </button>
                )}
              </div>
            </div>
            {isEditingDetails ? (
                <div className="space-y-4 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div><label className="block text-xs font-medium">{t('displayNameLabel')}</label><input type="text" value={editableBarber.name} onChange={e => handleDetailChange('name', e.target.value)} className={inputClasses} /></div>
                        <div><label className="block text-xs font-medium">{t('phoneNumberLabel')}</label><input type="text" value={editableBarber.phoneNumber || ''} onChange={e => handleDetailChange('phoneNumber', e.target.value)} className={inputClasses} /></div>
                        <div>
                          <label className="block text-xs font-medium">{t('languagePreferenceLabel')}</label>
                          <select value={editableBarber.preferredLanguage || 'nl'} onChange={e => handleDetailChange('preferredLanguage', e.target.value)} className={inputClasses}>
                            <option value="en">English</option>
                            <option value="nl">Nederlands</option>
                            <option value="fr">Français</option>
                            <option value="es">Español</option>
                             <option value="ar">العربية</option>
                          </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><label className="block text-xs font-medium">{t('changePasswordOptional')}</label><input type="password" placeholder={t('min6CharsPlaceholder')} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClasses} /></div>
                        <div><label className="block text-xs font-medium">{t('confirmNewPasswordLabel')}</label><input type="password" placeholder={t('retypeNewPasswordPlaceholder')} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className={inputClasses} /></div>
                    </div>
                    {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}

                    <div className="space-y-2 mt-4">
                        <label className="flex items-center text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editableBarber.showPricesOnBooking ?? true}
                                onChange={e => handleDetailChange('showPricesOnBooking', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ms-2 text-neutral-800 dark:text-neutral-200">{t('showPricesOnBookingLabel')}</span>
                        </label>
                         <label className="flex items-center text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editableBarber.showServicesOnSelector ?? true}
                                onChange={e => handleDetailChange('showServicesOnSelector', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ms-2 text-neutral-800 dark:text-neutral-200">{t('showMyServicesOnSelectorLabel')}</span>
                        </label>
                        {appConfig.enableWaitlist && (
                          <label className="flex items-center text-sm cursor-pointer">
                              <input
                                  type="checkbox"
                                  checked={editableBarber.enableWaitlist}
                                  onChange={e => handleDetailChange('enableWaitlist', e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="ms-2 text-neutral-800 dark:text-neutral-200">{t('enableMyWaitlistLabel')}</span>
                          </label>
                        )}
                        {appConfig.enableWalkinBuffer && (
                          <div className="p-2 border-t border-neutral-300 dark:border-neutral-600 mt-2">
                            <label className="flex items-center text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editableBarber.enableWalkinBuffer}
                                    onChange={e => handleDetailChange('enableWalkinBuffer', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="ms-2 text-neutral-800 dark:text-neutral-200">{t('enableMyWalkinBufferLabel')}</span>
                            </label>
                            {editableBarber.enableWalkinBuffer && (
                              <div className="mt-2 ps-6">
                                <label className="block text-xs font-medium">{t('walkinBufferMinutesLabel')}</label>
                                <input 
                                  type="number" 
                                  value={editableBarber.walkinBufferMinutes} 
                                  onChange={e => handleDetailChange('walkinBufferMinutes', parseInt(e.target.value, 10))} 
                                  className={`${inputClasses} w-32`} 
                                  min="0"
                                />
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {allowBarberLanguageControl && (
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md mt-4">
                          <h4 className="font-semibold mb-2">{t('allowedCustomerLanguagesTitle')}</h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t('allowedCustomerLanguagesDescription')}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {allLanguages.map(lang => (
                              <label key={lang} className="flex items-center text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editableBarber.allowedLanguages?.includes(lang) ?? false}
                                  onChange={() => handleAllowedLanguageChange(lang)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="ms-2 text-neutral-800 dark:text-neutral-200">{t(`language_${lang}` as Exclude<TranslationKey, 'days'>)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                    )}

                    <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md mt-4">
                      <h4 className="font-semibold mb-2">{t('servicesManagementTitle')}</h4>
                      <div className="space-y-2">
                        {editableBarber.services.map((service, index) => (
                        <div key={service.id} className="grid grid-cols-12 gap-2 items-center">
                          <input type="text" placeholder={t('serviceNamePlaceholder')} value={service.name} onChange={e => handleServiceChange(index, 'name', e.target.value)} className={`col-span-5 ${inputClasses}`} />
                          <div className="col-span-3 relative"><span className="absolute start-2 top-1/2 -translate-y-1/2 text-gray-500">€</span><input type="number" placeholder={t('priceLabel')} value={service.price} onChange={e => handleServiceChange(index, 'price', e.target.value)} className={`w-full ps-5 ${inputClasses}`} /></div>
                          <div className="col-span-3 relative"><input type="number" placeholder={t('durationLabel')} value={service.duration} onChange={e => handleServiceChange(index, 'duration', e.target.value)} className={`w-full pe-8 ${inputClasses}`} /><span className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{t('minutesSuffix')}</span></div>
                          <button onClick={() => handleRemoveService(index)} className="col-span-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4 mx-auto" /></button>
                        </div>
                        ))}
                      </div>
                      <button onClick={handleAddService} className="text-sm flex items-center text-primary hover:underline mt-2"><PlusCircleIcon className="w-4 h-4 me-1"/>{t('addServiceButton')}</button>
                    </div>

                    <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md">
                        <h4 className="font-semibold mb-2">{t('scheduleManagementTitle')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium">{t('workStartTimeLabel')}</label><input type="time" value={editableBarber.workStartTime} onChange={e => handleDetailChange('workStartTime', e.target.value)} className={inputClasses} /></div>
                            <div><label className="block text-xs font-medium">{t('workEndTimeLabel')}</label><input type="time" value={editableBarber.workEndTime} onChange={e => handleDetailChange('workEndTime', e.target.value)} className={inputClasses} /></div>
                        </div>
                        <div className="mt-2">
                             <div><label className="block text-xs font-medium">{t('bookableDaysInAdvanceLabel')}</label><input type="number" min="1" value={editableBarber.bookableDaysInAdvance} onChange={e => handleDetailChange('bookableDaysInAdvance', parseInt(e.target.value, 10))} className={inputClasses} /></div>
                        </div>
                        <div className="mt-4">
                            <ScheduleCalendar
                                scheduleData={{
                                    recurringClosedDays: editableBarber.recurringClosedDays,
                                    scheduleOverrides: editableBarber.scheduleOverrides,
                                }}
                                onScheduleChange={handleScheduleChange}
                                onDayClick={(date) => {
                                    setSelectedDateForSettings(date);
                                    setDaySettingsModalOpen(true);
                                }}
                            />
                        </div>
                         <div className="mt-4 border-t border-neutral-300 dark:border-neutral-600 pt-3">
                            <h4 className="font-semibold mb-2">{t('blockTimeSlotTitle')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div><label className="block text-xs font-medium">{t('dateLabel')}</label><input type="date" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} className={inputClasses} /></div>
                                <div><label className="block text-xs font-medium">{t('startTimeLabel')}</label><input type="time" value={newBlockTime} onChange={e => setNewBlockTime(e.target.value)} className={inputClasses} /></div>
                                <div><label className="block text-xs font-medium">{t('blockDurationLabel')}</label><select value={newBlockDuration} onChange={e => setNewBlockDuration(parseInt(e.target.value, 10))} className={inputClasses}><option value="30">30 min</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></div>
                            </div>
                            <button onClick={handleAddBlockedSlot} className="text-sm flex items-center text-primary hover:underline mt-2"><PlusCircleIcon className="w-4 h-4 me-1"/>{t('addBlockButton')}</button>
                            
                            {activeBlockedSlots.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">{t('activeBlockedSlots')}</h5>
                                    <ul className="text-xs space-y-1 mt-1 max-h-24 overflow-y-auto">
                                        {activeBlockedSlots.map(block => (
                                            <li key={block.id} className="flex justify-between items-center p-1 bg-neutral-200 dark:bg-neutral-600 rounded">
                                                <span>{new Date(block.date+'T00:00:00').toLocaleDateString(language, {weekday: 'short', month: 'short', day: 'numeric'})} @ {block.startTime} ({block.duration} min)</span>
                                                <button onClick={() => handleRemoveBlockedSlot(block.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-3 h-3"/></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md">
                        <h4 className="font-semibold mb-2">{t('onLocationSettingsTitle')}</h4>
                        <div>
                            <label htmlFor="onLocationMode" className="block text-xs font-medium mb-1">{t('onLocationModeLabel')}</label>
                            <select id="onLocationMode" value={editableBarber.onLocationMode} onChange={(e) => handleDetailChange('onLocationMode', e.target.value)} className={inputClasses}>
                                <option value="none">{t('onLocationMode_none')}</option>
                                <option value="optional">{t('onLocationMode_optional')}</option>
                                <option value="exclusive">{t('onLocationMode_exclusive')}</option>
                            </select>
                        </div>
                        {editableBarber.onLocationMode !== 'none' && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-2">{t('onLocationDaysLabel')}</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {dayOrder.map(dayIndexStr => {
                                    const dayIndex = Number(dayIndexStr);
                                    return (
                                        <div key={`onlocation-${dayIndex}`} className="flex items-center">
                                            <input type="checkbox" id={`onlocation-day-${dayIndex}`} checked={editableBarber.onLocationDays.includes(dayIndex)} onChange={() => handleOnLocationDaysChange(dayIndex)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                            <label htmlFor={`onlocation-day-${dayIndex}`} className="ms-2 text-sm">{daysMap[dayIndexStr]}</label>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        )}
                    </div>

                </div>
            ) : (
                <div className="text-sm space-y-2 text-neutral-700 dark:text-neutral-300">
                    <p><strong>{t('phoneLabel')}:</strong> {barber.phoneNumber || t('notSet')}</p>
                    <p><strong>{t('workHoursLabel')}:</strong> {barber.workStartTime} - {barber.workEndTime}</p>
                    <p><strong>{t('workingDaysLabel')}:</strong> {workingDaysLabels || t('notSet')}</p>
                    <p><strong>{t('servicesOffered')}:</strong> {barber.services.map(s => s.name).join(', ') || t('noServicesOffered')}</p>
                </div>
            )}
        </section>

        <section>
          <h3 className="text-xl font-semibold text-secondary mb-4">{t('myUpcomingAppointmentsTitle')}</h3>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pe-2">
              {upcomingAppointments.map(apt => (
                <div key={apt.id} className="bg-white dark:bg-neutral-800 p-3 rounded-md shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center flex-wrap gap-x-2"><CalendarIcon className="w-4 h-4 me-2 text-primary"/> {new Date(`${apt.date}T00:00:00Z`).toLocaleDateString(language, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} {t('atTimeConnector')} {apt.slotTime}</p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1"><UserCircleIcon className="w-4 h-4 me-2 text-primary"/> {apt.customerName} ({apt.customerPhone})</p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1"><strong>{t('appointmentServices')}:</strong> {apt.services.map(s => s.name).join(', ')} (€{apt.totalPrice})</p>
                        </div>
                        <button onClick={() => handleCancelAppointmentClick(apt.id)} className="p-1.5 text-red-500 hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noUpcomingAppointmentsBarber')}</p>
          )}
        </section>
      </div>
  )};

  const renderHistoryTab = () => (
      <section>
        <h3 className="text-xl font-semibold text-secondary mb-4">{t('appointmentHistoryTitle')}</h3>
        {pastAppointments.length > 0 ? (
             <div className="space-y-3 max-h-[500px] overflow-y-auto pe-2">
                {pastAppointments.map(apt => (
                    <div key={apt.id} className="bg-white dark:bg-neutral-800 p-3 rounded-md shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-neutral-100">{new Date(`${apt.date}T00:00:00Z`).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} - {apt.slotTime}</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{apt.customerName} ({apt.customerPhone})</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300"><strong>{t('appointmentServices')}:</strong> {apt.services.map(s => s.name).join(', ')} (€{apt.totalPrice})</p>
                                <p className="text-sm capitalize"><strong>{t('appointmentStatusLabel')}:</strong> {t(`status_${apt.status.replace('-', '_')}` as Exclude<TranslationKey, 'days'>)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {apt.status === 'completed' && (
                                    <button onClick={() => handleMarkAsNoShowClick(apt)} className="text-xs px-2 py-1 bg-amber-500 text-white rounded">{t('markAsNoShowButton')}</button>
                                )}
                                {apt.status === 'no-show' && (
                                    <p className="text-xs px-2 py-1 bg-red-500 text-white rounded">{t('status_no_show')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noPastAppointments')}</p>
        )}
      </section>
  );

  const renderWaitlistTab = () => (
    <section>
      <h3 className="text-xl font-semibold text-secondary mb-4">{t('dashboardTab_waitlist')}</h3>
      {waitlistAppointments.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pe-2">
          {waitlistAppointments.map(apt => (
            <div key={apt.id} className="bg-white dark:bg-neutral-800 p-3 rounded-md shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">{apt.customerName}</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{apt.customerPhone}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Original appointment: {new Date(`${apt.date}T00:00:00Z`).toLocaleDateString(language, { weekday: 'short', month: 'long', day: 'numeric', timeZone: 'UTC' })} at {apt.slotTime}
                  </p>
                </div>
                <a href={`tel:${apt.customerPhone}`} className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-md flex items-center">
                  <PhoneIcon className="w-4 h-4 me-1.5"/> Call
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">Your waitlist is empty.</p>
      )}
    </section>
  );

  const renderEarningsTab = () => {
    const { totalEarnings, totalCustomers, totalNoShows, earningsByService } = earningsData;
    const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const chartData = Object.entries(earningsByService).map(([label, value], index) => ({
        label,
        value,
        color: chartColors[index % chartColors.length]
    })).sort((a,b) => b.value - a.value);

    return (
    <section>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-secondary">{t('earningsAnalysisTitle')}</h3>
            <div className="flex rounded-lg bg-neutral-200 dark:bg-neutral-700 p-1 text-sm">
                {(['day', 'week', 'month', 'all'] as const).map(period => (
                    <button
                        key={period}
                        onClick={() => setEarningsPeriod(period)}
                        className={`px-3 py-1 rounded-md transition-colors ${earningsPeriod === period ? 'bg-white dark:bg-neutral-600 shadow' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'}`}
                    >
                        {t(`timeRange_${period}` as Exclude<TranslationKey, 'days'>)}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1"><CurrencyEuroIcon className="w-4 h-4"/>{t('totalEarnings')}</h4>
                <p className="text-3xl font-bold text-primary mt-1">€{totalEarnings.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1"><UsersIcon className="w-4 h-4"/>{t('totalCustomers')}</h4>
                <p className="text-3xl font-bold text-primary mt-1">{totalCustomers}</p>
            </div>
            <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow text-center">
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1"><ExclamationTriangleIcon className="w-4 h-4"/>{t('totalNoShows')}</h4>
                <p className="text-3xl font-bold text-amber-500 mt-1">{totalNoShows}</p>
            </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">{t('earningsByService')}</h4>
                <div className="flex rounded-lg bg-neutral-200 dark:bg-neutral-700 p-1 text-sm">
                    <button onClick={() => setChartType('pie')} className={`p-1.5 rounded-md ${chartType === 'pie' ? 'bg-white dark:bg-neutral-600 shadow' : 'text-neutral-500'}`}><ChartPieIcon className="w-5 h-5"/></button>
                    <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md ${chartType === 'bar' ? 'bg-white dark:bg-neutral-600 shadow' : 'text-neutral-500'}`}><ChartBarIcon className="w-5 h-5"/></button>
                </div>
            </div>
            {chartData.length > 0 ? (
                chartType === 'pie' ? <SimplePieChart data={chartData} /> : <SimpleBarChart data={chartData} />
            ) : (
                <p className="text-center py-10 text-neutral-500">{t('noDataForChart')}</p>
            )}
        </div>
    </section>
    );
  };
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-700 p-4 md:p-6 rounded-lg shadow-inner">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-600">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2 sm:mb-0">
            {t('welcomeBarberDashboard', { name: barber.name.split(' ')[0] })}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 text-sm flex items-center gap-2">
            <AtSymbolIcon className="w-4 h-4"/>
            {barber.email}
          </p>
        </div>
        <button onClick={onLogout} className="px-4 py-2 mt-2 sm:mt-0 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm flex items-center">
            <LogoutIcon className="w-5 h-5 me-2"/> {t('logoutButton')}
        </button>
      </div>
      
      <div className="border-b border-neutral-200 dark:border-neutral-600 mb-6">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <TabButton tabId="schedule" activeTab={activeTab} onClick={setActiveTab}>{t('dashboardTab_schedule')}</TabButton>
              <TabButton tabId="history" activeTab={activeTab} onClick={setActiveTab}>{t('dashboardTab_history')}</TabButton>
              <TabButton tabId="earnings" activeTab={activeTab} onClick={setActiveTab}>{t('dashboardTab_earnings')}</TabButton>
              {appConfig.enableWaitlist && barber.enableWaitlist && <TabButton tabId="waitlist" activeTab={activeTab} onClick={setActiveTab}>{t('dashboardTab_waitlist')}</TabButton>}
          </nav>
      </div>

      <div>
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'earnings' && renderEarningsTab()}
        {activeTab === 'waitlist' && renderWaitlistTab()}
      </div>
    </div>
  );
};

export default BarberDashboard;