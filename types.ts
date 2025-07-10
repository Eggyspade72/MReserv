import type { Language } from './translations';
import type { Database } from './services/db_types';

// Get Row types from generated db types
type BusinessRow = Database['public']['Tables']['businesses']['Row'];
type BarberRow = Database['public']['Tables']['barbers']['Row'];
type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type AppConfigRow = Database['public']['Tables']['app_config']['Row'];


// These are custom types for the app, not directly from DB schema
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

export interface TimeOff {
    id:string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason?: string;
}

export interface BlockedSlot {
    id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    duration: number; // in minutes
}

export type ThemeName = 'default' | 'oceanic' | 'sunset';

// Main application types, extending DB row types and overriding where needed
export interface Business extends BusinessRow {
  theme: ThemeName | null;
}

// Use Omit to handle the Json type mismatch between db and app.
export interface Barber extends Omit<BarberRow, 'services' | 'timeOff' | 'blockedSlots' | 'scheduleOverrides'> {
  services: Service[];
  timeOff: TimeOff[];
  scheduleOverrides: Record<string, { closed: boolean }>;
  blockedSlots: BlockedSlot[];
  preferredLanguage: Language | null;
  allowedLanguages: Language[] | null;
  showHelpTooltips: boolean;
}

// Use Omit to handle the Json type mismatch between db and app.
export interface Appointment extends Omit<AppointmentRow, 'services'> {
  services: Service[];
}

export interface Expense extends ExpenseRow {}

export interface AppConfig extends AppConfigRow {}


// Other types used in the UI
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no-show';

export interface TimeSlotDisplayInfo {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  isBooked: boolean;
  isPast: boolean;
  isWalkinOnly: boolean;
}