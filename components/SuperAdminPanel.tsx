

import React, { useState, useEffect, useMemo } from 'react';
import type { TranslationKey, Language } from '../translations';
import { Barber, Appointment, Expense, AppConfig, Business, ThemeName, TopLevelTab, BlockedCustomer, CustomerReport, ReportStatus, ExpenseInsert } from '../types';
import * as api from '../services/api';
import { LogoutIcon, SaveIcon, ShieldCheckIcon, PlusCircleIcon, TrashIcon, MailIcon, ArrowLeftIcon, PencilIcon, BuildingStorefrontIcon, CurrencyEuroIcon, UsersIcon, ChartPieIcon, ChartBarIcon, CogIcon, ExclamationTriangleIcon, PhoneIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useTheme } from '../contexts/ThemeContext';
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
  onAddExpense: (newExpense: ExpenseInsert) => void;
  onRemoveExpense: (expenseId: string) => void;
  onLogout: () => void;
  onUpdateAppConfig: (newConfig: AppConfig) => void;
  onImpersonateBarber: (barberId: string) => void;
  onDataRefresh: () => void;
  selectedBusinessId: string | null;
  onSelectBusinessId: (id: string | null) => void;
  activeTopLevelTab: TopLevelTab;
  onSetTopLevelTab: (tab: TopLevelTab) => void;
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
    }).join(', ');

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div
                className="w-40 h-40 rounded-full"
                style={{ background: `conic-gradient(${gradients})` }}
                role="img"
                aria-label="Pie chart"
            ></div>
            <ul className="text-sm space-y-2">
                {data.map(item => (
                    <li key={item.label} className="flex items-center text-neutral-700 dark:text-neutral-300">
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
                        <div className="text-xs sm:text-sm font-bold mb-1 text-neutral-800 dark:text-neutral-200">€{item.value.toFixed(0)}</div>
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

const ProjectedRevenueLineChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    if (!data || data.length === 0) {
        return <div className="text-center text-neutral-500 py-10">{t('noDataForChart')}</div>;
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500;
    const height = 300;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.map(d => d.value), 0);
    const yMax = Math.ceil(maxValue / 100) * 100 + (maxValue === 0 ? 50 : 20); // Nice round numbers for Y-axis

    const xScale = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth;
    const yScale = (value: number) => padding.top + innerHeight - (value / yMax) * innerHeight;

    const linePath = data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.value)}`).join(' ');
    
    const yAxisTicks = Array.from({ length: 6 }, (_, i) => Math.round(yMax / 5 * i));
    
    const gridLineColor = theme === 'light' ? '#E5E7EB' : '#374151';
    const textColor = theme === 'light' ? '#374151' : '#E5E7EB';
    const primaryColor = 'rgb(var(--color-primary))';

    return (
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow mt-6">
            <h4 className="text-lg font-semibold mb-4 text-center text-neutral-800 dark:text-neutral-200">{t('projectedMonthlyRevenueTitle')}</h4>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-Axis Grid Lines and Labels */}
                {yAxisTicks.map(tick => (
                    <g key={`y-tick-${tick}`} className="text-xs" style={{ fill: textColor }}>
                        <line x1={padding.left} x2={width - padding.right} y1={yScale(tick)} y2={yScale(tick)} style={{ stroke: gridLineColor, strokeWidth: 0.5, strokeDasharray: '2' }} />
                        <text x={padding.left - 8} y={yScale(tick)} textAnchor="end" alignmentBaseline="middle">
                            €{tick}
                        </text>
                    </g>
                ))}
                {/* X-Axis Labels */}
                {data.map((point, i) => (
                    <text key={`x-label-${i}`} x={xScale(i)} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs" style={{ fill: textColor }}>
                        {point.label}
                    </text>
                ))}

                {/* Data Line */}
                <path d={linePath} fill="none" style={{ stroke: primaryColor, strokeWidth: 2 }} />

                {/* Data Points */}
                {data.map((point, i) => (
                     <circle key={`point-${i}`} cx={xScale(i)} cy={yScale(point.value)} r="3" style={{ fill: primaryColor }} />
                ))}
            </svg>
        </div>
    );
};

interface TopLevelTabButtonProps {
    tabId: TopLevelTab;
    activeTab: TopLevelTab;
    onClick: (tabId: TopLevelTab) => void;
    children: React.ReactNode;
}
const TopLevelTabButton: React.FC<TopLevelTabButtonProps> = ({ tabId, activeTab, onClick, children }) => (
  <button onClick={() => onClick(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === tabId ? 'border-red-500 text-red-500' : 'border-transparent text-neutral-500 hover:text-red-500'}`}>
      {children}
  </button>
);

type BusinessMgmtTab = 'barbers' | 'businessSettings';
interface BusinessMgmtTabButtonProps {
    tabId: BusinessMgmtTab;
    activeTab: BusinessMgmtTab;
    onClick: (tabId: BusinessMgmtTab) => void;
    children: React.ReactNode;
}
const BusinessMgmtTabButton: React.FC<BusinessMgmtTabButtonProps> = ({ tabId, activeTab, onClick, children }) => (
  <button onClick={() => onClick(tabId)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}>
      {children}
  </button>
);

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ businesses, barbers, appointments, expenses, appConfig, onUpdateBarber, onUpdateBusiness, onAddBarber, onRemoveBarber, onAddBusiness, onRemoveBusiness, onAddExpense, onRemoveExpense, onLogout, onUpdateAppConfig, onImpersonateBarber, onDataRefresh, selectedBusinessId, onSelectBusinessId, activeTopLevelTab, onSetTopLevelTab }) => {
  const { t, language } = useLanguage();
  const { showConfirmation } = useConfirmation();
  
  const [editableBusiness, setEditableBusiness] = useState<Business | null>(null);
  
  const [activeTab, setActiveTab] = useState<BusinessMgmtTab>('barbers');
  const [editableAppConfig, setEditableAppConfig] = useState<AppConfig>(appConfig);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseType, setNewExpenseType] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');
  
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);
  const [newBarberCreds, setNewBarberCreds] = useState({email: '', password: '', name: ''});

  const [showAddBusinessForm, setShowAddBusinessForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState<NewBusinessState>({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default', customSubscriptionPrice: null, suppressGracePeriodWarning: false, enableCancellationFee: false, cancellationFeeHours: 24, cancellationFeeAmount: 15, logo_url: null });

  const [blockedCustomers, setBlockedCustomers] = useState<BlockedCustomer[]>([]);
  const [customerReports, setCustomerReports] = useState<CustomerReport[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const selectedBusiness = useMemo(() => businesses.find(b => b.id === selectedBusinessId) || null, [businesses, selectedBusinessId]);

  // --- HOOKS MOVED TO TOP LEVEL ---
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

  const { mrr } = platformFinancials;

  const monthLabels = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i)); // Go back 11 months to show a year-long trend
        return date.toLocaleDateString(language, { month: 'short' });
    });
  }, [language]);

  const projectedData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    return {
        label: monthLabels[i],
        value: mrr
    };
  }), [monthLabels, mrr]);
  // --- END OF MOVED HOOKS ---

  useEffect(() => { setEditableAppConfig(appConfig); }, [appConfig]);
  
  useEffect(() => {
    if (selectedBusiness) {
        setEditableBusiness({ ...selectedBusiness });
    } else {
        setEditableBusiness(null);
    }
  }, [selectedBusiness]);

  useEffect(() => {
      if(activeTopLevelTab === 'blockedCustomers') {
          api.getBlockedCustomers().then(setBlockedCustomers);
      }
      if(activeTopLevelTab === 'reports') {
          api.getCustomerReports().then(setCustomerReports);
      }
  }, [activeTopLevelTab]);

  const handleSelectBusiness = (business: Business) => {
    onSelectBusinessId(business.id);
    setActiveTab('barbers'); // Reset to the first tab on new selection
  }

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
    if (!selectedBusinessId) {
        console.error("Cannot add barber without a selected business.");
        return;
    }
    onAddBarber(newBarberCreds, selectedBusinessId);
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
      setNewBusiness({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default', customSubscriptionPrice: null, suppressGracePeriodWarning: false, enableCancellationFee: false, cancellationFeeHours: 24, cancellationFeeAmount: 15, logo_url: null });
      setShowAddBusinessForm(false);
  }

  const handleAppConfigChange = (field: keyof AppConfig, value: any) => {
    const newConfig = { ...editableAppConfig, [field]: value };
    setEditableAppConfig(newConfig);
    onUpdateAppConfig(newConfig);
  };

  const handleBusinessFieldChange = (field: keyof Business, value: any) => {
    setEditableBusiness(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleToggleCustomPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setEditableBusiness(prev => {
        if (!prev) return null;
        return {
            ...prev,
            customSubscriptionPrice: isEnabled ? (prev.customSubscriptionPrice ?? appConfig.defaultSubscriptionPrice) : null
        };
    });
  };

  const handleSaveBusiness = () => {
    if (editableBusiness) {
      onUpdateBusiness(editableBusiness);
    }
  };

  const handleUnblockCustomer = async (phone: string) => {
      await api.unblockCustomer(phone);
      setBlockedCustomers(prev => prev.filter(c => c.customer_phone !== phone));
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editableBusiness) {
        return;
    }
    const file = e.target.files[0];
    setIsUploadingLogo(true);
    try {
        const logoUrl = await api.uploadBusinessLogo(editableBusiness.id, file);
        const updatedBusiness = { ...editableBusiness, logo_url: logoUrl };
        await onUpdateBusiness(updatedBusiness);
        setEditableBusiness(updatedBusiness);
    } catch (error) {
        console.error("Logo upload failed:", error);
        alert("Logo upload failed.");
    } finally {
        setIsUploadingLogo(false);
    }
  };
  
  const handleLogoRemove = async () => {
      if (!editableBusiness) return;
      showConfirmation({
          message: t('confirmRemoveLogo'),
          onConfirm: async () => {
              try {
                  await api.removeBusinessLogo(editableBusiness.id);
                  const updatedBusiness = { ...editableBusiness, logo_url: null };
                  await onUpdateBusiness(updatedBusiness);
                  setEditableBusiness(updatedBusiness);
              } catch (error) {
                  console.error("Logo removal failed:", error);
                  alert("Logo removal failed.");
              }
          }
      });
  };
  
  const inputStyles = "w-full p-2 rounded-md text-sm bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500";


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
              <button onClick={() => onSelectBusinessId(null)} className="flex items-center text-sm text-primary hover:text-blue-500"><ArrowLeftIcon className="w-4 h-4 me-2" />{t('backToBusinessList')}</button>
              <h2 className="text-2xl font-bold text-end">{t('businessManagementFor', { name: selectedBusiness.name })}</h2>
            </div>


            <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <BusinessMgmtTabButton tabId="barbers" activeTab={activeTab} onClick={setActiveTab}>{t('dashboardTab_barbers')}</BusinessMgmtTabButton>
                    <BusinessMgmtTabButton tabId="businessSettings" activeTab={activeTab} onClick={setActiveTab}>{t('dashboardTab_businessSettings')}</BusinessMgmtTabButton>
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
                        <div><label htmlFor="newBarberName" className="block text-sm font-medium mb-1">{t('fullNameLabel')}</label><input type="text" id="newBarberName" value={newBarberCreds.name} onChange={e => setNewBarberCreds(p => ({...p, name: e.target.value}))} className={`${inputStyles} bg-white dark:bg-neutral-800`} required /></div>
                        <div><label htmlFor="newBarberEmail" className="block text-sm font-medium mb-1">{t('ownerEmailLabel')}</label><input type="email" id="newBarberEmail" value={newBarberCreds.email} onChange={e => setNewBarberCreds(p => ({...p, email: e.target.value}))} className={`${inputStyles} bg-white dark:bg-neutral-800`} required /></div>
                        <div><label htmlFor="newBarberPassword" className="block text-sm font-medium mb-1">{t('passwordLabel')}</label><input type="password" id="newBarberPassword" value={newBarberCreds.password} onChange={e => setNewBarberCreds(p => ({...p, password: e.target.value}))} className={`${inputStyles} bg-white dark:bg-neutral-800`} required /></div>
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
                              onCancelAppointment={async (id) => { await api.updateAppointment(id, {status: 'cancelled'}); onDataRefresh(); }} onImpersonate={onImpersonateBarber}
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
                          <select value={editableBusiness.subscriptionStatus} onChange={e => handleBusinessFieldChange('subscriptionStatus', e.target.value as Business['subscriptionStatus'])} className={inputStyles}>
                              {statusOptions.map(opt => <option key={opt} value={opt}>{t(`status_${opt}` as Exclude<TranslationKey, 'days'>)}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('subscriptionValidUntilLabel')}</label>
                          <input type="date" value={editableBusiness.subscriptionValidUntil.split('T')[0]} onChange={e => handleBusinessFieldChange('subscriptionValidUntil', e.target.value)} className={inputStyles}/>
                      </div>
                  </div>
                   <div className="border-t border-neutral-200 dark:border-neutral-600 pt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <input
                                        type="checkbox"
                                        id={`enableCustomPrice-${editableBusiness.id}`}
                                        checked={editableBusiness.customSubscriptionPrice !== null}
                                        onChange={handleToggleCustomPrice}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`enableCustomPrice-${editableBusiness.id}`} className="text-xs font-bold text-neutral-500 dark:text-neutral-400 cursor-pointer">{t('customMonthlyPriceLabel')}</label>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editableBusiness.customSubscriptionPrice ?? ''}
                                    onChange={e => handleBusinessFieldChange('customSubscriptionPrice', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder={t('defaultPriceWithAmount', { price: appConfig.defaultSubscriptionPrice })}
                                    className={`${inputStyles} max-w-[180px] transition-opacity`}
                                    disabled={editableBusiness.customSubscriptionPrice === null}
                                />
                            </div>
                            <div className="flex-shrink-0 flex rounded-lg shadow-md self-center sm:self-end">
                                {[1, 6, 12].map(months => (
                                    <button key={months} onClick={() => handleConfirmPayment(editableBusiness, months)} className="px-3 py-2 bg-secondary hover:bg-emerald-600 text-white font-semibold transition duration-150 flex items-center text-xs first:rounded-s-lg last:rounded-e-lg border-e border-emerald-700 last:border-e-0">
                                        +{months}{t(`timeAbbreviation_${months === 1 ? 'month' : 'months'}` as Exclude<TranslationKey, 'days'>)}
                                    </button>
                                ))}
                            </div>
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
                            <input type="number" value={editableBusiness.cancellationFeeHours} onChange={e => handleBusinessFieldChange('cancellationFeeHours', parseInt(e.target.value) || 0 )} className={inputStyles}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeAmountLabel')}</label>
                            <input type="number" step="0.01" value={editableBusiness.cancellationFeeAmount} onChange={e => handleBusinessFieldChange('cancellationFeeAmount', parseFloat(e.target.value) || 0 )} className={inputStyles}/>
                        </div>
                    </div>
                  )}
                </div>

                {/* Branding Settings */}
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold mb-3">{t('logoSettingsTitle')}</h4>
                    <div className="flex items-center gap-4">
                        {editableBusiness.logo_url && <img src={editableBusiness.logo_url} alt="Business Logo" className="w-16 h-16 rounded-md object-contain bg-neutral-200" />}
                        <div className="flex-1">
                            <label htmlFor="logo-upload" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-md cursor-pointer">
                                {isUploadingLogo ? t('uploadingLogo') : t('uploadLogoButton')}
                            </label>
                            <input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo}/>
                        </div>
                        {editableBusiness.logo_url && (
                             <button onClick={handleLogoRemove} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center transition-colors">
                                <TrashIcon className="w-4 h-4 me-1.5" />
                                {t('removeButton')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold mb-3">{t('themeSelectionTitle')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themes.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => handleBusinessFieldChange('theme', theme.name)}
                                className={`p-4 rounded-lg border-2 transition-all ${editableBusiness.theme === theme.name ? 'border-primary shadow-lg scale-105' : 'border-neutral-200 dark:border-neutral-600 hover:border-primary/50'}`}
                            >
                                <p className="font-semibold text-center mb-3 capitalize text-neutral-800 dark:text-neutral-100">{t(`theme_${theme.name}` as Exclude<TranslationKey, 'days'>)}</p>
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
      const { activeSubscriptions, totalBusinesses, subscriptionStatusCounts } = platformFinancials;
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
        <nav className="-mb-px flex gap-2 sm:gap-6 overflow-x-auto" aria-label="Tabs">
            <TopLevelTabButton tabId="businesses" activeTab={activeTopLevelTab} onClick={onSetTopLevelTab}><BuildingStorefrontIcon className="w-4 h-4" />{t('dashboardTab_businesses')}</TopLevelTabButton>
            <TopLevelTabButton tabId="financials" activeTab={activeTopLevelTab} onClick={onSetTopLevelTab}><ChartBarIcon className="w-4 h-4" />{t('dashboardTab_financials')}</TopLevelTabButton>
            <TopLevelTabButton tabId="expenses" activeTab={activeTopLevelTab} onClick={onSetTopLevelTab}><CurrencyEuroIcon className="w-4 h-4" />{t('dashboardTab_expenses')}</TopLevelTabButton>
            <TopLevelTabButton tabId="blockedCustomers" activeTab={activeTopLevelTab} onClick={onSetTopLevelTab}><UsersIcon className="w-4 h-4" />{t('dashboardTab_blockedCustomers')}</TopLevelTabButton>
            <TopLevelTabButton tabId="reports" activeTab={activeTopLevelTab} onClick={onSetTopLevelTab}><ExclamationTriangleIcon className="w-4 h-4" />{t('dashboardTab_reports')}</TopLevelTabButton>
            <TopLevelTabButton tabId="settings" activeTab={activeTopLevelTab} onClick={onSetTopLevelTab}><CogIcon className="w-4 h-4" />{t('dashboardTab_settings')}</TopLevelTabButton>
        </nav>
      </div>

      {activeTopLevelTab === 'businesses' && (
        <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{t('businessManagementTitle')}</h3>
              <button type="button" onClick={() => setShowAddBusinessForm(!showAddBusinessForm)} className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center text-sm">
                  <PlusCircleIcon className="w-5 h-5 me-2" />
                  {showAddBusinessForm ? t('cancelButton') : t('addBusinessButton')}
              </button>
            </div>
             {showAddBusinessForm && (
                <form onSubmit={handleAddNewBusiness} className="bg-white dark:bg-neutral-700 p-4 rounded-md shadow-md mb-6 space-y-4">
                  <h3 className="text-xl font-medium text-primary mb-3">{t('newBusinessDetailsTitle')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="newBusinessName" className="block text-sm font-medium mb-1">{t('businessNameLabel')}</label><input type="text" id="newBusinessName" value={newBusiness.name} onChange={e => handleNewBusinessChange('name', e.target.value)} className={inputStyles} placeholder={t('businessNamePlaceholder')} required /></div>
                    <div><label htmlFor="newBusinessAddress" className="block text-sm font-medium mb-1">{t('addressLabel')}</label><input type="text" id="newBusinessAddress" value={newBusiness.address || ''} onChange={e => handleNewBusinessChange('address', e.target.value)} className={inputStyles} placeholder={t('addressPlaceholderOptional')} /></div>
                    <div><label htmlFor="newBusinessOwnerName" className="block text-sm font-medium mb-1">{t('ownerNameLabel')}</label><input type="text" id="newBusinessOwnerName" value={newBusiness.ownerName || ''} onChange={e => handleNewBusinessChange('ownerName', e.target.value)} className={inputStyles} placeholder={t('ownerNamePlaceholder')} /></div>
                    <div><label htmlFor="newBusinessOwnerEmail" className="block text-sm font-medium mb-1">{t('ownerEmailLabel')}</label><input type="email" id="newBusinessOwnerEmail" value={newBusiness.ownerEmail || ''} onChange={e => handleNewBusinessChange('ownerEmail', e.target.value)} className={inputStyles} placeholder={t('ownerEmailPlaceholder')} /></div>
                  </div>
                  <button type="submit" className="w-full mt-2 px-4 py-2.5 bg-secondary hover:bg-emerald-600 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center"><SaveIcon className="w-5 h-5 me-2"/> {t('addBusinessButton')}</button>
                </form>
             )}
            <div className="space-y-4">
              {businesses.length > 0 ? businesses.map(business => (
                  <BusinessConfigRow 
                      key={business.id} 
                      business={business}
                      onManage={() => handleSelectBusiness(business)}
                      onRemove={onRemoveBusiness}
                      onUpdateBusiness={onUpdateBusiness}
                  />
              )) : <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noBusinessesConfigured')}</p>}
            </div>
        </div>
      )}

      {activeTopLevelTab === 'financials' && (
        <div>
           <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('financialOverviewTitle')}</h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow text-center">
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1"><CurrencyEuroIcon className="w-4 h-4"/>{t('monthlyRecurringRevenue')}</h4>
                    <p className="text-3xl font-bold text-primary mt-1">€{mrr.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow text-center">
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1"><UsersIcon className="w-4 h-4"/>{t('totalActiveSubscriptions')}</h4>
                    <p className="text-3xl font-bold text-primary mt-1">{activeSubscriptions}</p>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow text-center">
                    <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1"><BuildingStorefrontIcon className="w-4 h-4"/>{t('totalBusinesses')}</h4>
                    <p className="text-3xl font-bold text-primary mt-1">{totalBusinesses}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
                    <h4 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-200">{t('subscriptionStatusChartTitle')}</h4>
                    {statusChartData.length > 0 ? <SimplePieChart data={statusChartData} /> : <p className="text-center py-10 text-neutral-500">{t('noDataForChart')}</p>}
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
                    <h4 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-200">{t('revenueByBusinessTitle')}</h4>
                    {revenueChartData.length > 0 ? <SimpleBarChart data={revenueChartData} /> : <p className="text-center py-10 text-neutral-500">{t('noDataForChart')}</p>}
                </div>
            </div>
            <ProjectedRevenueLineChart data={projectedData} />
        </div>
      )}

      {activeTopLevelTab === 'expenses' && (
        <div>
          <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('expenseManagementTitle')}</h3>
          <form onSubmit={handleAddNewExpense} className="bg-white dark:bg-neutral-700 p-4 rounded-md shadow-md mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><label htmlFor="newExpenseName" className="block text-sm font-medium mb-1">{t('expenseNameLabel')}</label><input type="text" id="newExpenseName" value={newExpenseName} onChange={e => setNewExpenseName(e.target.value)} className={inputStyles} placeholder={t('expenseNamePlaceholder')} required /></div>
                <div><label htmlFor="newExpenseAmount" className="block text-sm font-medium mb-1">{t('expenseAmountLabel')}</label><input type="number" id="newExpenseAmount" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} className={inputStyles} required /></div>
                <div><label htmlFor="newExpenseType" className="block text-sm font-medium mb-1">{t('expenseTypeLabel')}</label><select id="newExpenseType" value={newExpenseType} onChange={e => setNewExpenseType(e.target.value as any)} className={inputStyles}><option value="monthly">{t('expenseType_monthly')}</option><option value="yearly">{t('expenseType_yearly')}</option><option value="one-time">{t('expenseType_one_time')}</option></select></div>
              </div>
              <button type="submit" className="w-full mt-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white font-semibold rounded-md transition duration-150 flex items-center justify-center"><PlusCircleIcon className="w-5 h-5 me-2"/>{t('addExpenseButton')}</button>
          </form>
          <div className="space-y-2">
            {expenses.length > 0 ? expenses.map(exp => (
              <div key={exp.id} className="bg-white dark:bg-neutral-700 p-3 rounded-md flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold">{exp.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{exp.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-red-500">-€{exp.amount.toFixed(2)}</p>
                  <button onClick={() => handleRemoveExpenseClick(exp)} className="p-1 text-neutral-500 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4"/></button>
                </div>
              </div>
            )) : <p className="text-center text-neutral-500 dark:text-neutral-400 py-4">{t('noExpensesTracked')}</p>}
          </div>
        </div>
      )}
      
      {activeTopLevelTab === 'blockedCustomers' && (
          <div>
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('manageBlockedCustomersTitle')}</h3>
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md">
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {blockedCustomers.length > 0 ? blockedCustomers.map(customer => (
                        <li key={customer.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> {customer.customer_phone}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('blockedOnLabel')}: {new Date(customer.blocked_at).toLocaleDateString(language)}</p>
                            </div>
                            <button onClick={() => handleUnblockCustomer(customer.customer_phone)} className="px-3 py-1 bg-secondary text-white text-xs font-bold rounded-md">{t('unblockButton')}</button>
                        </li>
                    )) : <p className="text-center text-neutral-500 dark:text-neutral-400 p-6">{t('noBlockedCustomers')}</p>}
                </ul>
              </div>
          </div>
      )}

      {activeTopLevelTab === 'reports' && (
          <div>
               <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">{t('customerReportsTitle')}</h3>
               <div className="space-y-4">
                   {customerReports.length > 0 ? customerReports.map(report => (
                       <div key={report.id} className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md">
                           <div className="flex justify-between items-start">
                               <div>
                                   <p className="text-sm font-semibold">{t('reportFrom')}: {report.reported_by_customer_phone}</p>
                                   <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('reportRegarding')}: {barbers.find(b => b.id === report.reported_barber_id)?.name || 'Unknown Barber'}</p>
                                   <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('reportedOnLabel')}: {new Date(report.created_at).toLocaleString(language)}</p>
                               </div>
                               <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${report.status === 'new' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{report.status}</span>
                           </div>
                           <p className="mt-2 text-sm bg-neutral-100 dark:bg-neutral-700 p-2 rounded">{report.report_message}</p>
                       </div>
                   )) : <p className="text-center text-neutral-500 dark:text-neutral-400 p-6">{t('noCustomerReports')}</p>}
               </div>
          </div>
      )}

      {activeTopLevelTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><CogIcon className="w-5 h-5"/>{t('appSettingsTitle')}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="appName" className="block text-sm font-medium mb-1">{t('appNameLabel')}</label>
                      <input type="text" id="appName" value={editableAppConfig.appName} onChange={e => handleAppConfigChange('appName', e.target.value)} className={inputStyles} />
                  </div>
                  <div>
                      <label htmlFor="defaultSubPrice" className="block text-sm font-medium mb-1">{t('defaultSubscriptionPriceLabel')}</label>
                      <input type="number" id="defaultSubPrice" value={editableAppConfig.defaultSubscriptionPrice} onChange={e => handleAppConfigChange('defaultSubscriptionPrice', Number(e.target.value))} className={inputStyles} />
                  </div>
              </div>
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-600">
                <h4 className="text-md font-semibold mb-2">{t('contactSettingsTitle')}</h4>
                 <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">{t('contactEmailLabel')}</label>
                    <input type="email" id="contactEmail" value={editableAppConfig.contactEmail || ''} onChange={e => handleAppConfigChange('contactEmail', e.target.value)} className={inputStyles} placeholder={t('contactEmailPlaceholder')} />
                  </div>
              </div>
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-600 space-y-2">
                <h4 className="text-md font-semibold mb-2">Feature Flags & Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={editableAppConfig.showServicesOnSelector} onChange={e => handleAppConfigChange('showServicesOnSelector', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><span className="ms-2">{t('showServicesOnSelectorLabel')}</span></label>
                    <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={editableAppConfig.allowBarberLanguageControl} onChange={e => handleAppConfigChange('allowBarberLanguageControl', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><span className="ms-2">{t('allowBarberLanguageControlLabel')}</span></label>
                    <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={editableAppConfig.enableWaitlist} onChange={e => handleAppConfigChange('enableWaitlist', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><span className="ms-2">{t('enableWaitlistFeatureLabel')}</span></label>
                    <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={editableAppConfig.enableWalkinBuffer} onChange={e => handleAppConfigChange('enableWalkinBuffer', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><span className="ms-2">{t('enableWalkinBufferFeatureLabel')}</span></label>
                    <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={editableAppConfig.enableCancellationFee} onChange={e => handleAppConfigChange('enableCancellationFee', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /><span className="ms-2">{t('enableCancellationFeeLabel')}</span></label>
                </div>
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-600">
                    <label htmlFor="noShowLimit" className="block text-sm font-medium mb-1">{t('noShowLimitLabel')}</label>
                    <input type="number" id="noShowLimit" value={editableAppConfig.no_show_block_limit} onChange={e => handleAppConfigChange('no_show_block_limit', Number(e.target.value))} className={`${inputStyles} max-w-xs`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
  };
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-700 p-4 md:p-6 rounded-lg shadow-inner">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-600">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2 sm:mb-0">
            {t('superAdminPanelTitle')}
          </h2>
        </div>
        <button onClick={onLogout} className="px-4 py-2 mt-2 sm:mt-0 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm flex items-center">
            <LogoutIcon className="w-5 h-5 me-2"/> {t('logoutButton')}
        </button>
      </div>
      
      {selectedBusinessId ? renderBusinessManagementView() : renderTopLevelView()}
    </div>
  );
};

export default SuperAdminPanel;