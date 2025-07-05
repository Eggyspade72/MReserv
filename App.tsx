


import React, { useState, useEffect, useCallback } from 'react';
import { Barber, Appointment, Service, TimeOff, AppointmentStatus, AppConfig, Expense, Business } from './types';
import * as api from './services/api';
import BarberSelector from './components/BarberSelector';
import BarberScheduleDisplay from './components/BarberScheduleDisplay';
import BookingFormModal from './components/BookingFormModal';
import BarberLoginModal from './components/BarberLoginModal';
import BarberDashboard from './components/BarberDashboard';
import CustomerLookupModal from './components/CustomerLookupModal';
import CustomerAppointmentsModal from './components/CustomerAppointmentsModal';
import SuperAdminLoginModal from './components/SuperAdminLoginModal';
import SuperAdminPanel from './components/SuperAdminPanel';
import SubscriptionOverdueModal from './components/SubscriptionOverdueModal';
import ContactModal from './components/ContactModal';
import { UserIcon, CalendarIcon, CogIcon, ArrowLeftIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, PhoneIcon, MapPinIcon, LogoutIcon, HomeIcon } from './components/Icons';
import { useLanguage, Language } from './contexts/LanguageContext';
import { useConfirmation } from './contexts/ConfirmationContext';
import ThemeToggle from './components/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';
import AuthMenu from './components/AuthMenu';
import Logo from './components/Logo';
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from './constants';

type Session = {
    type: 'barber' | 'owner';
    user?: Barber; // Only for 'barber' type
} | null;

// Helper to check if a barber is effectively closed
const isBarberEffectivelyClosed = (barber: Barber, business: Business | undefined) => {
    const isClosedBySchedule = barber.recurringClosedDays.length === 7 && Object.keys(barber.scheduleOverrides).length === 0 && (barber.services.length === 0 && barber.onLocationMode !== 'exclusive');
    
    if (!business) return true; // Can't operate without a business

    const now = new Date();
    const validUntilDate = new Date(business.subscriptionValidUntil);
    const gracePeriodEndDate = new Date(new Date(business.subscriptionValidUntil).setDate(validUntilDate.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS));
    
    const isClosedBySubscription = business.subscriptionStatus === 'cancelled' || (business.subscriptionStatus === 'past_due' && now > gracePeriodEndDate);

    return isClosedBySchedule || isClosedBySubscription;
};

const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { showConfirmation } = useConfirmation();

  // APP STATE
  const [session, setSession] = useState<Session>(null);
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
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  
  const [showBarberLoginModal, setShowBarberLoginModal] = useState<boolean>(false);
  const [barberLoginError, setBarberLoginError] = useState<string>('');

  const [showCustomerLookupModal, setShowCustomerLookupModal] = useState<boolean>(false);
  const [customerLookupPhoneNumber, setCustomerLookupPhoneNumber] = useState<string>('');
  const [customerAppointments, setCustomerAppointments] = useState<Appointment[]>([]);
  const [showCustomerAppointmentsModal, setShowCustomerAppointmentsModal] = useState<boolean>(false);
  const [customerManagementError, setCustomerManagementError] = useState<string>('');
  
  const [showContactModal, setShowContactModal] = useState<boolean>(false);

  const [showSuperAdminLoginModal, setShowSuperAdminLoginModal] = useState<boolean>(false);
  const [superAdminLoginError, setSuperAdminLoginError] = useState<string>('');
  const [footerClickCount, setFooterClickCount] = useState(0);

  const [bookingType, setBookingType] = useState<'in-shop' | 'on-location'>('in-shop');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [businessesData, barbersData, appointmentsData, expensesData, configData] = await Promise.all([
        api.getBusinesses(),
        api.getBarbers(),
        api.getAppointments(),
        api.getExpenses(),
        api.getAppConfig(),
      ]);
      setBusinesses(businessesData);
      setBarbers(barbersData);
      setAppointments(appointmentsData);
      setExpenses(expensesData);
      setAppConfig(configData);
    } catch (error) {
      console.error("Failed to fetch data from backend:", error);
      // Here you could set an error state to show a message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const barber = barbers.find(b => b.id === selectedBarberId);
    if (barber) {
      const business = businesses.find(b => b.id === barber.businessId);
      const theme = business?.theme || 'default';
      document.documentElement.setAttribute('data-theme', theme);
      setCurrentCustomerViewDate(new Date());
      setBookingType(barber.onLocationMode === 'exclusive' ? 'on-location' : 'in-shop');
    } else {
      document.documentElement.setAttribute('data-theme', 'default');
    }

    return () => {
        document.documentElement.setAttribute('data-theme', 'default');
    };
  }, [selectedBarberId, barbers, businesses]);
    
  useEffect(() => {
    if (footerClickCount > 0) {
      const timer = setTimeout(() => setFooterClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [footerClickCount]);

  useEffect(() => {
    if (showCustomerAppointmentsModal && customerLookupPhoneNumber) {
        const foundAppointments = appointments.filter(
            apt => apt.customerPhone === customerLookupPhoneNumber && apt.status === 'booked'
        ).sort((a,b) => new Date(`${a.date}T${a.slotTime}`).getTime() - new Date(`${b.date}T${b.slotTime}`).getTime());
        setCustomerAppointments(foundAppointments);
        
        if (foundAppointments.length === 0) {
            setShowCustomerAppointmentsModal(false);
        }
    }
  }, [appointments, showCustomerAppointmentsModal, customerLookupPhoneNumber]);

  useEffect(() => {
    if (!session || session.type !== 'barber') {
        setShowGracePeriodWarning(false);
    }
  }, [session]);

  const handleImpersonateBarber = (barberId: string) => {
    const barberToImpersonate = barbers.find(b => b.id === barberId);
    if (barberToImpersonate) {
      setImpersonatedBarber(barberToImpersonate);
    }
  };

  const handleExitImpersonation = () => {
    setImpersonatedBarber(null);
  };

  const handleBarberSelect = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return;
    const business = businesses.find(b => b.id === barber.businessId);

    if (isBarberEffectivelyClosed(barber, business)) {
        alert(t('barberNotAcceptingAppointmentsMsg', { name: barber?.name || 'Barber'}));
        setSelectedBarberId(null);
        return;
    }
    setSelectedBarberId(barberId);
    setSession(null);
  };

  const handleGoBackToSelector = () => {
    setSelectedBarberId(null);
  };

  const handleOpenBookingModal = (slotTime: string) => {
    setSelectedSlotTime(slotTime);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedSlotTime(null);
  };

  const handleBookSlot = async (customerName: string, customerPhone: string, selectedServices: Service[]) => {
    if (selectedBarberId && selectedSlotTime && selectedServices.length > 0) {
      const dateString = currentCustomerViewDate.toISOString().split('T')[0];
      const selectedBarber = barbers.find(b => b.id === selectedBarberId);

      if (!selectedBarber) return;
      
      if (appointments.some(apt => apt.customerPhone === customerPhone && apt.date === dateString)) {
        throw new Error('ALREADY_BOOKED_TODAY');
      }
      
      const { totalPrice, totalDuration } = selectedServices.reduce((acc, s) => ({
          totalPrice: acc.totalPrice + s.price,
          totalDuration: acc.totalDuration + s.duration
      }), { totalPrice: 0, totalDuration: 0 });

      const newAppointment: Omit<Appointment, 'id'> = {
        barberId: selectedBarberId,
        businessId: selectedBarber.businessId,
        date: dateString,
        slotTime: selectedSlotTime,
        customerName,
        customerPhone,
        services: selectedServices,
        totalDuration,
        totalPrice,
        status: 'booked',
      };
      await api.addAppointment(newAppointment);
      await fetchData();
      handleCloseBookingModal();
    }
  };
  
  const handleCancelAppointment = async (appointmentId: string) => {
     await api.updateAppointment(appointmentId, { status: 'cancelled' });
     await fetchData();
  };
  
  const handleRemoveAppointmentFromHistory = async (appointmentIdToRemove: string) => {
    await api.removeAppointment(appointmentIdToRemove);
    await fetchData();
  };
  
  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
      await api.updateAppointment(appointmentId, { status });
      await fetchData();
  };
  
  const handleLogout = () => {
    setSession(null);
    setShowGracePeriodWarning(false);
    setImpersonatedBarber(null);
  };

  const handleAddBarber = async (newBarberData: Omit<Barber, 'id'>) => {
    await api.addBarber(newBarberData);
    await fetchData();
  };

  const handleAddBusiness = async (newBusinessData: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) => {
    await api.addBusiness(newBusinessData);
    await fetchData();
  };
  
  const handleUpdateBarber = async (updatedBarber: Barber) => {
    const business = businesses.find(b => b.id === updatedBarber.businessId);
    await api.updateBarber(updatedBarber.id, updatedBarber);
    await fetchData();
    if (isBarberEffectivelyClosed(updatedBarber, business) && selectedBarberId === updatedBarber.id) {
        setSelectedBarberId(null); 
        alert(t('barberNowClosedAdminUpdate', {name: updatedBarber.name}));
    }
  };

  const handleUpdateBusiness = async (updatedBusiness: Business) => {
    await api.updateBusiness(updatedBusiness.id, updatedBusiness);
    await fetchData();
  };

  const handleRemoveBarber = async (barberIdToRemove: string) => {
    await api.removeBarber(barberIdToRemove);
    await fetchData();
    if (selectedBarberId === barberIdToRemove) setSelectedBarberId(null);
    if (session?.type === 'barber' && session.user?.id === barberIdToRemove) setSession(null);
  };

  const handleRemoveBusiness = async (businessIdToRemove: string) => {
      showConfirmation({
          message: `Are you sure you want to remove this business and all its barbers and appointments? This cannot be undone.`,
          onConfirm: async () => {
              await api.removeBusiness(businessIdToRemove);
              await fetchData();
          }
      });
  };
  
  const handleUpdateAppConfig = async (newConfig: AppConfig) => {
    await api.updateAppConfig(newConfig);
    await fetchData();
  };

  const handleBarberLoginAttempt = async (username: string, passwordAttempt: string) => {
    const { data: barber, error } = await api.getBarberByCredentials(username, passwordAttempt);

    if (error || !barber) {
      setBarberLoginError(t('errorInvalidBarberCredentials'));
      return;
    }
    const business = businesses.find(b => b.id === barber.businessId);
    if (!business) {
        setBarberLoginError(t('barberLoginSuspendedAccountError'));
        return;
    }

    if (barber.preferredLanguage) {
      setLanguage(barber.preferredLanguage as Language);
    }

    const now = new Date();
    if (business.subscriptionStatus === 'cancelled') {
        setBarberLoginError(t('barberLoginSuspendedAccountError'));
        return;
    }
    
    let isInGracePeriod = false;
    const validUntilDate = new Date(business.subscriptionValidUntil);
    const isExpired = validUntilDate < now;

    if (isExpired && business.subscriptionStatus !== 'trial') {
        const gracePeriodEndDate = new Date(new Date(business.subscriptionValidUntil).setDate(validUntilDate.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS));
        
        if (now > gracePeriodEndDate) {
            setBarberLoginError(t('barberLoginSuspendedAccountError'));
            return;
        }
        isInGracePeriod = true;
    }

    if (isBarberEffectivelyClosed(barber, business) && !isInGracePeriod) {
      setBarberLoginError(t('barberLoginClosedAccountError'));
      return;
    }
    
    setSession({ type: 'barber', user: barber });
    setSelectedBarberId(null);
    setShowBarberLoginModal(false);
    setBarberLoginError('');
    setShowGracePeriodWarning(isInGracePeriod && !business.suppressGracePeriodWarning);
    
    if (isInGracePeriod && !business.suppressGracePeriodWarning) {
      setShowOverdueModal(true);
    }
  };
  
  const handleUpdateBarberDetailsByBarber = async (details: Partial<Barber>, services: Service[]) => {
    const currentlyLoggedInUser = impersonatedBarber || (session?.type === 'barber' ? session.user : null);
    if (!currentlyLoggedInUser) return;

    const barberToUpdate: Barber = { ...currentlyLoggedInUser, ...details, services };
    await api.updateBarber(currentlyLoggedInUser.id, barberToUpdate);
    const business = businesses.find(b => b.id === barberToUpdate.businessId);
    
    await fetchData();

    if (impersonatedBarber) {
        // Refetch the impersonated barber to ensure state is fresh
        const updatedImpersonated = (await api.getBarbers()).find(b => b.id === currentlyLoggedInUser.id);
        setImpersonatedBarber(updatedImpersonated || null);
    }

    if (isBarberEffectivelyClosed(barberToUpdate, business)) {
        alert(t('barberNowClosedSelfUpdate'));
        handleLogout();
    }
  };

  const handleCustomerLookup = (phone: string) => {
    const foundAppointments = appointments.filter(apt => apt.customerPhone === phone && apt.status === 'booked');
    if (foundAppointments.length > 0) {
      setCustomerLookupPhoneNumber(phone);
      setCustomerAppointments(foundAppointments);
      setShowCustomerLookupModal(false);
      setShowCustomerAppointmentsModal(true);
    } else {
      setCustomerManagementError(t('errorNoAppointmentsFoundForPhone'));
    }
  };

  const handleChangeCustomerViewDate = (direction: 'next' | 'prev') => {
    setCurrentCustomerViewDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.setHours(0,0,0,0) === today.setHours(0,0,0,0);
  };

  const isMaxDate = (date: Date, barber: Barber | null | undefined) => {
    if (!barber) return true;
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + barber.bookableDaysInAdvance - 1);
    return date >= maxDate;
  };

  const handleResetMyAppointmentsBarber = () => {
    const userToReset = impersonatedBarber || (session?.type === 'barber' ? session.user : null);
    if (userToReset) {
        showConfirmation({
            message: t('confirmResetMyAppointmentsBarber'),
            onConfirm: async () => {
                await api.removeAppointmentsForBarber(userToReset.id);
                await fetchData();
            }
        });
    }
  };
  
  const handleSuperAdminLoginAttempt = (username: string, passwordAttempt: string) => {
    if (username === 'mo' && passwordAttempt === '030602') {
      setSession({ type: 'owner' });
      setShowSuperAdminLoginModal(false);
      setSelectedBarberId(null);
    } else {
      setSuperAdminLoginError(t('errorInvalidAdminCredentials'));
    }
  };
  
  const handleCopyrightClick = () => {
    if (session?.type === 'owner') return;

    const newCount = footerClickCount + 1;
    setFooterClickCount(newCount);
    if (newCount >= 5) {
      setShowSuperAdminLoginModal(true);
      setFooterClickCount(0);
    }
  };
  
  const handleAddExpense = async (newExpense: Omit<Expense, 'id' | 'dateAdded'>) => {
    await api.addExpense(newExpense);
    await fetchData();
  };

  const handleRemoveExpense = async (expenseId: string) => {
    await api.removeExpense(expenseId);
    await fetchData();
  };

  if (isLoading || !appConfig) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }

  const selectedBarber = barbers.find(b => b.id === selectedBarberId);

  const renderMainContent = () => {
    if (session?.type === 'owner') {
        if (impersonatedBarber) {
             const business = businesses.find(b => b.id === impersonatedBarber.businessId);
             return <BarberDashboard 
                barber={impersonatedBarber} allAppointments={appointments.filter(a => a.barberId === impersonatedBarber!.id)}
                onUpdateDetails={handleUpdateBarberDetailsByBarber}
                onLogout={handleLogout} onCancelAppointment={handleCancelAppointment}
                onResetMyAppointments={handleResetMyAppointmentsBarber}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onRemoveAppointmentFromHistory={handleRemoveAppointmentFromHistory}
                showGracePeriodWarning={false}
                allowBarberLanguageControl={appConfig.allowBarberLanguageControl}
                 />;
        }
        return <SuperAdminPanel 
                    businesses={businesses}
                    barbers={barbers}
                    appointments={appointments}
                    expenses={expenses}
                    appConfig={appConfig}
                    onUpdateBarber={handleUpdateBarber}
                    onUpdateBusiness={handleUpdateBusiness}
                    onAddBarber={handleAddBarber}
                    onRemoveBarber={handleRemoveBarber}
                    onAddBusiness={handleAddBusiness}
                    onRemoveBusiness={handleRemoveBusiness}
                    onAddExpense={handleAddExpense}
                    onRemoveExpense={handleRemoveExpense}
                    onLogout={handleLogout}
                    onUpdateAppConfig={handleUpdateAppConfig}
                    onImpersonateBarber={handleImpersonateBarber}
                />
    }
    if (session?.type === 'barber' && session.user) {
        const business = businesses.find(b => b.id === session.user?.businessId);
        return <BarberDashboard 
                barber={session.user} allAppointments={appointments.filter(a => a.barberId === session.user!.id)}
                onUpdateDetails={handleUpdateBarberDetailsByBarber}
                onLogout={handleLogout} onCancelAppointment={handleCancelAppointment}
                onResetMyAppointments={handleResetMyAppointmentsBarber}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onRemoveAppointmentFromHistory={handleRemoveAppointmentFromHistory}
                showGracePeriodWarning={showGracePeriodWarning}
                allowBarberLanguageControl={appConfig.allowBarberLanguageControl}
                 />;
    }
    if (selectedBarber) {
      const business = businesses.find(b => b.id === selectedBarber.businessId);

      const BookingTypeTab: React.FC<{ type: 'in-shop' | 'on-location'; children: React.ReactNode }> = ({ type, children }) => (
        <button
          onClick={() => setBookingType(type)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${bookingType === type ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}
        >
          {children}
        </button>
      );

      return (
        <>
          <button onClick={handleGoBackToSelector} className="mb-6 flex items-center text-primary hover:text-blue-500"><ArrowLeftIcon className="w-5 h-5 me-2" />{t('backToBarberSelection')}</button>
          <div className="flex flex-col sm:flex-row items-start mb-6">
            {selectedBarber.avatarUrl && <img src={selectedBarber.avatarUrl} alt={selectedBarber.name} className="w-20 h-20 rounded-full me-6 mb-3 sm:mb-0 border-2 border-primary object-cover"/>}
            <div>
              <h2 className="text-3xl font-semibold">{selectedBarber.name}</h2>
              <p className="text-neutral-500"><CalendarIcon className="w-4 h-4 me-1 inline"/> {t('appointmentsForDate', { date: currentCustomerViewDate.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) })}</p>
              {selectedBarber.phoneNumber && <p className="text-sm text-neutral-500"><PhoneIcon className="w-4 h-4 me-2 inline"/> {selectedBarber.phoneNumber}</p>}
              {business?.address && <p className="text-sm text-neutral-500"><MapPinIcon className="w-4 h-4 me-2 inline"/> {business.address}</p>}
            </div>
          </div>
          
          <div className="flex justify-between items-center my-4">
              <button onClick={() => handleChangeCustomerViewDate('prev')} disabled={isToday(currentCustomerViewDate)} className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md disabled:opacity-50 flex items-center text-sm"><ChevronLeftIcon className="w-5 h-5 me-1" /> {t('previousDayButton')}</button>
              <span className="font-medium">{currentCustomerViewDate.toLocaleDateString(language, { weekday: 'short', month: 'long', day: 'numeric' })}</span>
              <button onClick={() => handleChangeCustomerViewDate('next')} disabled={isMaxDate(currentCustomerViewDate, selectedBarber)} className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md disabled:opacity-50 flex items-center text-sm">{t('nextDayButton')} <ChevronRightIcon className="w-5 h-5 ms-1" /></button>
          </div>

          {selectedBarber.onLocationMode === 'optional' && (
            <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6 flex justify-center">
              <nav className="-mb-px flex gap-4" aria-label="Tabs">
                <BookingTypeTab type="in-shop"><MapPinIcon className="w-5 h-5" />{t('bookingTypeTabInShop')}</BookingTypeTab>
                <BookingTypeTab type="on-location"><HomeIcon className="w-5 h-5" />{t('bookingTypeTabOnLocation')}</BookingTypeTab>
              </nav>
            </div>
          )}

          <BarberScheduleDisplay
            barber={selectedBarber}
            appointments={appointments.filter(apt => apt.barberId === selectedBarberId && apt.date === currentCustomerViewDate.toISOString().split('T')[0] && apt.status === 'booked')}
            displayDate={currentCustomerViewDate}
            onSelectSlot={handleOpenBookingModal}
            bookingType={bookingType}
          />
        </>
      );
    }
    return (
      <>
        <h2 className="text-3xl font-semibold text-center mb-6 flex items-center justify-center"><UserIcon className="w-8 h-8 me-3 text-primary"/>{t('selectYourBarber')}</h2>
        <BarberSelector 
            barbers={barbers.filter(b => businesses.find(biz => biz.id === b.businessId)?.subscriptionStatus !== 'cancelled')} 
            businesses={businesses}
            onSelectBarber={handleBarberSelect} 
            showServicesOnSelector={appConfig.showServicesOnSelector}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
       <header className="w-full max-w-6xl mb-4 z-20">
            <div className="relative flex justify-center items-center text-center py-4">
                <div className="absolute top-1/2 start-0 -translate-y-1/2">
                    <Logo />
                </div>
                <div className="flex-1">
                    <p className="text-neutral-600 dark:text-neutral-300 text-lg hidden md:block">{t('appTagline')}</p>
                </div>
                <div className="absolute top-1/2 end-0 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
                    <LanguageSwitcher allowedLanguages={selectedBarber?.allowedLanguages} />
                    <ThemeToggle />
                    <AuthMenu session={session} onLogout={handleLogout} onLoginClick={() => setShowBarberLoginModal(true)} />
                </div>
            </div>
        </header>
      
      {!session && !selectedBarberId && (
        <div className="w-full max-w-6xl mb-6 text-center">
          <button type="button" onClick={() => setShowCustomerLookupModal(true)} className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md flex items-center justify-center mx-auto text-base">
            <SearchIcon className="w-5 h-5 me-2" />{t('manageMyAppointmentButton')}
          </button>
        </div>
      )}

      {impersonatedBarber && (
        <div className="w-full max-w-6xl mb-4 p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-lg flex justify-between items-center shadow-md">
            <p className="text-sm font-medium">{t('impersonationBannerText', { name: impersonatedBarber.name })}</p>
            <button onClick={handleExitImpersonation} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-md flex items-center">
              <LogoutIcon className="w-4 h-4 me-1.5"/>
              {t('impersonationExitButton')}
            </button>
        </div>
      )}
      
      <main className="w-full max-w-6xl bg-white dark:bg-neutral-800 shadow-2xl rounded-xl p-6 md:p-8">
        {renderMainContent()}
      </main>

      {selectedBarber && selectedSlotTime && (
        <BookingFormModal
          isOpen={isBookingModalOpen} onClose={handleCloseBookingModal}
          onSubmit={handleBookSlot} slotTime={selectedSlotTime}
          barber={selectedBarber} currentDate={currentCustomerViewDate}
          bookingType={bookingType}
        />
      )}

      <BarberLoginModal isOpen={showBarberLoginModal} onClose={() => setShowBarberLoginModal(false)} onLoginAttempt={handleBarberLoginAttempt} error={barberLoginError} />
      <SuperAdminLoginModal isOpen={showSuperAdminLoginModal} onClose={() => setShowSuperAdminLoginModal(false)} onLoginAttempt={handleSuperAdminLoginAttempt} error={superAdminLoginError} />
      <CustomerLookupModal isOpen={showCustomerLookupModal} onClose={() => setShowCustomerLookupModal(false)} onLookup={handleCustomerLookup} error={customerManagementError} />
      <CustomerAppointmentsModal isOpen={showCustomerAppointmentsModal} onClose={() => setShowCustomerAppointmentsModal(false)} appointments={customerAppointments} barbers={barbers} onCancelAppointment={handleCancelAppointment} customerPhoneNumber={customerLookupPhoneNumber} />
      <SubscriptionOverdueModal isOpen={showOverdueModal} onClose={() => setShowOverdueModal(false)} subscriptionValidUntil={session?.type === 'barber' && session.user ? (businesses.find(b => b.id === session.user?.businessId)?.subscriptionValidUntil || '') : ''} />
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} contactEmail={appConfig.contactEmail} />

      <footer className="mt-12 text-center text-neutral-600 dark:text-neutral-400 text-sm w-full max-w-6xl">
        <p>
            <span onClick={handleCopyrightClick} className="cursor-pointer" title="Super Admin Access Trigger">&copy;</span>
            {' '}{new Date().getFullYear()} {appConfig.appName}. {t('footerRights')}
        </p>
        <p className="mb-4">{t('footerTagline')}</p>
        {!session && (
            <div className="flex justify-center items-center my-4">
                <button onClick={() => setShowContactModal(true)} className="px-6 py-3 bg-secondary hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition duration-150 flex items-center text-base">
                    {t('footerInterestButton')}
                </button>
            </div>
        )}
        <p className="text-xs mt-2">{t('poweredBy', { name: appConfig.appName })}</p>
      </footer>
    </div>
  );
};

export default App;