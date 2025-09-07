import type { Database, Json } from './services/db_types';

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


// --- Application-level types derived from DB schema for type safety ---

// Base 'Row' types from the DB. These are the source of truth for data shape.
type DbBusinessRow = Database['public']['Tables']['businesses']['Row'];
type DbBarberRow = Database['public']['Tables']['barbers']['Row'];
type DbAppointmentRow = Database['public']['Tables']['appointments']['Row'];
type DbExpenseRow = Database['public']['Tables']['expenses']['Row'];
type DbAppConfigRow = Database['public']['Tables']['app_config']['Row'];
type DbBlockedCustomerRow = Database['public']['Tables']['blocked_customers']['Row'];
type DbCustomerReportRow = Database['public']['Tables']['customer_reports']['Row'];


export type Business = DbBusinessRow;

// For Barber and Appointment, we define a "friendly" type for use in the app,
// converting JSON fields to specific object types. The raw DB types use `Json`.
export type Barber = Omit<DbBarberRow, 'services' | 'blockedSlots' | 'scheduleOverrides' | 'timeOff' | 'dailyLocationOverrides'> & {
    services: Service[];
    blockedSlots: BlockedSlot[];
    scheduleOverrides: Record<string, { closed: boolean }>;
    timeOff: TimeOff[];
    dailyLocationOverrides: Record<string, 'in-shop-exclusive' | 'on-location-exclusive'> | null;
};

export type Appointment = Omit<DbAppointmentRow, 'services'> & {
    services: Service[];
};

export type Expense = DbExpenseRow;
export type AppConfig = DbAppConfigRow;
export type BlockedCustomer = DbBlockedCustomerRow;
export type CustomerReport = DbCustomerReportRow;

// --- DB `Insert` and `Update` types for use within the application's API layer ---
// These are direct aliases to the DB types to ensure compatibility.

// Business types
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

// Barber types
export type BarberInsert = Database['public']['Tables']['barbers']['Insert'];
export type BarberUpdate = Database['public']['Tables']['barbers']['Update'];

// Appointment types
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

// Other types
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

// Re-export Json for use in other parts of the app for casting
export type { Json };