







import React from 'react';
import { Barber, Appointment, TimeSlotDisplayInfo, AppConfig } from '../types';
import { ClockIcon, LockClosedIcon, HomeIcon, MapPinIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface BarberScheduleDisplayProps {
  barber: Barber;
  appointments: Appointment[];
  displayDate: Date;
  onSelectSlot: (slotStartTime: string) => void;
  bookingType: 'in-shop' | 'on-location';
  onBookingTypeChange: (type: 'in-shop' | 'on-location') => void;
  appConfig: AppConfig;
}

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

interface BookingTypeTabProps {
  type: 'in-shop' | 'on-location';
  children: React.ReactNode;
  bookingType: 'in-shop' | 'on-location';
  onClick: (type: 'in-shop' | 'on-location') => void;
}

const BookingTypeTab: React.FC<BookingTypeTabProps> = ({ type, children, bookingType, onClick }) => (
  <button
    onClick={() => onClick(type)}
    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${bookingType === type ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-primary'}`}
  >
    {children}
  </button>
);


const BarberScheduleDisplay: React.FC<BarberScheduleDisplayProps> = ({
  barber,
  appointments,
  displayDate,
  onSelectSlot,
  bookingType,
  onBookingTypeChange,
  appConfig
}) => {
  const { t, language } = useLanguage();

  const displayDateString = displayDate.toISOString().split('T')[0];
  const dayOfWeek = displayDate.getDay();
  const scheduleOverride = barber.scheduleOverrides[displayDateString];
  // FIX: Corrected property access from daily_location_overrides to dailyLocationOverrides.
  const locationOverride = barber.dailyLocationOverrides?.[displayDateString];
  
  let isWorkingToday: boolean;
  let effectiveBookingType = bookingType;
  let showTypeTabs = barber.onLocationMode === 'optional';

  // Check for multi-day vacations/time off first, as it's a hard block
  const isOnHoliday = barber.timeOff.some(off => {
    const start = new Date(`${off.startDate}T00:00:00`);
    const end = new Date(`${off.endDate}T23:59:59`);
    return displayDate >= start && displayDate <= end;
  });

  if (scheduleOverride !== undefined) {
    // A specific rule for this day takes precedence over recurring rules
    isWorkingToday = !scheduleOverride.closed;
  } else {
    // No specific rule, use the recurring schedule based on booking type
    const isDayAvailableForOnLocation = barber.onLocationDays.includes(dayOfWeek);
    const isDayAvailableForInShop = !barber.recurringClosedDays.includes(dayOfWeek);

    if (barber.onLocationMode === 'exclusive') {
        isWorkingToday = isDayAvailableForOnLocation;
    } else if (barber.onLocationMode === 'optional') {
        isWorkingToday = bookingType === 'in-shop' ? isDayAvailableForInShop : isDayAvailableForOnLocation;
    } else { // 'none'
        isWorkingToday = isDayAvailableForInShop;
    }
  }
  
  // Handle daily location override
  if (locationOverride) {
    showTypeTabs = false; // An override exists, so the choice is fixed
    if (locationOverride === 'on-location-exclusive') {
        effectiveBookingType = 'on-location';
        isWorkingToday = barber.onLocationDays.includes(dayOfWeek);
    } else { // 'in-shop-exclusive'
        effectiveBookingType = 'in-shop';
        isWorkingToday = !barber.recurringClosedDays.includes(dayOfWeek);
    }
  } else if (barber.onLocationMode === 'exclusive') {
      showTypeTabs = false;
      effectiveBookingType = 'on-location';
  } else if (barber.onLocationMode === 'none') {
      showTypeTabs = false;
      effectiveBookingType = 'in-shop';
  }


  // A holiday overrides any working day decision
  if (isOnHoliday) {
      isWorkingToday = false;
  }
  
  if (!isWorkingToday) {
     return (
        <div className="bg-neutral-100 dark:bg-neutral-700 p-6 rounded-lg shadow-inner text-center">
            <LockClosedIcon className="w-12 h-12 mx-auto text-amber-500 mb-3" />
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                {isOnHoliday ? t('barberOnHoliday') : t('barberNotWorkingToday')}
            </h3>
        </div>
      );
  }

  const GRID_RESOLUTION_MINUTES = 15;
  const timeSlots: TimeSlotDisplayInfo[] = [];
  const startMinutes = timeToMinutes(barber.workStartTime);
  const endMinutes = timeToMinutes(barber.workEndTime);
    
  const now = new Date();

  for (let i = startMinutes; i < endMinutes; i += GRID_RESOLUTION_MINUTES) {
    const slotStartTime = minutesToTime(i);
    const slotEndTime = minutesToTime(i + GRID_RESOLUTION_MINUTES);
    
    const isBookedByAppointment = appointments.some(apt => {
        const apptStartMinutes = timeToMinutes(apt.slotTime);
        const apptEndMinutes = apptStartMinutes + apt.totalDuration;
        return i >= apptStartMinutes && i < apptEndMinutes;
    });

    const isBlockedManually = barber.blockedSlots.some(block => {
        if (block.date !== displayDateString) return false;
        const blockStartMinutes = timeToMinutes(block.startTime);
        const blockEndMinutes = blockStartMinutes + block.duration;
        return i >= blockStartMinutes && i < blockEndMinutes;
    });
    
    const isBooked = isBookedByAppointment || isBlockedManually;

    const [hours, minutes] = slotStartTime.split(':').map(Number);
    const slotDateTime = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      displayDate.getDate(),
      hours,
      minutes,
      0, 0
    );
    const isPast = slotDateTime < now;

    const isWalkinBufferActive = appConfig.enableWalkinBuffer && barber.enableWalkinBuffer;
    const isWalkinOnly = isWalkinBufferActive && !isPast && (slotDateTime.getTime() - now.getTime() < barber.walkinBufferMinutes * 60 * 1000);

    timeSlots.push({
      startTime: slotStartTime,
      endTime: slotEndTime,
      isBooked,
      isPast,
      isWalkinOnly,
    });
  }

  if (timeSlots.length === 0) {
    return <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('noTimeSlotsAvailableDate', {date: displayDate.toLocaleDateString(language)})}</p>;
  }

  const title = effectiveBookingType === 'in-shop' 
    ? t('availableTimeSlotsTitle') 
    : t('availableOnLocationTimeSlotsTitle');
  const Icon = effectiveBookingType === 'in-shop' ? MapPinIcon : HomeIcon;

  return (
    <>
      {showTypeTabs && (
        <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6 flex justify-center">
          <nav className="-mb-px flex gap-4" aria-label="Tabs">
            <BookingTypeTab type="in-shop" bookingType={bookingType} onClick={onBookingTypeChange}><MapPinIcon className="w-5 h-5" />{t('bookingTypeTabInShop')}</BookingTypeTab>
            <BookingTypeTab type="on-location" bookingType={bookingType} onClick={onBookingTypeChange}><HomeIcon className="w-5 h-5" />{t('bookingTypeTabOnLocation')}</BookingTypeTab>
          </nav>
        </div>
      )}
      <div className="bg-neutral-100 dark:bg-neutral-700 p-6 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-6 text-center flex items-center justify-center gap-2">
          <Icon className="w-6 h-6" />
          {title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {timeSlots.map(slot => {
              const isDisabled = slot.isBooked || slot.isPast || slot.isWalkinOnly;
              let statusLabel = t('availableLabel');
              let buttonClasses = 'bg-secondary hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
              
              if(slot.isBooked) {
                  statusLabel = t('bookedStatus');
                  buttonClasses = 'bg-neutral-200 dark:bg-neutral-600 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-70 line-through';
              } else if (slot.isPast) {
                  statusLabel = t('pastStatus');
                  buttonClasses = 'bg-neutral-200 dark:bg-neutral-600 text-neutral-400 dark:text-neutral-500 cursor-not-allowed opacity-70';
              } else if (slot.isWalkinOnly) {
                  statusLabel = t('walkinOnlyStatus');
                  buttonClasses = 'bg-amber-500 text-white cursor-not-allowed opacity-90';
              }
            
              return (
                <button
                  type="button"
                  key={slot.startTime}
                  onClick={() => !isDisabled && onSelectSlot(slot.startTime)}
                  disabled={isDisabled}
                  className={`p-3 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex flex-col items-center ${buttonClasses}`}
                  aria-label={
                      slot.isBooked 
                        ? t('ariaSlotBooked', { time: slot.startTime }) 
                        : slot.isPast 
                        ? t('ariaSlotPast', { time: slot.startTime })
                        : slot.isWalkinOnly
                        ? t('ariaSlotWalkinOnly', { time: slot.startTime })
                        : t('ariaSelectSlot', { time: slot.startTime })
                  }
                >
                  <div className="flex items-center justify-center mb-1">
                    {slot.isBooked ? <LockClosedIcon className="w-4 h-4 mr-1" /> : <ClockIcon className="w-4 h-4 mr-1" />}
                    <span>{slot.startTime}</span>
                  </div>
                   <span className="text-xs opacity-80 dark:text-neutral-300">
                      {statusLabel}
                   </span>
                </button>
              )
          })}
        </div>
      </div>
    </>
  );
};

export default BarberScheduleDisplay;