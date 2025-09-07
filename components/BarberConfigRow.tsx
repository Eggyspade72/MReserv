import React, { useState, useEffect } from 'react';
import { Barber, Appointment } from '../types';
import {
  SaveIcon, PencilIcon, TrashIcon, EyeIcon, PlusCircleIcon
} from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import ScheduleCalendar from './ScheduleCalendar';

interface ScheduleData {
  recurringClosedDays: number[];
  scheduleOverrides: Record<string, { closed: boolean }>;
}

interface BarberConfigRowProps {
  barber: Barber;
  appointments: Appointment[];
  onUpdateBarber: (updatedBarber: Barber) => void;
  onRemoveBarber: (barberId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onImpersonate: (barberId: string) => void;
}

const BarberConfigRow: React.FC<BarberConfigRowProps> = ({ barber, appointments, onUpdateBarber, onRemoveBarber, onCancelAppointment, onImpersonate }) => {
  const { t, language } = useLanguage();
  const { showConfirmation } = useConfirmation();

  const [isEditing, setIsEditing] = useState(false);
  const [viewingAppointments, setViewingAppointments] = useState(false);
  const [editableBarber, setEditableBarber] = useState<Barber>(barber);

  useEffect(() => {
    setEditableBarber(barber);
  }, [barber]);

  const handleEditToggle = () => {
    setViewingAppointments(false);
    setIsEditing(!isEditing);
    if (isEditing) {
      setEditableBarber(barber); // Reset changes if canceling
    }
  };

  const handleViewAppointmentsToggle = () => {
    setIsEditing(false);
    setViewingAppointments(!viewingAppointments);
  };
  
  const handleChange = (field: keyof Barber, value: Barber[keyof Barber]) => {
    setEditableBarber(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (index: number, field: keyof Barber['services'][0], value: string) => {
    const updatedServices = [...editableBarber.services];
    const serviceToUpdate = { ...updatedServices[index] };
    
    if (field === 'price' || field === 'duration') {
      // @ts-ignore
      serviceToUpdate[field] = Number(value);
    } else if (field === 'name') {
      // @ts-ignore
      serviceToUpdate[field] = value;
    }
    
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


  const handleSave = () => {
    if (!editableBarber.name.trim() || !editableBarber.email.trim()) {
      alert(t('alertBarberNameUsernameEmpty'));
      return;
    }
    onUpdateBarber(editableBarber);
    setIsEditing(false);
  };

  const barberAppointments = appointments
      .filter(apt => new Date(apt.date) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => new Date(`${a.date}T${a.slotTime}`).getTime() - new Date(`${b.date}T${a.slotTime}`).getTime());
  
  const handleRemoveClick = () => {
    showConfirmation({
        message: t('confirmRemoveBarber', { name: barber.name }),
        onConfirm: () => onRemoveBarber(barber.id)
    });
  };

  const handleCancelAppointmentClick = (appointmentId: string) => {
    showConfirmation({
        message: t('confirmCancelAppointment'),
        onConfirm: () => onCancelAppointment(appointmentId)
    });
  };

  const isBarberEffectivelyClosed = (barber: Barber) => {
     return barber.recurringClosedDays.length === 7 && Object.keys(barber.scheduleOverrides).length === 0 && (barber.services.length === 0 && barber.onLocationMode !== 'exclusive');
  };
  
  const isClosed = isBarberEffectivelyClosed(barber);
  
  const serviceInputClasses = "w-full p-1.5 rounded-md text-sm text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500";
  
  return (
    <div className={`bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md ${isClosed ? 'opacity-70 border-s-4 border-amber-500' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
        <div className="flex items-center mb-2 sm:mb-0">
          {barber.avatarUrl && <img src={barber.avatarUrl} alt={barber.name} className="w-10 h-10 rounded-full me-3 border-2 border-primary object-cover" />}
          <h3 className="text-lg md:text-xl font-medium text-primary flex items-center">
            {barber.name} <span className="text-sm text-neutral-500 dark:text-neutral-400 ms-2">({barber.email})</span>
          </h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onImpersonate(barber.id)}
            className="px-3 py-1.5 text-xs rounded-md flex items-center transition-colors bg-blue-500 hover:bg-blue-600 text-white"
            title={t('viewAsBarberButton')}
          >
             <EyeIcon className="w-4 h-4 me-1.5" /> {t('viewAsBarberButton')}
          </button>
          <button
            type="button"
            onClick={isEditing ? handleSave : handleEditToggle}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center transition-colors ${
              isEditing ? 'bg-secondary hover:bg-emerald-600 text-white' : 'bg-accent hover:bg-yellow-600 text-neutral-900'
            }`}
          >
            {isEditing ? <SaveIcon className="w-4 h-4 me-1.5" /> : <PencilIcon className="w-4 h-4 me-1.5" />}
            {isEditing ? t('saveButton') : t('editButton')}
          </button>
          <button type="button" onClick={handleRemoveClick} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center transition-colors">
            <TrashIcon className="w-4 h-4 me-1.5" /> {t('removeButton')}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><label className="block text-xs font-medium">{t('fullNameLabel')}</label><input type="text" value={editableBarber.name} onChange={e => handleChange('name', e.target.value)} className={serviceInputClasses} /></div>
                <div><label className="block text-xs font-medium">{t('ownerEmailLabel')}</label><input type="email" value={editableBarber.email} onChange={e => handleChange('email', e.target.value)} className={`${serviceInputClasses} bg-neutral-200 dark:bg-neutral-800`} readOnly disabled title="Email cannot be changed after creation." /></div>
            </div>
            {/* Service Management */}
            <div className="p-3 bg-neutral-200 dark:bg-neutral-700 rounded-md">
              <h4 className="font-semibold mb-2">{t('servicesManagementTitle')}</h4>
              <div className="space-y-2">
                {editableBarber.services.map((service, index) => (
                <div key={service.id} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" placeholder={t('serviceNamePlaceholder')} value={service.name} onChange={e => handleServiceChange(index, 'name', e.target.value)} className={`col-span-5 ${serviceInputClasses}`} />
                  <div className="col-span-3 relative"><span className="absolute start-2 top-1/2 -translate-y-1/2 text-gray-500">€</span><input type="number" placeholder={t('priceLabel')} value={service.price} onChange={e => handleServiceChange(index, 'price', e.target.value)} className={`w-full ps-5 ${serviceInputClasses}`} /></div>
                  <div className="col-span-3 relative"><input type="number" placeholder={t('durationLabel')} value={service.duration} onChange={e => handleServiceChange(index, 'duration', e.target.value)} className={`w-full pe-8 ${serviceInputClasses}`} /><span className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{t('minutesSuffix')}</span></div>
                  <button onClick={() => handleRemoveService(index)} className="col-span-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4 mx-auto" /></button>
                </div>
                ))}
              </div>
              <button onClick={handleAddService} className="text-sm flex items-center text-primary hover:underline mt-2"><PlusCircleIcon className="w-4 h-4 me-1"/>{t('addServiceButton')}</button>
            </div>
            {/* Schedule Management */}
            <div className="p-3 bg-neutral-200 dark:bg-neutral-700 rounded-md">
              <h4 className="font-semibold mb-2">{t('scheduleManagementTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium">{t('workStartTimeLabel')}</label><input type="time" value={editableBarber.workStartTime} onChange={e => handleChange('workStartTime', e.target.value)} className={serviceInputClasses} /></div>
                <div><label className="block text-xs font-medium">{t('workEndTimeLabel')}</label><input type="time" value={editableBarber.workEndTime} onChange={e => handleChange('workEndTime', e.target.value)} className={serviceInputClasses} /></div>
              </div>
              <div className="mt-2">
                 <div><label className="block text-xs font-medium">{t('bookableDaysInAdvanceLabel')}</label><input type="number" min="1" value={editableBarber.bookableDaysInAdvance} onChange={e => handleChange('bookableDaysInAdvance', parseInt(e.target.value))} className={serviceInputClasses} /></div>
              </div>
              <div className="mt-4">
                 <ScheduleCalendar 
                    scheduleData={{
                        recurringClosedDays: editableBarber.recurringClosedDays,
                        scheduleOverrides: editableBarber.scheduleOverrides,
                    }}
                    onScheduleChange={handleScheduleChange}
                 />
              </div>
            </div>
        </div>
      ) : (
        !viewingAppointments && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">{t('servicesOffered')}: {barber.services.map(s=>s.name).join(', ') || t('noServicesOffered')}</p>
      )}

      {viewingAppointments && !isClosed && (
        <div id={`appointments-${barber.id}`} className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-500">
          <h4 className="text-md font-semibold text-neutral-700 dark:text-neutral-200 mb-2">{t('upcomingAppointmentsFor', { name: barber.name })}:</h4>
          {barberAppointments.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto pe-2">
              {barberAppointments.map(apt => (
                <li key={apt.id} className="bg-neutral-100 dark:bg-neutral-500 p-3 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                        <p><strong>{t('dateLabel')}:</strong> {new Date(`${apt.date}T00:00:00`).toLocaleDateString(language)} @ {apt.slotTime}</p>
                        <p><strong>{t('clientLabel')}:</strong> {apt.customerName} ({apt.customerPhone})</p>
                        <p><strong>{t('appointmentServices')}:</strong> {apt.services.map(s => s.name).join(', ')} (€{apt.totalPrice})</p>
                    </div>
                    <button type="button" onClick={() => handleCancelAppointmentClick(apt.id)} className="p-1 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('noUpcomingAppointments')}</p>
          )}
        </div>
      )}
      {viewingAppointments && isClosed && (
        <p className="text-xs text-amber-500 dark:text-amber-400 mt-2">{t('barberStatusClosedNoAppointmentsView')}</p>
      )}
    </div>
  );
};

export default BarberConfigRow;