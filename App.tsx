import React, { useState, useEffect, useCallback, useReducer } from 'react';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { Barber, Appointment, Service, AppConfig, Expense, Business, TopLevelTab, AppointmentInsert, ExpenseInsert, CustomerReportInsert, AppConfigUpdate, BarberUpdate, Json } from './types';
import * as api from "@services/api";
import BarberSelector from "@components/BarberSelector";
import BarberScheduleDisplay from '@components/BarberScheduleDisplay';
import BookingFormModal from '@components/BookingFormModal';
import BarberLoginModal from '@components/BarberLoginModal';
import SuperAdminLoginModal from '@components/SuperAdminLoginModal';
import BarberDashboard from '@components/BarberDashboard';
import CustomerLookupModal from '@components/CustomerLookupModal';
import CustomerAppointmentsModal from '@components/CustomerAppointmentsModal';
import SuperAdminPanel from '@components/SuperAdminPanel';
import SubscriptionOverdueModal from '@components/SubscriptionOverdueModal';
import ContactModal from '@components/ContactModal';
import NetworkErrorModal from '@components/NetworkErrorModal';
import ReportProblemModal from '@components/ReportProblemModal';
import { UserIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon, SpinnerIcon } from '@components/Icons';
import { useLanguage } from '@contexts/LanguageContext';
import { useConfirmation } from '@contexts/ConfirmationContext';
import ThemeToggle from '@components/ThemeToggle';
import LanguageSwitcher from '@components/LanguageSwitcher';
import AuthMenu from '@components/AuthMenu';
import Logo from '@components/Logo';
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from './constants';
import { isBarberEffectivelyClosed } from './utils';

type AppSession = {
    auth: SupabaseSession;
    profile: Barber | null; // For barbers
    isOwner: boolean;
} | null;

// --- STATE MANAGEMENT REFACTOR (useReducer) ---

type ModalType = 'booking' | 'barberLogin' | 'superAdminLogin' | 'customerLookup' | 'customerAppointments' | 'contact' | 'reportProblem';

interface AppUIState {
  activeModal: ModalType | null;
  modalError: string;
  bookingSlot: string | null;
  customerLookupPhone: string;
  customerAppointments: Appointment[];
}

const initialUIState: AppUIState = {
  activeModal: null,
  modalError: '',
  bookingSlot: null,
  customerLookupPhone: '',
  customerAppointments: [],
};

type UIAction =
  | { type: 'OPEN_MODAL'; payload: { modal: ModalType; slotTime?: string } }
  | { type: 'CLOSE_MODALS' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_CUSTOMER_VIEW'; payload: { phone: string; appointments: Appointment[] } };

function uiReducer(state: AppUIState, action: UIAction): AppUIState {
  switch (action.type) {
    case 'OPEN_MODAL':
      // Reset transient state when opening a new modal, but persist customer data between lookup and view
      return {
        ...initialUIState,
        customerAppointments: state.customerAppointments,
        customerLookupPhone: state.customerLookupPhone,
        activeModal: action.payload.modal,
        bookingSlot: action.payload.slotTime || null,
      };
    case 'CLOSE_MODALS':
      return {
        ...state,
        activeModal: null,
        modalError: '',
        bookingSlot: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        modalError: action.payload,
      };
    case 'SET_CUSTOMER_VIEW':
      return {
        ...state,
        activeModal: 'customerAppointments',
        modalError: '',
        customerLookupPhone: action.payload.phone,
        customerAppointments: action.payload.appointments,
      };
    default:
      return state;
  }
}


const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { showConfirmation } = useConfirmation();

  // APP STATE
  const [session, setSession] = useState<AppSession>(null);
  const [impersonatedBarber, setImpersonatedBarber] = useState<Barber | null>(null);
  const [showGracePeriodWarning, setShowGracePeriodWarning] = useState<boolean>(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [currentCustomerViewDate, setCurrentCustomerViewDate] = useState<Date>(new Date());

  // UI state is now managed by the reducer
  const [uiState, dispatch] = useReducer(uiReducer, initialUIState);
  
  const [footerClickCount, setFooterClickCount] = useState(0);

  const [bookingType, setBookingType] = useState<'in-shop' | 'on-location'>('in-shop');
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Super Admin state lifted up to App to prevent reset on re-render
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [activeTopLevelTab, setActiveTopLevelTab] = useState<TopLevelTab>('businesses');

  const fetchData = useCallback(async () => {
    try {
      const [businessesData, barbersData, appointmentsData, expensesData] = await Promise.all([
        api.getBusinesses(),
        api.getBarbers(),
        api.getAppointments(),
        api.getExpenses(),
      ]);
      setBusinesses(businessesData);
      setBarbers(barbersData);
      setAppointments(appointmentsData);
      setExpenses(expensesData);
    } catch (error) {
       // Re-throw the error to be caught by the calling function's catch block
       throw error;
    }
  }, []);

  useEffect(() => {
    const { data: authListener } = api.onAuthStateChange(async (_event, session) => {
        setIsLoading(true);
        setNetworkError(null);

        try {
            // Step 1: Critical config fetch. Without it, nothing works.
            const configData = await api.getAppConfig();
            setAppConfig(configData);

            // Step 2: Session and profile logic.
            if (session) {
                const isOwner = session.user.app_metadata?.role === 'owner';
                let profile: Barber | null = null;

                if (!isOwner) {
                    // For non-owners (barbers), the profile is essential.
                    const { data, error } = await api.getBarberProfile(session.user.id);
                    if (error) {
                        // If profile fails, treat as a critical error. Log out and stop.
                        console.error("Failed to fetch barber profile, logging out:", error);
                        await api.signOut();
                        setSession(null);
                        throw new Error("Profile fetch failed.");
                    }
                    profile = data;
                }
                setSession({ auth: session, profile, isOwner });
            } else {
                setSession(null);
            }

            // Step 3: Fetch all other application data.
            await fetchData();

        } catch (error) {
            console.error("Initialization error:", error);
            setNetworkError(window.location.origin);
        } finally {
            setIsLoading(false);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const activeUser = impersonatedBarber || session?.profile;

  const selectedBarber = barbers.find(b => b.id === selectedBarberId);
  const selectedBusiness = businesses.find(b => b.id === selectedBarber?.businessId);

  useEffect(() => {
    if (activeUser) {
      const userLang = activeUser.preferredLanguage;
      if (userLang && ['en', 'nl', 'fr', 'es', 'ar'].includes(userLang)) {
        setLanguage(userLang as any);
      }
    }
  }, [activeUser, setLanguage]);

  useEffect(() => {
    if (selectedBusiness) {
        document.documentElement.setAttribute('data-theme', selectedBusiness.theme || 'default');
    } else {
        document.documentElement.setAttribute('data-theme', 'default');
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (session?.profile && !session.isOwner) {
      const business = businesses.find(b => b.id === session.profile?.businessId);
      if (business?.subscriptionStatus === 'past_due' && !business.suppressGracePeriodWarning) {
        setShowGracePeriodWarning(true);
        
        const validUntil = new Date(business.subscriptionValidUntil);
        const gracePeriodEndDate = new Date(validUntil.setDate(validUntil.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS));
        if (new Date() > gracePeriodEndDate) {
            setShowOverdueModal(true);
        }
      } else {
        setShowGracePeriodWarning(false);
        setShowOverdueModal(false);
      }
    } else {
        setShowGracePeriodWarning(false);
        setShowOverdueModal(false);
    }
  }, [session, businesses]);
  
   const handleDayChange = (amount: number) => {
        setCurrentCustomerViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + amount);
            return newDate;
        });
    };
    
  const handleSelectSlot = (slotTime: string) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal: 'booking', slotTime } });
  };
  
  const handleBookingSubmit = async (name: string, phone: string, services: Service[], wantsEarlier?: boolean) => {
    if (!selectedBarberId || !uiState.bookingSlot || !selectedBusiness) {
        throw new Error("Missing barber, slot, or business info");
    }

    if (appConfig?.noShowBlockLimit) {
      const isBlocked = await api.isCustomerBlocked(phone);
      if (isBlocked) {
        throw new Error('CUSTOMER_BLOCKED');
      }
    }

    const todayString = new Date().toISOString().split('T')[0];
    const hasBookingToday = appointments.some(apt => 
        apt.customerPhone === phone && 
        apt.date === todayString &&
        apt.status === 'booked'
    );
    if(hasBookingToday) {
        throw new Error('ALREADY_BOOKED_TODAY');
    }

    const { totalPrice, totalDuration } = services.reduce((acc, service) => {
        acc.totalPrice += service.price;
        acc.totalDuration += service.duration;
        return acc;
    }, { totalPrice: 0, totalDuration: 0 });

    const newAppointment: AppointmentInsert = {
      barberId: selectedBarberId,
      businessId: selectedBusiness.id,
      customerName: name,
      customerPhone: phone,
      date: currentCustomerViewDate.toISOString().split('T')[0],
      slotTime: uiState.bookingSlot,
      services: services as unknown as Json,
      totalPrice,
      totalDuration,
      wantsEarlierSlot: wantsEarlier || false,
      status: 'booked'
    };

    await api.addAppointment(newAppointment);
    await fetchData();
    dispatch({ type: 'CLOSE_MODALS' });
  };
  
  const handleLoginAttempt = async (email: string, passwordAttempt: string) => {
    dispatch({ type: 'SET_ERROR', payload: '' });
    const { error } = await api.signIn(email, passwordAttempt);
    if (error) {
      if (error.message.includes('rate limit')) {
        dispatch({ type: 'SET_ERROR', payload: t('errorRateLimitExceeded') });
      } else {
        dispatch({ type: 'SET_ERROR', payload: t('errorInvalidCredentials') });
      }
    } else {
        // Successful login, onAuthStateChange will handle the rest
        dispatch({ type: 'CLOSE_MODALS' });
    }
  };

  const handleSuperAdminLoginAttempt = async (email: string, passwordAttempt: string) => {
    dispatch({ type: 'SET_ERROR', payload: '' });
    const { error } = await api.signIn(email, passwordAttempt);
    if (error) {
       dispatch({ type: 'SET_ERROR', payload: t('errorInvalidCredentials') });
    } else {
      // Logic inside onAuthStateChange will check if user is an owner
      dispatch({ type: 'CLOSE_MODALS' });
    }
  };

  const handleLogout = async () => {
    await api.signOut();
    setSelectedBarberId(null);
    setImpersonatedBarber(null);
    setSession(null);
    // Let onAuthStateChange handle data refresh and state updates.
  };

  const handleCustomerLookup = (phone: string) => {
      const foundAppointments = appointments.filter(
          apt => apt.customerPhone === phone && 
                 new Date(apt.date) >= new Date(new Date().setHours(0,0,0,0)) &&
                 apt.status === 'booked'
      );
      if (foundAppointments.length > 0) {
        dispatch({ type: 'SET_CUSTOMER_VIEW', payload: { phone, appointments: foundAppointments } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: t('errorNoAppointmentsFoundForPhone') });
      }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
      await api.updateAppointment(appointmentId, { status: 'cancelled' });
      await fetchData(); // Refresh all data
      
      if (uiState.activeModal === 'customerAppointments') {
          const updatedAppointments = uiState.customerAppointments.filter(apt => apt.id !== appointmentId);
          if (updatedAppointments.length > 0) {
              dispatch({ type: 'SET_CUSTOMER_VIEW', payload: { phone: uiState.customerLookupPhone, appointments: updatedAppointments } });
          } else {
              dispatch({ type: 'CLOSE_MODALS' });
          }
      }
  };
  
  // Handlers for Super Admin and Barber Dashboard actions
  const onUpdateBarber = async (updatedBarber: Barber) => {
      const { id, ...updates } = updatedBarber;
      const updatePayload: BarberUpdate = {
        ...updates,
        services: updatedBarber.services as unknown as Json,
        blockedSlots: updatedBarber.blockedSlots as unknown as Json,
        scheduleOverrides: updatedBarber.scheduleOverrides as unknown as Json,
        timeOff: updatedBarber.timeOff as unknown as Json,
        dailyLocationOverrides: updatedBarber.dailyLocationOverrides as unknown as Json
      };

      await api.updateBarber(id, updatePayload);
      await fetchData();
  };
  
  const onUpdateBusiness = async (updatedBusiness: Business) => {
      const { id, ...updates } = updatedBusiness;
      await api.updateBusiness(id, updates);
      await fetchData();
  };

  const onAddBarber = async (newBarber: api.SignUpCredentials, businessId: string) => {
      await api.createBarber(newBarber, businessId);
      await fetchData();
  };
  
  const onRemoveBarber = async (barberId: string) => {
      await api.removeBarber(barberId);
      await fetchData();
  };
  
  const onAddBusiness = async (newBusiness: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) => {
      await api.addBusiness(newBusiness);
      await fetchData();
  };
  
  const onRemoveBusiness = async (businessId: string) => {
      showConfirmation({
        message: t('confirmRemoveBusiness'),
        onConfirm: async () => {
          await api.removeBusiness(businessId);
          await fetchData();
        }
      });
  };
  
  const onAddExpense = async (newExpense: ExpenseInsert) => {
      await api.addExpense(newExpense);
      await fetchData();
  };
  
  const onRemoveExpense = async (expenseId: string) => {
      await api.removeExpense(expenseId);
      await fetchData();
  };
  
  const onUpdateAppConfig = async (newConfig: AppConfigUpdate) => {
      await api.updateAppConfig(newConfig);
      const configData = await api.getAppConfig();
      setAppConfig(configData);
  };
  
  const onMarkAsNoShow = async (appointment: Appointment) => {
      await api.updateAppointment(appointment.id, { status: 'no-show' });
      if (appConfig?.noShowBlockLimit) {
          await api.handleNoShowCheck(appointment.customerPhone, appConfig.noShowBlockLimit);
      }
      await fetchData();
  };
  
  const handleSubmitReport = async (report: CustomerReportInsert) => {
    await api.addCustomerReport(report);
    dispatch({ type: 'CLOSE_MODALS' });
    // Optionally show a success message
  };

  const handleFooterClick = () => {
    const newCount = footerClickCount + 1;
    setFooterClickCount(newCount);
    if (newCount >= 5) {
      dispatch({ type: 'OPEN_MODAL', payload: { modal: 'superAdminLogin' } });
      setFooterClickCount(0);
    }
  };
  
  const handleImpersonateBarber = (barberId: string) => {
    const barberToImpersonate = barbers.find(b => b.id === barberId);
    if (barberToImpersonate) {
        setImpersonatedBarber(barberToImpersonate);
        setSelectedBarberId(null);
    }
  };

  const exitImpersonation = () => {
    setImpersonatedBarber(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900">
          <SpinnerIcon className="w-16 h-16 text-primary" />
        </div>
      );
    }

    if (session?.isOwner && !impersonatedBarber) {
      return (
        <SuperAdminPanel
          businesses={businesses}
          barbers={barbers}
          appointments={appointments}
          expenses={expenses}
          appConfig={appConfig!}
          onUpdateBarber={onUpdateBarber}
          onUpdateBusiness={onUpdateBusiness}
          onAddBarber={onAddBarber}
          onRemoveBarber={onRemoveBarber}
          onAddBusiness={onAddBusiness}
          onRemoveBusiness={onRemoveBusiness}
          onAddExpense={onAddExpense}
          onRemoveExpense={onRemoveExpense}
          onLogout={handleLogout}
          onUpdateAppConfig={onUpdateAppConfig}
          onImpersonateBarber={handleImpersonateBarber}
          onDataRefresh={fetchData}
          selectedBusinessId={selectedBusinessId}
          onSelectBusinessId={setSelectedBusinessId}
          activeTopLevelTab={activeTopLevelTab}
          onSetTopLevelTab={setActiveTopLevelTab}
        />
      );
    }

    if (activeUser) {
      return (
        <BarberDashboard
          barber={activeUser}
          allAppointments={appointments.filter(a => a.barberId === activeUser.id)}
          onUpdateDetails={async (details, services, newPassword) => {
              const { id, ...updates } = { ...activeUser, ...details, services };
              const updatePayload: BarberUpdate = {
                ...updates,
                services: services as unknown as Json,
                blockedSlots: updates.blockedSlots as unknown as Json,
                scheduleOverrides: updates.scheduleOverrides as unknown as Json,
                timeOff: updates.timeOff as unknown as Json,
                dailyLocationOverrides: updates.dailyLocationOverrides as unknown as Json
              };
              await api.updateBarber(id, updatePayload);
              if (newPassword) {
                  await api.updateUserPassword(newPassword);
              }
              await fetchData();
          }}
          onMarkAsNoShow={onMarkAsNoShow}
          onLogout={handleLogout}
          onCancelAppointment={handleCancelAppointment}
          onResetMyAppointments={() => { /* Implement if needed */ }}
          showGracePeriodWarning={showGracePeriodWarning}
          allowBarberLanguageControl={appConfig!.allowBarberLanguageControl}
          appConfig={appConfig!}
        />
      );
    }

    if (selectedBarber && selectedBusiness && appConfig) {
        const appointmentsForBarberOnDate = appointments.filter(a => 
            a.barberId === selectedBarberId && a.date === currentCustomerViewDate.toISOString().split('T')[0]
        );
        return (
            <div>
                <button
                    onClick={() => setSelectedBarberId(null)}
                    className="mb-6 flex items-center text-sm font-medium text-primary hover:text-blue-500"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    {t('backToBarberSelection')}
                </button>
                 <div className="flex flex-col sm:flex-row items-center justify-center text-center mb-8 gap-4 sm:gap-8">
                    {selectedBarber.avatarUrl ? (
                      <img src={selectedBarber.avatarUrl} alt={selectedBarber.name} className="w-28 h-28 rounded-full border-4 border-secondary object-cover shadow-lg" />
                    ) : (
                       <div className="w-28 h-28 rounded-full border-4 border-secondary bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center shadow-lg">
                           <span className="text-4xl text-neutral-500 dark:text-neutral-400">{selectedBarber.name.charAt(0)}</span>
                       </div>
                    )}
                    <div>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{selectedBarber.name}</h2>
                        {selectedBusiness.address && <p className="text-neutral-600 dark:text-neutral-400 mt-1 flex items-center justify-center gap-1.5"><MapPinIcon className="w-4 h-4"/>{selectedBusiness.address}</p>}
                    </div>
                </div>
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => handleDayChange(-1)} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <h3 className="text-lg font-semibold text-center whitespace-nowrap">
                        {t('appointmentsForDate', { date: currentCustomerViewDate.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) })}
                    </h3>
                    <button onClick={() => handleDayChange(1)} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>
                <BarberScheduleDisplay
                    barber={selectedBarber}
                    appointments={appointmentsForBarberOnDate}
                    displayDate={currentCustomerViewDate}
                    onSelectSlot={handleSelectSlot}
                    bookingType={bookingType}
                    onBookingTypeChange={setBookingType}
                    appConfig={appConfig}
                />
            </div>
        );
    }
    
    // Fallback loading check to prevent crash if appConfig is not yet loaded
    if (!appConfig) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900">
          <SpinnerIcon className="w-16 h-16 text-primary" />
        </div>
      );
    }

    return <BarberSelector 
              barbers={barbers} 
              businesses={businesses} 
              onSelectBarber={setSelectedBarberId} 
              showServicesOnSelector={appConfig.showServicesOnSelector}
           />;
  };
  
  const showLoginButton = !session && !impersonatedBarber;

  return (
    <div className={`min-h-screen font-sans antialiased`}>
      <header className="p-4 shadow-md bg-white dark:bg-neutral-800 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <Logo logoUrl={selectedBusiness?.logoUrl}/>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher allowedLanguages={selectedBarber?.allowedLanguages || null} />
            <ThemeToggle />
            {showLoginButton && (
                <button
                    onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'barberLogin' } })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md transition-colors text-sm font-medium"
                    aria-label={t('loginButton')}
                >
                    <UserIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('barberLoginTitle')}</span>
                </button>
            )}
            {session && <AuthMenu session={session} onLogout={handleLogout} onLoginClick={() => {}} />}
          </div>
        </div>
        {impersonatedBarber && (
             <div className="absolute inset-x-0 bottom-0 translate-y-full bg-red-600 text-white text-xs text-center py-1.5 px-4 flex justify-between items-center">
                <span>{t('impersonationBannerText', {name: impersonatedBarber.name})}</span>
                <button onClick={exitImpersonation} className="font-bold underline">{t('impersonationExitButton')}</button>
            </div>
        )}
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      <footer className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm mt-12">
        <div className="container mx-auto p-6 text-center">
            <div className="flex justify-center items-center gap-6 mb-4">
               <button onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'customerLookup' } })} className="hover:text-primary transition-colors">{t('manageMyAppointmentButton')}</button>
               <button onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'contact' } })} className="hover:text-primary transition-colors">{t('footerInterestButton')}</button>
               <button onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'reportProblem' } })} className="hover:text-primary transition-colors">{t('reportProblemButton')}</button>
            </div>
            <p onClick={handleFooterClick} className="cursor-pointer select-none">
              &copy; {new Date().getFullYear()} {appConfig?.appName || 'MReserv'}. {t('footerRights')}
            </p>
        </div>
      </footer>
      
      {/* Modals */}
      {selectedBarber && selectedBusiness && appConfig && (
        <BookingFormModal
          isOpen={uiState.activeModal === 'booking'}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          onSubmit={handleBookingSubmit}
          slotTime={uiState.bookingSlot || ''}
          barber={selectedBarber}
          currentDate={currentCustomerViewDate}
          bookingType={bookingType}
          appConfig={appConfig}
          business={selectedBusiness}
        />
      )}
      <BarberLoginModal isOpen={uiState.activeModal === 'barberLogin'} onClose={() => dispatch({ type: 'CLOSE_MODALS' })} onLoginAttempt={handleLoginAttempt} error={uiState.modalError} />
      <SuperAdminLoginModal isOpen={uiState.activeModal === 'superAdminLogin'} onClose={() => dispatch({ type: 'CLOSE_MODALS' })} onLoginAttempt={handleSuperAdminLoginAttempt} error={uiState.modalError} />
      <CustomerLookupModal isOpen={uiState.activeModal === 'customerLookup'} onClose={() => dispatch({ type: 'CLOSE_MODALS' })} onLookup={handleCustomerLookup} error={uiState.modalError} />
      <CustomerAppointmentsModal isOpen={uiState.activeModal === 'customerAppointments'} onClose={() => dispatch({ type: 'CLOSE_MODALS' })} appointments={uiState.customerAppointments} barbers={barbers} onCancelAppointment={handleCancelAppointment} customerPhoneNumber={uiState.customerLookupPhone} />
      {session?.profile && <SubscriptionOverdueModal isOpen={showOverdueModal} onClose={() => setShowOverdueModal(false)} subscriptionValidUntil={businesses.find(b=>b.id===session.profile?.businessId)?.subscriptionValidUntil || ''} />}
      <ContactModal isOpen={uiState.activeModal === 'contact'} onClose={() => dispatch({ type: 'CLOSE_MODALS' })} contactEmail={appConfig?.contactEmail || undefined} />
      <NetworkErrorModal isOpen={!!networkError} onRetry={() => window.location.reload()} onClose={() => setNetworkError(null)} appUrl={networkError || ''}/>
      <ReportProblemModal isOpen={uiState.activeModal === 'reportProblem'} onClose={() => dispatch({ type: 'CLOSE_MODALS' })} onSubmit={handleSubmitReport} businesses={businesses} barbers={barbers} />

    </div>
  );
};

export default App;