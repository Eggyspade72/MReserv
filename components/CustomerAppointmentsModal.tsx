
import React from 'react';
import { Appointment, Barber } from '../types';
import { CalendarIcon, ClockIcon, UserCircleIcon, TrashIcon, XCircleIcon, PhoneIcon, HomeIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';

interface CustomerAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  barbers: Barber[];
  onCancelAppointment: (appointmentId: string) => void;
  customerPhoneNumber: string;
}

const CustomerAppointmentsModal: React.FC<CustomerAppointmentsModalProps> = ({
  isOpen,
  onClose,
  appointments,
  barbers,
  onCancelAppointment,
  customerPhoneNumber,
}) => {
  const { t, language } = useLanguage();
  const { showConfirmation } = useConfirmation();

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber ? barber.name : t('unknownBarber'); 
  };

  const handleCancelClick = (appointmentId: string) => {
    showConfirmation({
        message: t('confirmCancelAppointment'),
        onConfirm: () => onCancelAppointment(appointmentId)
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-appointments-title"
    >
      <div className="bg-white dark:bg-neutral-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 id="customer-appointments-title" className="text-2xl font-semibold text-primary">
            {t('yourAppointmentsTitle')}
          </h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" aria-label={t('ariaCloseCustomerAppointmentsModal')}>
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>

        <p className="text-neutral-600 dark:text-neutral-300 mb-1 text-sm flex items-center">
            <PhoneIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"/>
            {t('customerAppointmentsForPhone', {phone: customerPhoneNumber})}
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-xs">{t('changeAppointmentNotice')}</p>

        {appointments.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-md shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center">
                      <UserCircleIcon className="w-5 h-5 mr-2 text-secondary"/> 
                      {getBarberName(apt.barberId)}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"/> 
                      {new Date(`${apt.date}T00:00:00`).toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"/> 
                      {apt.slotTime}
                    </p>
                    
                    <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                       <h4 className="text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">{t('appointmentServices')}</h4>
                       <ul className="text-sm text-neutral-700 dark:text-neutral-300 list-disc list-inside">
                           {apt.services.map(s => <li key={s.id}>{s.name} (€{s.price})</li>)}
                       </ul>
                       <p className="font-bold text-sm mt-1">{t('totalPrice')}: €{apt.totalPrice}</p>
                    </div>

                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCancelClick(apt.id)}
                    className="p-1.5 text-red-500 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                    aria-label={t('ariaCancelThisAppointment')}
                  >
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">{t('noUpcomingAppointments')}</p>
        )}

        <div className="flex justify-end mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-white dark:text-neutral-100 bg-primary hover:bg-blue-600 rounded-md transition"
          >
            {t('closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerAppointmentsModal;
