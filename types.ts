import type { Language } from './translations';

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

export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: 'monthly' | 'yearly' | 'one-time';
  dateAdded: string; // YYYY-MM-DD
}

export type ThemeName = 'default' | 'oceanic' | 'sunset';

export interface Business {
  id: string;
  name: string;
  ownerName?: string;
  ownerEmail?: string;
  address?: string;
  theme?: ThemeName;
  // Subscription fields moved from Barber
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'cancelled';
  subscriptionValidUntil: string; // YYYY-MM-DD
  customSubscriptionPrice?: number; // Optional custom price for this business
  suppressGracePeriodWarning?: boolean; // Optional flag to disable warnings
}

export interface Barber {
  id: string;
  name: string;
  username: string;
  password?: string;
  workStartTime: string; // HH:mm format
  workEndTime: string;   // HH:mm format
  avatarUrl?: string;
  phoneNumber?: string;
  businessId: string; // Link to a Business
  preferredLanguage?: Language;
  allowedLanguages?: Language[];
  
  // New granular scheduling as per user spec
  /** 0 = Sunday, 1 = Monday, … 6 = Saturday */
  recurringClosedDays: number[];              // weekdays that are always closed
  scheduleOverrides: Record<string, { closed: boolean }>; // 'YYYY-MM-DD' → { closed: boolean }
  timeOff: TimeOff[];
  
  bookableDaysInAdvance: number; // How many days in the future a customer can book

  // Service management
  services: Service[];
  showPricesOnBooking?: boolean; // Controls if prices are shown to customers
  showServicesOnSelector?: boolean; // New: Barber-level control for service visibility

  // On-location settings
  onLocationMode: 'none' | 'optional' | 'exclusive'; // 'none', 'optional' (both), or 'exclusive' (only on-location)
  onLocationDays: number[]; // Specific days for on-location services if not always available
}

export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: string;
  barberId: string;
  businessId: string; // Link to a Business
  date: string; // YYYY-MM-DD format
  slotTime: string; // HH:mm format, start time of the slot
  customerName: string;
  customerPhone: string;
  
  // New service-based details
  services: Service[];
  totalDuration: number; // in minutes
  totalPrice: number;
  status: AppointmentStatus;
}

export interface TimeSlotDisplayInfo {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  isBooked: boolean;
  isPast: boolean;
}

export interface AppConfig {
  appName: string;
  showServicesOnSelector: boolean;
  allowBarberLanguageControl: boolean;
  defaultSubscriptionPrice: number;
  contactEmail?: string;
}