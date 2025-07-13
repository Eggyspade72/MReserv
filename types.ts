
import type { Database, Service, TimeOff, BlockedSlot } from './services/db_types';

// The re-export for these types is needed since they are used standalone in other components.
export type { Service, TimeOff, BlockedSlot };


// --- Application-level types derived from DB schema for type safety ---

// Base 'Row' types from the DB. These are the source of truth for data shape.
export type Business = Database['public']['Tables']['businesses']['Row'];

// For Barber and Appointment, we define a "friendly" type for use in the app,
// converting JSON fields to specific object types. The raw DB types use `Json`.
type DbBarberRow = Database['public']['Tables']['barbers']['Row'];
export type Barber = Omit<DbBarberRow, 'services' | 'blockedSlots' | 'scheduleOverrides' | 'timeOff' | 'daily_location_overrides'> & {
    services: Service[];
    blockedSlots: BlockedSlot[];
    scheduleOverrides: Record<string, { closed: boolean }>;
    timeOff: TimeOff[];
    daily_location_overrides: Record<string, 'in-shop-exclusive' | 'on-location-exclusive'> | null;
}

type DbAppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type Appointment = Omit<DbAppointmentRow, 'services'> & {
    services: Service[];
}

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type AppConfig = Database['public']['Tables']['app_config']['Row'];
export type BlockedCustomer = Database['public']['Tables']['blocked_customers']['Row'];
export type CustomerReport = Database['public']['Tables']['customer_reports']['Row'];

// --- Friendlier `Insert` and `Update` types for use within the application ---

// Business types (no JSONB columns, so they can be used directly)
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

// Barber types (redefined to use specific object/array types instead of generic Json)
type DbBarberInsert = Database['public']['Tables']['barbers']['Insert'];
export type BarberInsert = Omit<DbBarberInsert, 'services' | 'blockedSlots' | 'scheduleOverrides' | 'timeOff' | 'daily_location_overrides'> & {
    services: Service[];
    blockedSlots: BlockedSlot[];
    scheduleOverrides: Record<string, { closed: boolean }>;
    timeOff: TimeOff[];
    daily_location_overrides: Record<string, 'in-shop-exclusive' | 'on-location-exclusive'> | null;
}

type DbBarberUpdate = Database['public']['Tables']['barbers']['Update'];
export type BarberUpdate = Omit<DbBarberUpdate, 'services' | 'blockedSlots' | 'scheduleOverrides' | 'timeOff' | 'daily_location_overrides'> & {
    services?: Service[];
    blockedSlots?: BlockedSlot[];
    scheduleOverrides?: Record<string, { closed: boolean }>;
    timeOff?: TimeOff[];
    daily_location_overrides?: Record<string, 'in-shop-exclusive' | 'on-location-exclusive'> | null;
}

// Appointment types (redefined for `services`)
type DbAppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentInsert = Omit<DbAppointmentInsert, 'services'> & {
    services: Service[];
}

type DbAppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
export type AppointmentUpdate = Omit<DbAppointmentUpdate, 'services'> & {
    services?: Service[];
}

// Other types (no JSONB columns)
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
export type AppConfigUpdate = Database['public']['Tables']['app_config']['Update'];
export type BlockedCustomerInsert = Database['public']['Tables']['blocked_customers']['Insert'];
export type BlockedCustomerUpdate = Database['public']['Tables']['blocked_customers']['Update'];
export type CustomerReportInsert = Database['public']['Tables']['customer_reports']['Insert'];
export type CustomerReportUpdate = Database['public']['Tables']['customer_reports']['Update'];


// Derived enums/unions from schema
export type AppointmentStatus = Database['public']['Tables']['appointments']['Row']['status'];
export type ReportStatus = Database['public']['Tables']['customer_reports']['Row']['status'];


// Custom UI-specific types that are not in the database schema.
export type ThemeName = 'default' | 'oceanic' | 'sunset';

export interface TimeSlotDisplayInfo {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  isBooked: boolean;
  isPast: boolean;
  isWalkinOnly: boolean;
}

export type TopLevelTab = 'businesses' | 'financials' | 'expenses' | 'settings' | 'reports' | 'blockedCustomers';
