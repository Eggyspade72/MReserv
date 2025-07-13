

import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ScheduleData {
  recurringClosedDays: number[];
  scheduleOverrides: Record<string, { closed: boolean }>;
}

interface ScheduleCalendarProps {
  scheduleData: ScheduleData;
  onScheduleChange: (newSchedule: ScheduleData) => void;
  onDayClick?: (date: Date) => void;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ scheduleData, onScheduleChange, onDayClick }) => {
  const { language, t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });

  const { recurringClosedDays: recurringClosedDaysArray, scheduleOverrides } = scheduleData;
  const recurringClosedDays = useMemo(() => new Set(recurringClosedDaysArray), [recurringClosedDaysArray]);

  const changeMonth = (amount: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setUTCMonth(newDate.getUTCMonth() + amount);
      return newDate;
    });
  };

  const toggleWeekday = (dayIndex: number) => {
    const newRecurringClosedDaysSet = new Set(recurringClosedDaysArray);
    let cleanedOverrides = { ...scheduleOverrides };

    if (newRecurringClosedDaysSet.has(dayIndex)) {
      // It WAS closed, now we are OPENING it.
      newRecurringClosedDaysSet.delete(dayIndex);
      // No override cleaning needed when opening a day globally.
      // Exceptions for closing specific dates should persist.
    } else {
      // It WAS open, now we are CLOSING it.
      newRecurringClosedDaysSet.add(dayIndex);
      // When closing a weekday, clear all date-specific overrides on that day.
      // This ensures the entire weekday becomes red.
      cleanedOverrides = Object.entries(scheduleOverrides).reduce((acc, [dateStr, info]) => {
        const date = new Date(`${dateStr}T00:00:00Z`); // Treat as UTC
        if (date.getUTCDay() !== dayIndex) {
          acc[dateStr] = info;
        }
        return acc;
      }, {} as Record<string, { closed: boolean }>);
    }

    const newRecurringClosedDays = Array.from(newRecurringClosedDaysSet).sort((a, b) => a - b);
    
    onScheduleChange({
      recurringClosedDays: newRecurringClosedDays,
      scheduleOverrides: cleanedOverrides,
    });
  };

  const handleDayInteraction = (date: Date) => {
    if (onDayClick) {
        onDayClick(date);
    } else {
        toggleDateOverride(date);
    }
  };

  const toggleDateOverride = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const weekday = date.getUTCDay();
    
    const isCurrentlyRecurringClosed = recurringClosedDays.has(weekday);
    const currentOverride = scheduleOverrides[dateStr];
    
    const newOverrides = {...scheduleOverrides};

    if (currentOverride === undefined) {
        // No override exists, create one that's the opposite of the recurring rule.
        newOverrides[dateStr] = { closed: !isCurrentlyRecurringClosed };
    } else {
        // An override exists, flip its state.
        newOverrides[dateStr] = { closed: !currentOverride.closed };
    }
    
    // If the new override state is the same as the recurring rule, it's redundant. Remove it.
    if (newOverrides[dateStr].closed === isCurrentlyRecurringClosed) {
        delete newOverrides[dateStr];
    }

    onScheduleChange({
        recurringClosedDays: recurringClosedDaysArray,
        scheduleOverrides: newOverrides,
    });
  };

  const today = useMemo(() => {
      const d = new Date();
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }, []);

  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const firstDayOfMonthInUTC = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const weekdays = useMemo(() => {
    const dayNames = t('days');
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map(d => ({ index: d, label: (dayNames as any)[d] }));
  }, [t]);

  const renderDays = () => {
    const days = [];
    const startOffset = (firstDayOfMonthInUTC === 0) ? 6 : firstDayOfMonthInUTC - 1; 

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-start-${i}`} className="p-1"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month, day));
      const dateStr = date.toISOString().split('T')[0];
      const weekday = date.getUTCDay();
      
      const override = scheduleOverrides[dateStr];
      const isRecurringClosed = recurringClosedDays.has(weekday);
      const isClosed = override !== undefined ? override.closed : isRecurringClosed;
      
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();

      const baseClasses = 'w-10 h-10 flex items-center justify-center rounded-lg text-sm transition-colors duration-200';
      const stateClasses = isClosed
        ? 'bg-red-500 text-white'
        : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700';

      const todayClasses = isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : '';
      const interactionClasses = isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

      days.push(
        <div key={day} className="flex justify-center items-center">
          <button
            type="button"
            onClick={() => !isPast && handleDayInteraction(date)}
            disabled={isPast}
            className={`${baseClasses} ${stateClasses} ${todayClasses} ${interactionClasses}`}
          >
            {day}
          </button>
        </div>
      );
    }
    return days;
  };
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-lg shadow-sm w-full">
        <div className="flex justify-center gap-1 mb-4">
            {weekdays.map(({ index, label }) => {
                 const isRecurringClosed = recurringClosedDays.has(index);
                 return (
                    <label key={index} className={`flex items-center justify-center w-10 h-10 rounded-md cursor-pointer text-sm font-bold transition-colors ${isRecurringClosed ? 'bg-red-500 text-white' : 'bg-neutral-200 dark:bg-neutral-600'}`}>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={!isRecurringClosed}
                            onChange={() => toggleWeekday(index)}
                        />
                        {label}
                    </label>
                 )
            })}
        </div>

      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
            {currentMonth.toLocaleDateString(language, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </div>
          <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2">
            {weekdays.map(({ label }) => <div key={label}>{label}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;