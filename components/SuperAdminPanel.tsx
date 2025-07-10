


import React, { useState, useEffect, useMemo } from 'react';
import type { TranslationKey, Language } from '../translations';
import { Barber, Appointment, Expense, AppConfig, Business, ThemeName } from '../types';
import * as api from '../services/api';
import { LogoutIcon, SaveIcon, ShieldCheckIcon, PlusCircleIcon, TrashIcon, MailIcon, ArrowLeftIcon, PencilIcon, BuildingStorefrontIcon, CurrencyEuroIcon, UsersIcon, ChartPieIcon, ChartBarIcon, CogIcon, ExclamationTriangleIcon } from './Icons';
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
  onAddBarber: (newBarber: api.SignUpCredentials, businessId: string) => void;
  onRemoveBarber: (barberId: string) => void;
  onAddBusiness: (newBusiness: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) => void;
  onRemoveBusiness: (businessId: string) => void;
  onAddExpense: (newExpense: Omit<Expense, 'id' | 'dateAdded'>) => void;
  onRemoveExpense: (expenseId: string) => void;
  onLogout: () => void;
  onUpdateAppConfig: (newConfig: AppConfig) => void;
  onImpersonateBarber: (barberId: string) => void;
}

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

const SimpleLineChart: React.FC<{ data: { label: string; value: number }[]; title: string }> = ({ data, title }) => {
    if (!data || data.length < 2) return <div className="text-center text-neutral-500 py-10">Not enough data for chart.</div>;

    const maxValue = Math.max(...data.map(d => d.value)) * 1.1 || 10; // Add 10% padding, or set a minimum to avoid division by zero
    const minValue = 0;

    const points = data.map((point, i, arr) => {
        const x = (i / (arr.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
        return `${x},${y}`;
    }).join(' ');

    const yAxisLabels = 5;
    const yLabels = Array.from({ length: yAxisLabels + 1 }, (_, i) => {
        return Math.round(minValue + (i * (maxValue - minValue)) / yAxisLabels);
    });

    return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow mt-6">
            <h4 className="text-lg font-semibold mb-8 text-center">{title}</h4>
            <div className="h-64 relative">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 left-0 overflow-visible">
                    {yLabels.map((label, i) => (
                        <g key={i} className="text-xs text-neutral-500 dark:text-neutral-400">
                            <text x="-2" y={100 - (i * 100 / yAxisLabels)} dominantBaseline="middle" textAnchor="end">
                                €{label}
                            </text>
                            <line
                                x1="0" y1={100 - (i * 100 / yAxisLabels)}
                                x2="100" y2={100 - (i * 100 / yAxisLabels)}
                                stroke="currentColor"
                                strokeWidth="0.2"
                                strokeDasharray="2"
                                className="text-neutral-200 dark:text-neutral-700"
                            />
                        </g>
                    ))}
                    {data.map((point, i, arr) => (
                        <g key={i} className="text-xs text-neutral-500 dark:text-neutral-400">
                            <text x={(i / (arr.length - 1)) * 100} y="108" dominantBaseline="middle" textAnchor="middle">
                                {point.label}
                            </text>
                        </g>
                    ))}
                    <polyline fill="none" stroke="rgb(var(--color-primary))" strokeWidth="1" points={points} />
                    {data.map((point, i, arr) => {
                        const x = (i / (arr.length - 1)) * 100;
                        const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
                        return <circle key={i} cx={x} cy={y} r="1.5" fill="rgb(var(--color-primary))" />;
                    })}
                </svg>
            </div>
        </div>
    );
};


const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ businesses, barbers, appointments, expenses, appConfig, onUpdateBarber, onUpdateBusiness, onAddBarber, onRemoveBarber, onAddBusiness, onRemoveBusiness, onAddExpense, onRemoveExpense, onLogout, onUpdateAppConfig, onImpersonateBarber }) => {
  const { t, language } = useLanguage();
  const { showConfirmation } = useConfirmation();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [editableBusiness, setEditableBusiness] = useState<Business | null>(null);
  
  const [activeTab, setActiveTab] = useState<'barbers' | 'businessSettings'>('barbers');
  const [activeTopLevelTab, setActiveTopLevelTab] = useState<'businesses' | 'financials' | 'expenses' | 'settings'>('businesses');
  const [editableAppConfig, setEditableAppConfig] = useState<AppConfig>(appConfig);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseType, setNewExpenseType] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');
  
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);
  const [newBarberCreds, setNewBarberCreds] = useState({email: '', password: '', name: ''});

  const [showAddBusinessForm, setShowAddBusinessForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState<NewBusinessState>({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default', customSubscriptionPrice: null, suppressGracePeriodWarning: false, enableCancellationFee: false, cancellationFeeHours: 24, cancellationFeeAmount: 15 });

  useEffect(() => { setEditableAppConfig(appConfig); }, [appConfig]);
  
  // When the master 'businesses' prop updates, ensure our selected and editable states are synced
  useEffect(() => {
    if (selectedBusiness) {
      const updatedBusiness = businesses.find(b => b.id === selectedBusiness.id);
      if (updatedBusiness) {
        setSelectedBusiness(updatedBusiness);
        setEditableBusiness(updatedBusiness);
      } else {
        // The business was likely deleted, so go back to the list
        setSelectedBusiness(null);
        setEditableBusiness(null);
      }
    }
  }, [businesses, selectedBusiness]);

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
    const updatedBusiness = { ...businessToUpdate, subscriptionStatus: 'active', subscriptionValidUntil: newValidUntilDate.toISOString().split('T')[0] } as Business;
    onUpdateBusiness(updatedBusiness);
    setEditableBusiness(updatedBusiness); // also update editable state
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

  const handleAddNewBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberCreds.email.trim() || !newBarberCreds.password.trim() || !newBarberCreds.name.trim()) {
        alert(t('alertNameEmailPasswordRequired')); return;
    }
    if (!selectedBusiness) {
        console.error("Cannot add barber without a selected business.");
        return;
    }
    onAddBarber(newBarberCreds, selectedBusiness.id);
    setNewBarberCreds({ email: '', password: '', name: '' });
    setShowAddBarberForm(false);
  };

  const handleNewBusinessChange = (field: keyof Omit<NewBusinessState, 'theme' | 'customSubscriptionPrice' | 'suppressGracePeriodWarning'>, value: string) => {
      setNewBusiness(prev => ({...prev, [field]: value}));
  }

  const handleAddNewBusiness = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBusiness.name.trim()) {
          alert(t('alertBusinessNameRequired'));
          return;
      }
      onAddBusiness(newBusiness);
      setNewBusiness({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default', customSubscriptionPrice: null, suppressGracePeriodWarning: false, enableCancellationFee: false, cancellationFeeHours: 24, cancellationFeeAmount: 15 });
      setShowAddBusinessForm(false);
  }

  const handleAppConfigChange = (field: keyof AppConfig, value: any) => {
    setEditableAppConfig(prev => ({ ...prev!, [field]: value }));
  };

  const handleSaveAppConfig = () => {
    onUpdateAppConfig(editableAppConfig);
  };

  const handleBusinessFieldChange = (field: keyof Business, value: any) => {
    setEditableBusiness(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveBusiness = () => {
    if (editableBusiness) {
      onUpdateBusiness(editableBusiness);
    }
  };

    const pastEarnings = useMemo(() => {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
        twelveMonthsAgo.setUTCDate(1);
        twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

        const completedAppointments = appointments.filter(apt => {
            const aptDate = new Date(`${apt.date}T00:00:00Z`);
            return apt.status === 'completed' && aptDate >= twelveMonthsAgo;
        });

        const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setUTCMonth(date.getUTCMonth() - i);
            return {
                year: date.getUTCFullYear(),
                month: date.getUTCMonth(),
                total: 0,
                label: date.toLocaleDateString(language, { month: 'short', year: '2-digit', timeZone: 'UTC' })
            };
        }).reverse();

        completedAppointments.forEach(apt => {
            const aptDate = new Date(`${apt.date}T00:00:00Z`);
            const year = aptDate.getUTCFullYear();
            const month = aptDate.getUTCMonth();

            const monthBin = monthlyTotals.find(m => m.year === year && m.month === month);
            if (monthBin) {
                monthBin.total += apt.totalPrice;
            }
        });
        
        const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        
        return monthlyTotals.map((m, index) => ({
            label: m.label,
            value: m.total,
            color: chartColors[index % chartColors.length]
        }));
    }, [appointments, language]);


  const TopLevelTabButton: React.FC<{tabId: 'businesses' | 'financials' | 'expenses' | 'settings', children: React.ReactNode}> = ({ tabId, children }) => (
    <button onClick={() => setActiveTopLevelTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTopLevelTab === tabId ? 'border-red-500 text-red-500' : 'border-transparent text-neutral-500 hover:text-red-500'}`}>
        {children}
    </button>
  );

  const BusinessMgmtTabButton: React.FC<{tabId: 'barbers' | 'businessSettings', children: React.ReactNode}> = ({ tabId, children }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}>
        {children}
    </button>
  );

  const renderBusinessManagementView = () => {
    if (!selectedBusiness || !editableBusiness) return null;
    
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <button onClick={() => setSelectedBusiness(null)} className="flex items-center text-sm text-primary hover:text-blue-500"><ArrowLeftIcon className="w-4 h-4 me-2" />{t('backToBusinessList')}</button>
              <h2 className="text-2xl font-bold text-end">{t('businessManagementFor', { name: selectedBusiness.name })}</h2>
            </div>


            <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <BusinessMgmtTabButton tabId="barbers">{t('dashboardTab_barbers')}</BusinessMgmtTabButton>
                    <BusinessMgmtTabButton tabId="businessSettings">{t('dashboardTab_businessSettings')}</BusinessMgmtTabButton>
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
                        <div><label htmlFor="newBarberName" className="block text-sm font-medium">{t('fullNameLabel')}</label><input type="text" id="newBarberName" value={newBarberCreds.name} onChange={e => setNewBarberCreds(p => ({...p, name: e.target.value}))} className="w-full p-2 rounded-md text-sm" required /></div>
                        <div><label htmlFor="newBarberEmail" className="block text-sm font-medium">{t('ownerEmailLabel')}</label><input type="email" id="newBarberEmail" value={newBarberCreds.email} onChange={e => setNewBarberCreds(p => ({...p, email: e.target.value}))} className="w-full p-2 rounded-md text-sm" required /></div>
                        <div><label htmlFor="newBarberPassword" className="block text-sm font-medium">{t('passwordLabel')}</label><input type="password" id="newBarberPassword" value={newBarberCreds.password} onChange={e => setNewBarberCreds(p => ({...p, password: e.target.value}))} className="w-full p-2 rounded-md text-sm" required /></div>
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
            {activeTab === 'businessSettings' && (
              <div className="space-y-6">
                {/* Subscription Settings */}
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold">{t('dashboardTab_subscriptions')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('subscriptionStatusLabel')}</label>
                          <select value={editableBusiness.subscriptionStatus} onChange={e => handleBusinessFieldChange('subscriptionStatus', e.target.value as Business['subscriptionStatus'])} className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 text-sm">
                              {statusOptions.map(opt => <option key={opt} value={opt}>{t(`status_${opt}` as Exclude<TranslationKey, 'days'>)}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('subscriptionValidUntilLabel')}</label>
                          <input type="date" value={editableBusiness.subscriptionValidUntil} onChange={e => handleBusinessFieldChange('subscriptionValidUntil', e.target.value)} className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 text-sm"/>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-t border-neutral-200 dark:border-neutral-600 pt-4">
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('customMonthlyPriceLabel')}</label>
                          <input type="number" step="0.01" value={editableBusiness.customSubscriptionPrice ?? ''} onChange={e => handleBusinessFieldChange('customSubscriptionPrice', e.target.value ? parseFloat(e.target.value) : null)} placeholder={t('defaultPriceWithAmount', { price: appConfig.defaultSubscriptionPrice })} className="w-full max-w-[180px] p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 text-sm"/>
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
                      <input type="checkbox" id={`suppress-${editableBusiness.id}`} checked={!!editableBusiness.suppressGracePeriodWarning} onChange={e => handleBusinessFieldChange('suppressGracePeriodWarning', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <label htmlFor={`suppress-${editableBusiness.id}`} className="ms-2 text-xs text-neutral-600 dark:text-neutral-300">{t('suppressWarningsLabel')}</label>
                  </div>
                </div>

                {/* Cancellation Fee Settings */}
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
                  <h4 className="text-lg font-semibold mb-3">{t('cancellationFeeTitle')}</h4>
                  <div className="flex items-center mb-3">
                      <input type="checkbox" id={`enableCancellation-${editableBusiness.id}`} checked={!!editableBusiness.enableCancellationFee} onChange={e => handleBusinessFieldChange('enableCancellationFee', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <label htmlFor={`enableCancellation-${editableBusiness.id}`} className="ms-2 text-sm text-neutral-600 dark:text-neutral-300">{t('enableCancellationFeeLabelBusiness')}</label>
                  </div>
                  {editableBusiness.enableCancellationFee && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeHoursLabel')}</label>
                            <input type="number" value={editableBusiness.cancellationFeeHours} onChange={e => handleBusinessFieldChange('cancellationFeeHours', parseInt(e.target.value) || 0 )} className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 text-sm"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeAmountLabel')}</label>
                            <input type="number" step="0.01" value={editableBusiness.cancellationFeeAmount} onChange={e => handleBusinessFieldChange('cancellationFeeAmount', parseFloat(e.target.value) || 0 )} className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-600 text-sm"/>
                        </div>
                    </div>
                  )}
                </div>

                {/* Branding Settings */}
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold mb-3">{t('themeSelectionTitle')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themes.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => handleBusinessFieldChange('theme', theme.name)}
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

                <div className="flex justify-end pt-4">
                  <button onClick={handleSaveBusiness} className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center text-sm">
                    <SaveIcon className="w-5 h-5 me-2" />
                    {t('saveChangesButton')}
                  </button>
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

      const monthLabels = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            return date.toLocaleDateString(language, { month: 'short' });
        });
      }, [language]);

      const projectedData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
        return {
            label: monthLabels[i],
            value: mrr
        };
      }), [monthLabels, mrr]);

      return (
    <>
      <div className="border-b border-neutral-200 dark:border-neutral-600 mb-6">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
            <TopLevelTabButton tabId="businesses">{t('dashboardTab_businesses')}</TopLevelTabButton>
            <TopLevelTabButton tabId="financials">{t('dashboardTab_financials')}</TopLevelTabButton>
            <TopLevelTabButton tabId="expenses">{t('dashboardTab_expenses')}</TopLevelTabButton>
            <TopLevelTabButton tabId="settings">{t('dashboardTab_settings')}</TopLevelTabButton>
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
                            onManage={() => {
                              setSelectedBusiness(business);
                              setEditableBusiness(JSON.parse(JSON.stringify(business))); // Deep copy to avoid mutation
                            }}
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
                    {statusChartData.length > 0 ? <SimplePieChart data={statusChartData} /> : <p className="text-center py-10 text-neutral-500">{t('noDataForChart')}</p>}
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
                     <h4 className="text-lg font-semibold mb-4">{t('revenueByBusinessTitle')}</h4>
                     {revenueChartData.length > 0 ? <SimpleBarChart data={revenueChartData} /> : <p className="text-center py-10 text-neutral-500">{t('noDataForChart')}</p>}
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow mt-6">
                <h4 className="text-lg font-semibold mb-4 text-center">{t('pastMonthlyEarningsTitle')}</h4>
                {pastEarnings.length > 0 ? <SimpleBarChart data={pastEarnings} /> : <p className="text-center py-10 text-neutral-500">{t('noDataForChart')}</p>}
            </div>
            
            <SimpleLineChart title={t('projectedMonthlyRevenueTitle')} data={projectedData} />
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
                  <input type="text" id="appName" value={editableAppConfig.appName} onChange={e => handleAppConfigChange('appName', e.target.value)} className="w-full p-2 rounded-md text-sm bg-neutral-100 dark:bg-neutral-600" />
              </div>
               <div className="flex items-center pt-2">
                  <input type="checkbox" id="showServicesOnSelector" checked={editableAppConfig.showServicesOnSelector} onChange={e => handleAppConfigChange('showServicesOnSelector', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="showServicesOnSelector" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('showServicesOnSelectorLabel')}</label>
              </div>
              <div className="flex items-center pt-2">
                  <input type="checkbox" id="allowBarberLanguageControl" checked={editableAppConfig.allowBarberLanguageControl} onChange={e => handleAppConfigChange('allowBarberLanguageControl', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="allowBarberLanguageControl" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('allowBarberLanguageControlLabel')}</label>
              </div>
              <div className="flex items-center pt-2">
                  <input type="checkbox" id="enableWaitlist" checked={editableAppConfig.enableWaitlist} onChange={e => handleAppConfigChange('enableWaitlist', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="enableWaitlist" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('enableWaitlistFeatureLabel')}</label>
              </div>
              <div className="flex items-center pt-2">
                  <input type="checkbox" id="enableWalkinBuffer" checked={editableAppConfig.enableWalkinBuffer} onChange={e => handleAppConfigChange('enableWalkinBuffer', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="enableWalkinBuffer" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('enableWalkinBufferFeatureLabel')}</label>
              </div>
              <div className="flex items-center pt-2">
                  <input type="checkbox" id="enableCancellationFee" checked={editableAppConfig.enableCancellationFee} onChange={e => handleAppConfigChange('enableCancellationFee', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="enableCancellationFee" className="ms-2 text-sm text-neutral-800 dark:text-neutral-200">{t('enableCancellationFeeLabel')}</label>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-600">
                  <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('contactSettingsTitle')}</h4>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('contactEmailLabel')}</label>
                  <input type="email" id="contactEmail" value={editableAppConfig.contactEmail || ''} onChange={e => handleAppConfigChange('contactEmail', e.target.value)} className="w-full p-2 rounded-md text-sm bg-neutral-100 dark:bg-neutral-600" placeholder={t('contactEmailPlaceholder')} />
              </div>
              
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-600 flex justify-end">
                <button
                    type="button"
                    onClick={handleSaveAppConfig}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-md transition flex items-center"
                >
                    <SaveIcon className="w-5 h-5 me-2" />
                    {t('saveButton')}
                </button>
              </div>
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