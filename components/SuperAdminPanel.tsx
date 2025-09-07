import React, { useState, useEffect, useMemo } from 'react';
import { Barber, Appointment, Expense, AppConfig, Business, ThemeName, TopLevelTab, BlockedCustomer, CustomerReport, ExpenseInsert, AppConfigUpdate } from '../types';
import type { TranslationKey } from '../translations';
import * as api from '../services/api';
import { SaveIcon, PlusCircleIcon, ArrowLeftIcon, BuildingStorefrontIcon, CurrencyEuroIcon, UsersIcon, ChartPieIcon, ChartBarIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useTheme } from '../contexts/ThemeContext';
import BarberConfigRow from './BarberConfigRow';

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
  onUpdateAppConfig: (newConfig: AppConfigUpdate) => void;
  onImpersonateBarber: (barberId: string) => void;
  onDataRefresh: () => void;
  selectedBusinessId: string | null;
  onSelectBusinessId: (id: string | null) => void;
  activeTopLevelTab: TopLevelTab;
  onSetTopLevelTab: (tab: TopLevelTab) => void;
}

type NewBusinessState = Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>;
type ChartDataPoint = {
  label: string;
  value: number;
  color: string;
};

// Simple chart components
const SimplePieChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
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

const SimpleBarChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
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
  const [newBusiness, setNewBusiness] = useState<NewBusinessState>({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default', customSubscriptionPrice: null, suppressGracePeriodWarning: false, enableCancellationFee: false, cancellationFeeHours: 24, cancellationFeeAmount: 15, logoUrl: null });

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

  const handleAddNewBusiness = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBusiness.name.trim()) {
          alert(t('alertBusinessNameRequired'));
          return;
      }
      onAddBusiness(newBusiness);
      setNewBusiness({ name: '', ownerName: '', ownerEmail: '', address: '', theme: 'default', customSubscriptionPrice: null, suppressGracePeriodWarning: false, enableCancellationFee: false, cancellationFeeHours: 24, cancellationFeeAmount: 15, logoUrl: null });
      setShowAddBusinessForm(false);
  }

  const handleAppConfigChange = (field: keyof AppConfig, value: AppConfig[keyof AppConfig]) => {
    const newConfig = { ...editableAppConfig, [field]: value };
    setEditableAppConfig(newConfig);
    onUpdateAppConfig(newConfig);
  };

  const handleBusinessFieldChange = (field: keyof Business, value: Business[keyof Business]) => {
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
      setBlockedCustomers(prev => prev.filter(c => c.customerPhone !== phone));
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editableBusiness) {
        return;
    }
    const file = e.target.files[0];
    setIsUploadingLogo(true);
    try {
        const logoUrl = await api.uploadBusinessLogo(editableBusiness.id, file);
        const updatedBusiness = { ...editableBusiness, logoUrl: logoUrl };
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
                  const updatedBusiness = { ...editableBusiness, logoUrl: null };
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
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold">{t('cancellationFeeTitle')}</h3>
                   <div className="flex items-center">
                        <input type="checkbox" id={`enableCancellation-${editableBusiness.id}`} checked={!!editableBusiness.enableCancellationFee} onChange={e => handleBusinessFieldChange('enableCancellationFee', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" disabled={!appConfig.enableCancellationFee} />
                        <label htmlFor={`enableCancellation-${editableBusiness.id}`} className={`ms-2 text-sm text-neutral-600 dark:text-neutral-300 ${!appConfig.enableCancellationFee ? 'opacity-50' : ''}`}>{t('enableCancellationFeeLabelBusiness')}</label>
                    </div>
                    {editableBusiness.enableCancellationFee && appConfig.enableCancellationFee && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeHoursLabel')}</label>
                          <input type="number" value={editableBusiness.cancellationFeeHours} onChange={e => handleBusinessFieldChange('cancellationFeeHours', parseInt(e.target.value) || 0)} className={inputStyles}/>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeAmountLabel')}</label>
                           <input type="number" step="0.01" value={editableBusiness.cancellationFeeAmount} onChange={e => handleBusinessFieldChange('cancellationFeeAmount', parseFloat(e.target.value) || 0 )} className={inputStyles}/>
                        </div>
                      </div>
                    )}
                </div>
                
                {/* Branding & Theme */}
                <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold">{t('dashboardTab_branding')}</h3>
                  <div>
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('themeSelectionTitle')}</label>
                      <div className="flex flex-wrap gap-4">
                        {themes.map(theme => (
                            <button key={theme.name} onClick={() => handleBusinessFieldChange('theme', theme.name)} className={`p-2 rounded-lg border-2 ${editableBusiness.theme === theme.name ? 'border-primary' : 'border-transparent'}`}>
                                <div className="flex gap-2">
                                    {theme.colors.map(color => <div key={color} className="w-8 h-8 rounded-full" style={{backgroundColor: color}}></div>)}
                                </div>
                                <p className="text-xs mt-1 capitalize">{t(`theme_${theme.name}` as Exclude<TranslationKey, 'days'>)}</p>
                            </button>
                        ))}
                      </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('logoSettingsTitle')}</label>
                    <div className="flex items-center gap-4">
                      {editableBusiness.logoUrl && <img src={editableBusiness.logoUrl} alt="Logo" className="h-12 bg-neutral-200 dark:bg-neutral-600 p-1 rounded-md" />}
                      <input type="file" id={`logo-upload-${editableBusiness.id}`} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml" className="hidden"/>
                      <label htmlFor={`logo-upload-${editableBusiness.id}`} className="px-3 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center text-sm cursor-pointer">
                        {isUploadingLogo ? t('uploadingLogo') : t('uploadLogoButton')}
                      </label>
                       {editableBusiness.logoUrl && <button onClick={handleLogoRemove} className="text-xs text-red-500 hover:underline">{t('removeButton')}</button>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                   <button onClick={handleSaveBusiness} className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-semibold rounded-md transition duration-150 flex items-center"><SaveIcon className="w-5 h-5 me-2"/> {t('saveChangesButton')}</button>
                </div>

              </div>
            )}
        </div>
    );
  };
  
  return (
    <div>
       {selectedBusinessId ? renderBusinessManagementView() : <div />}
    </div>
  );
};
export default SuperAdminPanel;