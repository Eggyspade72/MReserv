

import React, { useState, useEffect, useMemo } from 'react';
import type { TranslationKey, Language } from '../translations';
import { Barber, Appointment, Expense, AppConfig, Business, ThemeName } from '../types';
import { LogoutIcon, SaveIcon, ShieldCheckIcon, PlusCircleIcon, TrashIcon, MailIcon, ArrowLeftIcon, PencilIcon, BuildingStorefrontIcon, CurrencyEuroIcon, UsersIcon, ChartPieIcon, ChartBarIcon, CogIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import BarberConfigRow from './BarberConfigRow';
import BusinessConfigRow from './BusinessConfigRow';

interface SuperAdminPanelProps {
  businesses: Business[];
  barbers: Barber[];
  appointments: Appointment[];
  expenses: Expense[];
  appConfig: AppConfig;
  onUpdateBarber: (updatedBarber: Barber) => void;
  onUpdateBusiness: (updatedBusiness: Business) => void;
  onAddBarber: (newBarber: Omit<Barber, 'id'>) => void;
  onRemoveBarber: (barberId: string) => void;
  onAddBusiness: (newBusiness: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) => void;
  onRemoveBusiness: (businessId: string) => void;
  onAddExpense: (newExpense: Omit<Expense, 'id' | 'dateAdded'>) => void;
  onRemoveExpense: (expenseId: string) => void;
  onLogout: () => void;
  onUpdateAppConfig: (newConfig: AppConfig) => void;
  onImpersonateBarber: (barberId: string) => void;
}

type NewBarberState = Omit<Barber, 'id' | 'services' | 'timeOff' | 'scheduleOverrides' | 'address' | 'preferredLanguage'>;
type NewBusinessState = Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>;

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
                        <span>{item.label}: {item.value} ({((item.value / total) * 100).toFixed(0)}%)</span>
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


const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ businesses, barbers, appointments, expenses, appConfig, onUpdateBarber, onUpdateBusiness, onAddBarber, onRemoveBarber, onAddBusiness, onRemoveBusiness, onAddExpense, onRemoveExpense, onLogout, onUpdateAppConfig, onImpersonateBarber }) => {
  const { t } = useLanguage();
  const { showConfirmation } = useConfirmation();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  
  const [activeTab, setActiveTab] = useState<'barbers' | 'subscriptions' | 'branding'>('barbers');
  const [activeTopLevelTab, setActiveTopLevelTab] = useState<'businesses' | 'financials' | 'expenses' | 'settings' | 'contact'>('businesses');
  const [editableAppConfig, setEditableAppConfig] = useState<AppConfig>(appConfig);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseType, setNewExpenseType] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);
  const [newBarber, setNewBarber] = useState<NewBarberState>({
    name: '', username: '', password: '', workStartTime: '09:00', workEndTime: '17:00', avatarUrl: '', phoneNumber: '', businessId: '', recurringClosedDays: [0, 6], bookableDaysInAdvance: 30, onLocationMode: 'none', onLocationDays: [], allowedLanguages: ['en', 'nl', 'fr', 'es', 'ar'], showServicesOnSelector: false,
  });

  const [showAddBusinessForm, setShowAddBusinessForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState<NewBusinessState>({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default'});


  useEffect(() => { setEditableAppConfig(appConfig); }, [appConfig]);
  
  const handleConfirmPayment = (businessToUpdate: Business, months: number) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const validUntil = new Date(businessToUpdate.subscriptionValidUntil);
    const startDateForRenewal = validUntil > today ? validUntil : today;
    const newValidUntilDate = new Date(startDateForRenewal);
    newValidUntilDate.setMonth(newValidUntilDate.getMonth() + months);
    if (startDateForRenewal.getDate() > newValidUntilDate.getDate()) {
        newValidUntilDate.setDate(0); 
    }
    onUpdateBusiness({ ...businessToUpdate, subscriptionStatus: 'active', subscriptionValidUntil: newValidUntilDate.toISOString().split('T')[0] });
  };
  
  const platformFinancials = useMemo(() => {
    const mrr = businesses.reduce((acc, biz) => {
        if (biz.subscriptionStatus === 'active' || biz.subscriptionStatus === 'past_due') {
            return acc + (biz.customSubscriptionPrice ?? appConfig.defaultSubscriptionPrice);
        }
        return acc;
    }, 0);
    
    const activeSubscriptions = businesses.filter(b => b.subscriptionStatus === 'active' || b.subscriptionStatus === 'past_due').length;

    const subscriptionStatusCounts = businesses.reduce((acc, biz) => {
        acc[biz.subscriptionStatus] = (acc[biz.subscriptionStatus] || 0) + 1;
        return acc;
    }, {} as Record<Business['subscriptionStatus'], number>);

    return { mrr, activeSubscriptions, totalBusinesses: businesses.length, subscriptionStatusCounts };
  }, [businesses, appConfig.defaultSubscriptionPrice]);


  const handleAddNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName.trim() || !newExpenseAmount) { alert(t('alertExpenseNameAmountRequired')); return; }
    onAddExpense({ name: newExpenseName, amount: parseFloat(newExpenseAmount), type: newExpenseType });
    setNewExpenseName(''); setNewExpenseAmount('');
  }

  const handleRemoveExpenseClick = (expense: Expense) => {
      showConfirmation({ message: t('confirmRemoveExpense', { name: expense.name }), onConfirm: () => onRemoveExpense(expense.id) })
  }

  const handleNewBarberChange = (field: keyof NewBarberState, value: any) => {
    setNewBarber(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarber.name.trim() || !newBarber.username.trim() || !newBarber.password?.trim() || !selectedBusiness) {
        alert(t('alertNameUsernamePasswordRequired')); return;
    }
    const barberToAdd: Omit<Barber, 'id'> = {
        ...newBarber,
        businessId: selectedBusiness.id,
        bookableDaysInAdvance: Number(newBarber.bookableDaysInAdvance),
        avatarUrl: newBarber.avatarUrl || `https://picsum.photos/seed/${new Date().getTime()}/200/200`,
        services: [], timeOff: [], scheduleOverrides: {}, showPricesOnBooking: true, preferredLanguage: 'nl'
    };
    onAddBarber(barberToAdd);
    setNewBarber({ name: '', username: '', password: '', workStartTime: '09:00', workEndTime: '17:00', avatarUrl: '', phoneNumber: '', businessId: '', recurringClosedDays: [0, 6], bookableDaysInAdvance: 30, onLocationMode: 'none', onLocationDays: [], allowedLanguages: ['en', 'nl', 'fr', 'es', 'ar'], showServicesOnSelector: false });
    setShowAddBarberForm(false);
  };

  const handleNewBusinessChange = (field: keyof NewBusinessState, value: string) => {
      setNewBusiness(prev => ({...prev, [field]: value}));
  }

  const handleAddNewBusiness = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBusiness.name.trim()) {
          alert(t('alertBusinessNameRequired'));
          return;
      }
      onAddBusiness(newBusiness);
      setNewBusiness({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default'});
      setShowAddBusinessForm(false);
  }

  const TopLevelTabButton: React.FC<{tabId: 'businesses' | 'financials' | 'expenses' | 'settings' | 'contact', children: React.ReactNode}> = ({ tabId, children }) => (
    <button onClick={() => setActiveTopLevelTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTopLevelTab === tabId ? 'border-red-500 text-red-500' : 'border-transparent text-neutral-500 hover:text-red-500'}`}>
        {children}
    </button>
  );

  const BusinessMgmtTabButton: React.FC<{tabId: 'barbers' | 'subscriptions' | 'branding', children: React.ReactNode}> = ({ tabId, children }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}>
        {children}
    </button>
  );

  const renderBusinessManagementView = () => {
    if (!selectedBusiness) return null;
    const editableBusiness = businesses.find(b => b.id === selectedBusiness.id);
    if (!editableBusiness) return null;

    const barbersForBusiness = barbers.filter(b => b.businessId === selectedBusiness.id);
    const appointmentsForBusiness = appointments.filter(a => a.businessId === selectedBusiness.id);
    
    const statusOptions = ['active', 'trial', 'past_due', 'cancelled'] as const;
    const themes: { name: ThemeName; colors: string[] }[] = [
        { name: 'default', colors: ['#3B82F6', '#10B981', '#F59E0B'] },
        { name: 'oceanic', colors: ['#14B8A6', '#06B6D4', '#EA580C'] },
        { name: 'sunset', colors: ['#F97316', '#EF4444', '#D97706'] },
    ];


    return (
        <div>
            <button onClick={() => setSelectedBusiness(null)} className="mb-6 flex items-center text-sm text-primary hover:text-blue-500"><ArrowLeftIcon className="w-4 h-4 me-2" />{t('backToBusinessList')}</button>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold">{t('businessManagementFor', { name: selectedBusiness.name })}</h2>
            </div>


            <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <BusinessMgmtTabButton tabId="barbers">{t('dashboardTab_barbers')}</BusinessMgmtTabButton>
                    <BusinessMgmtTabButton tabId="subscriptions">{t('dashboardTab_subscriptions')}</BusinessMgmtTabButton>
                    <BusinessMgmtTabButton tabId="branding">{t('dashboardTab_branding')}</BusinessMgmtTabButton>
                </nav>
            </div>

            {activeTab === 'barbers' && (
              <div>
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2 sm:mb-0">{t('adminManageBarbersTitle')}</h3>
                      <button type="button" onClick={() => setShowAddBarberForm(!showAddBarberForm)} className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center">
                          <PlusCircleIcon className="w-5 h-5 me-2" />
                          {showAddBarberForm ? t('cancelAddBarber') : t('addNewBarber')}
                      </button>
                  </div>
                  {showAddBarberForm && (
                    <form onSubmit={handleAddNewBarber} className="bg-white dark:bg-neutral-700 p-4 rounded-md shadow-md mb-6 space-y-4">
                      <h3 className="text-xl font-medium text-primary mb-3">{t('newBarberDetailsTitle')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label htmlFor="newName" className="block text-sm font-medium">{t('fullNameLabel')}</label><input type="text" id="newName" value={newBarber.name} onChange={e => handleNewBarberChange('name', e.target.value)} className="w-full p-2 rounded-md text-sm" required /></div>
                        <div><label htmlFor="newUsername" className="block text-sm font-medium">{t('usernameLabel')}</label><input type="text" id="newUsername" value={newBarber.username} onChange={e => handleNewBarberChange('username', e.target.value)} className="w-full p-2 rounded-md text-sm" required /></div>
                        <div><label htmlFor="newPassword" className="block text-sm font-medium">{t('passwordLabel')}</label><input type="password" id="newPassword" value={newBarber.password || ''} onChange={e => handleNewBarberChange('password', e.target.value)} className="w-full p-2 rounded-md text-sm" required /></div>
                      </div>
                      <button type="submit" className="w-full mt-2 px-4 py-2.5 bg-secondary hover:bg-emerald-600 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center"><SaveIcon className="w-5 h-5 me-2"/> {t('addBarberButton')}</button>
                    </form>
                  )}
                  <div className="space-y-6">
                      {barbersForBusiness.map(barber => (
                          <BarberConfigRow
                              key={barber.id} barber={barber}
                              appointments={appointmentsForBusiness.filter(a => a.barberId === barber.id)}
                              onUpdateBarber={onUpdateBarber} onRemoveBarber={onRemoveBarber}
                              onCancelAppointment={() => {}} onImpersonate={onImpersonateBarber}
                          />
                      ))}
                  </div>
                  {barbersForBusiness.length === 0 && !showAddBarberForm && <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noBarbersConfigured')}</p>}
              </div>
            )}
            {activeTab === 'subscriptions' && (
                 <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('subscriptionStatusLabel')}</label>
                              <select value={editableBusiness.subscriptionStatus} onChange={e => onUpdateBusiness({ ...editableBusiness, subscriptionStatus: e.target.value as Business['subscriptionStatus']})} className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 text-sm">
                                  {statusOptions.map(opt => <option key={opt} value={opt}>{t(`status_${opt}` as Exclude<TranslationKey, 'days'>)}</option>)}
                              </select>
                          </div>
                           <div>
                              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('subscriptionValidUntilLabel')}</label>
                              <input type="date" value={editableBusiness.subscriptionValidUntil} onChange={e => onUpdateBusiness({ ...editableBusiness, subscriptionValidUntil: e.target.value })} className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 text-sm"/>
                          </div>
                     </div>
                     <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-t border-neutral-200 dark:border-neutral-600 pt-4">
                          <div>
                             <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('customMonthlyPriceLabel')}</label>
                              <input type="number" step="0.01" value={editableBusiness.customSubscriptionPrice || ''} onChange={e => onUpdateBusiness({ ...editableBusiness, customSubscriptionPrice: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder={t('defaultPriceWithAmount', { price: appConfig.defaultSubscriptionPrice })} className="w-full max-w-[180px] p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 text-sm"/>
                         </div>
                         <div className="flex-shrink-0 flex rounded-lg shadow-md self-center sm:self-end">
                             {[1, 6, 12].map(months => (
                                  <button key={months} onClick={() => handleConfirmPayment(editableBusiness, months)} className="px-3 py-2 bg-secondary hover:bg-emerald-600 text-white font-semibold transition duration-150 flex items-center text-xs first:rounded-s-lg last:rounded-e-lg border-e border-emerald-700 last:border-e-0">
                                     +{months}{t(`timeAbbreviation_${months === 1 ? 'month' : 'months'}` as Exclude<TranslationKey, 'days'>)}
                                 </button>
                             ))}
                         </div>
                     </div>
                      <div className="flex items-center">
                          <input type="checkbox" id={`suppress-${editableBusiness.id}`} checked={!!editableBusiness.suppressGracePeriodWarning} onChange={e => onUpdateBusiness({ ...editableBusiness, suppressGracePeriodWarning: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                          <label htmlFor={`suppress-${editableBusiness.id}`} className="ms-2 text-xs text-neutral-600 dark:text-neutral-300">{t('suppressWarningsLabel')}</label>
                      </div>
                 </div>
            )}
            {activeTab === 'branding' && (
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold mb-3">{t('themeSelectionTitle')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themes.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => onUpdateBusiness({ ...editableBusiness, theme: theme.name })}
                                className={`p-4 rounded-lg border-2 transition-all ${editableBusiness.theme === theme.name ? 'border-primary shadow-lg scale-105' : 'border-neutral-200 dark:border-neutral-600 hover:border-primary/50'}`}
                            >
                                <p className="font-semibold text-center mb-3 capitalize">{t(`theme_${theme.name}` as Exclude<TranslationKey, 'days'>)}</p>
                                <div className="flex justify-center gap-2">
                                    {theme.colors.map((color, index) => (
                                        <div key={index} className="w-8 h-8 rounded-full" style={{ backgroundColor: color }}></div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  }

  const renderTopLevelView = () => {
      const { mrr, activeSubscriptions, totalBusinesses, subscriptionStatusCounts } = platformFinancials;
      const chartColors = {
        active: '#10B981', // emerald
        trial: '#3B82F6', // blue
        past_due: '#F59E0B', // amber
        cancelled: '#EF4444' // red
      };

      const statusChartData = Object.entries(subscriptionStatusCounts).map(([status, count]) => ({
          label: t(`status_${status.replace('-', '_')}` as Exclude<TranslationKey, 'days'>),
          value: count,
          color: chartColors[status as keyof typeof chartColors]
      }));

      const revenueChartData = businesses
        .filter(b => b.subscriptionStatus === 'active' || b.subscriptionStatus === 'past_due')
        .map((biz, index) => ({
            label: biz.name,
            value: (biz.customSubscriptionPrice ?? appConfig.defaultSubscriptionPrice),
            color: Object.values(chartColors)[index % Object.values(chartColors).length]
        })).sort((a,b) => b.value - a.value);


      return (
    <>
      <div className="border-b border-neutral-200 dark:border-neutral-600 mb-6">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
            <TopLevelTabButton tabId="businesses">{t('dashboardTab_businesses')}</TopLevelTabButton>
            <TopLevelTabButton tabId="financials">{t('dashboardTab_financials')}</TopLevelTabButton>
            <TopLevelTabButton tabId="expenses">{t('dashboardTab_expenses')}</TopLevelTabButton>
            <TopLevelTabButton tabId="settings">{t('dashboardTab_settings')}</TopLevelTabButton>
            <TopLevelTabButton tabId="contact">{t('dashboardTab_contact')}</TopLevelTabButton>
        </nav>
      </div>

      {activeTopLevelTab === 'businesses' && (
        <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{t('businessManagementTitle')}</h3>
              <button onClick={() => setShowAddBusinessForm(true)} className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center text-sm">
                <PlusCircleIcon className="w-5 h-5 me-2"/>
                {t('addBusinessButton')}
              </button>
            </div>

            {showAddBusinessForm && (
                 <form onSubmit={handleAddNewBusiness} className="bg-white dark:bg-neutral-700 p-4 rounded-md shadow-md mb-6 space-y-4">
                      <h3 className="text-xl font-medium text-primary mb-3">{t('newBusinessDetailsTitle')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="newBizName" className="block text-sm font-medium">{t('businessNameLabel')}</label><input type="text" id="newBizName" value={newBusiness.name} onChange={e => handleNewBusinessChange('name', e.target.value)} className="w-full p-2 rounded-md text-sm" placeholder={t('businessNamePlaceholder')} required /></div>
                        <div><label htmlFor="newBizOwner" className="block text-sm font-medium">{t('ownerNameLabel')}</label><input type="text" id="newBizOwner" value={newBusiness.ownerName || ''} onChange={e => handleNewBusinessChange('ownerName', e.target.value)} className="w-full p-2 rounded-md text-sm" placeholder={t('ownerNamePlaceholder')} /></div>
                        <div><label htmlFor="newBizEmail" className="block text-sm font-medium">{t('ownerEmailLabel')}</label><input type="email" id="newBizEmail" value={newBusiness.ownerEmail || ''} onChange={e => handleNewBusinessChange('ownerEmail', e.target.value)} className="w-full p-2 rounded-md text-sm" placeholder={t('ownerEmailPlaceholder')} /></div>
                         <div><label htmlFor="newBizAddress" className="block text-sm font-medium">{t('addressLabel')}</label><input type="text" id="newBizAddress" value={newBusiness.address || ''} onChange={e => handleNewBusinessChange('address', e.target.value)} className="w-full p-2 rounded-md text-sm" placeholder={t('addressPlaceholderOptional')} /></div>
                      </div>
                      <div className="flex justify-end gap-3">
                         <button type="button" onClick={() => setShowAddBusinessForm(false)} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-100 font-medium rounded-md transition duration-150 text-sm">
                            {t('cancelButton')}
                         </button>
                         <button type="submit" className="px-4 py-2.5 bg-secondary hover:bg-emerald-600 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center text-sm">
                            <SaveIcon className="w-5 h-5 me-2"/> {t('addBusinessButton')}
                         </button>
                      </div>
                    </form>
            )}

            <div className="space-y-4">
                {businesses.length > 0 ? (
                    businesses.map(business => (
                        <BusinessConfigRow 
                            key={business.id}
                            business={business}
                            onManage={() => setSelectedBusiness(business)}
                            onRemove={() => onRemoveBusiness(business.id)}
                            onUpdateBusiness={onUpdateBusiness}
                        />
                    ))
                ) : (
                    <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('noBusinessesConfigured')}</p>
                )}
            </div>
        </div>
      )}
      
      {activeTopLevelTab === 'financials' && (
        <div>
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('financialOverviewTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center text-center">
                    <CurrencyEuroIcon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('monthlyRecurringRevenue')}</h4>
                    <p className="text-3xl font-bold text-primary mt-1">€{mrr.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center text-center">
                    <ShieldCheckIcon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('totalActiveSubscriptions')}</h4>
                    <p className="text-3xl font-bold text-primary mt-1">{activeSubscriptions}</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow flex flex-col items-center justify-center text-center">
                    <BuildingStorefrontIcon className="w-8 h-8 text-primary mb-2" />
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('totalBusinesses')}</h4>
                    <p className="text-3xl font-bold text-primary mt-1">{totalBusinesses}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
                    <h4 className="text-lg font-semibold mb-4">{t('subscriptionStatusChartTitle')}</h4>
                    <SimplePieChart data={statusChartData} />
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
                     <h4 className="text-lg font-semibold mb-4">{t('revenueByBusinessTitle')}</h4>
                     <SimpleBarChart data={revenueChartData} />
                </div>
            </div>

             <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow mt-6">
                <h4 className="text-lg font-semibold mb-4">{t('revenueByBusinessTitle')}</h4>
                <div className="space-y-2">
                    {businesses.map(biz => (
                        <div key={biz.id} className="flex justify-between items-center p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                            <div>
                                <p className="font-medium text-neutral-800 dark:text-neutral-200">{biz.name}</p>
                                <p className={`text-xs capitalize font-bold ${biz.subscriptionStatus === 'active' ? 'text-green-500' : 'text-amber-500'}`}>{t(`status_${biz.subscriptionStatus}` as Exclude<TranslationKey, 'days'>)}</p>
                            </div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                €{(biz.customSubscriptionPrice ?? appConfig.defaultSubscriptionPrice).toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeTopLevelTab === 'expenses' && (
        <div>
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('expenseManagementTitle')}</h3>
            <form onSubmit={handleAddNewExpense} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white dark:bg-neutral-700 p-4 rounded-lg shadow-md mb-6">
                <div className="md:col-span-5"><label htmlFor="expName" className="block text-sm font-medium">{t('expenseNameLabel')}</label><input type="text" id="expName" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} placeholder={t('expenseNamePlaceholder')} className="w-full p-2 rounded-md" required /></div>
                <div className="md:col-span-3"><label htmlFor="expAmount" className="block text-sm font-medium">{t('expenseAmountLabel')}</label><input type="number" id="expAmount" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} step="0.01" min="0" placeholder="e.g., 19.99" className="w-full p-2 rounded-md" required /></div>
                <div className="md:col-span-2"><label htmlFor="expType" className="block text-sm font-medium">{t('expenseTypeLabel')}</label><select id="expType" value={newExpenseType} onChange={e => setNewExpenseType(e.target.value as any)} className="w-full p-2 rounded-md"><option value="monthly">{t('expenseType_monthly')}</option><option value="yearly">{t('expenseType_yearly')}</option><option value="one-time">{t('expenseType_one_time')}</option></select></div>
                <div className="md:col-span-2"><button type="submit" className="w-full px-4 py-2 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition duration-150 flex items-center justify-center"><PlusCircleIcon className="w-5 h-5 me-2" />{t('addExpenseButton')}</button></div>
            </form>
            <div className="space-y-3">
                {expenses.length > 0 ? expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
                        <div><p className="font-medium text-neutral-900 dark:text-neutral-100">{exp.name}</p><p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{t(`expenseType_${exp.type.replace('-', '_')}` as Exclude<TranslationKey, 'days'>)}</p></div>
                        <div className="flex items-center gap-4"><p className="font-semibold text-lg text-amber-600 dark:text-amber-400">€{exp.amount.toFixed(2)}</p><button onClick={() => handleRemoveExpenseClick(exp)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button></div>
                    </div>
                )) : <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('noExpensesTracked')}</p>}
            </div>
        </div>
      )}

      {activeTopLevelTab === 'settings' && (
         <div>
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('appSettingsTitle')}</h3>
            <div className="bg-white dark:bg-neutral-700 p-6 rounded-lg shadow-md space-y-4">
              <div>
                  <label htmlFor="appName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('appNameLabel')}</label>
                  <input type="text" id="appName" value={editableAppConfig.appName} onChange={e => onUpdateAppConfig({ ...editableAppConfig, appName: e.target.value })} className="w-full p-2 rounded-md text-sm bg-neutral-100 dark:bg-neutral-600" />
              </div>
               <div className="flex items-center pt-2">
                  <input type="checkbox" id="showServicesOnSelector" checked={editableAppConfig.showServicesOnSelector} onChange={e => onUpdateAppConfig({ ...editableAppConfig, showServicesOnSelector: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="showServicesOnSelector" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('showServicesOnSelectorLabel')}</label>
              </div>
              <div className="flex items-center pt-2">
                  <input type="checkbox" id="allowBarberLanguageControl" checked={editableAppConfig.allowBarberLanguageControl} onChange={e => onUpdateAppConfig({ ...editableAppConfig, allowBarberLanguageControl: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="allowBarberLanguageControl" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('allowBarberLanguageControlLabel')}</label>
              </div>
            </div>
        </div>
      )}

      {activeTopLevelTab === 'contact' && (
         <div>
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('contactSettingsTitle')}</h3>
            <div className="bg-white dark:bg-neutral-700 p-6 rounded-lg shadow-md">
                <label htmlFor="contactEmail" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('contactEmailLabel')}</label>
                <input type="email" id="contactEmail" value={editableAppConfig.contactEmail || ''} onChange={e => onUpdateAppConfig({ ...editableAppConfig, contactEmail: e.target.value })} className="w-full p-2 rounded-md text-sm bg-neutral-100 dark:bg-neutral-600" placeholder={t('contactEmailPlaceholder')} />
            </div>
        </div>
      )}
    </>
    )
  };

  return (
    <div className="bg-neutral-100 dark:bg-neutral-700 p-4 md:p-6 rounded-lg shadow-inner">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-neutral-300 dark:border-neutral-600">
        <h2 className="text-2xl md:text-3xl font-semibold text-red-500 flex items-center mb-3 sm:mb-0">
            <ShieldCheckIcon className="w-8 h-8 me-3"/>{t('superAdminPanelTitle')}
        </h2>
        <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm flex items-center">
            <LogoutIcon className="w-5 h-5 me-2"/> {t('exitSuperAdminMode')}
        </button>
      </div>
      
      {selectedBusiness ? renderBusinessManagementView() : renderTopLevelView()}
    </div>
  );
};

export default SuperAdminPanel;