
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';
import { 
    Barber, 
    Appointment, 
    AppConfig, 
    Expense, 
    Business, 
    BlockedCustomer, 
    CustomerReport,
    ReportStatus,
    BusinessUpdate,
    BusinessInsert,
    BarberUpdate,
    BarberInsert,
    AppointmentInsert,
    AppointmentUpdate,
    AppConfigUpdate,
    ExpenseInsert,
    CustomerReportInsert
} from '../types';
import type { Database, Json } from './db_types';

export type SignUpCredentials = {
    email: string;
    password: string;
    name: string;
}

// --- Auth API ---
export async function signIn(email: string, passwordAttempt: string) {
    return supabase.auth.signInWithPassword({ email: email, password: passwordAttempt });
}

export async function signUp(credentials: SignUpCredentials) {
    // The user's name is passed in the 'data' option, which is available
    // in the database trigger as `new.raw_user_meta_data`.
    return supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
            data: {
                name: credentials.name
            }
        }
    });
}

export async function signOut() {
    return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

export async function getUser() {
    return supabase.auth.getUser();
}

export async function updateUserPassword(newPassword: string) {
    return supabase.auth.updateUser({ password: newPassword });
}

export async function getBarberProfile(userId: string) {
    const { data, error } = await supabase.from('barbers').select('*').eq('id', userId).single();
    
    return {
        data: data as Barber | null,
        error: error
    };
}


// --- Businesses API ---
export async function getBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase.from('businesses').select('*');
    if (error) throw error;
    return (data || []) as unknown as Business[];
}

export async function addBusiness(business: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) {
    const businessToAdd: BusinessInsert = {
        ...business,
        // Add required fields for a new business subscription.
        subscriptionStatus: 'trial' as const,
        subscriptionValidUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    };

    const { error } = await supabase.from('businesses').insert([businessToAdd]);
    if (error) throw error;
}

export async function updateBusiness(id: string, updates: BusinessUpdate) {
    const { error } = await supabase.from('businesses').update(updates).eq('id', id);
    if (error) {
        console.error("Supabase updateBusiness error:", error);
        throw error;
    }
}

export async function removeBusiness(id: string) {
    // This should ideally be an RPC call to handle cascading deletes securely.
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) throw error;
}


// --- Barbers API ---
export async function getBarbers(): Promise<Barber[]> {
    const { data, error } = await supabase.from('barbers').select('*');
    if (error) throw error;
    return (data || []) as unknown as Barber[];
}

/**
 * Step 1: Creates only the authentication user in Supabase Auth.
 * This is the first part of the robust two-step barber creation process.
 */
export async function createBarberAuthUser(credentials: SignUpCredentials) {
    return supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
            data: {
                name: credentials.name,
                role: 'barber'
            }
        }
    });
}

/**
 * Step 2: Creates the public profile for a new barber, providing all necessary default values.
 * This function is called after `createBarberAuthUser` is successful.
 */
export async function addBarberProfile(userId: string, email: string, name: string, businessId: string) {
    if (!businessId) {
        // This provides a clear, application-level error before hitting the database.
        const errorMessage = "CRITICAL: Attempted to create a barber profile without a businessId. This should not happen.";
        console.error(errorMessage, { userId, email, name });
        throw new Error(errorMessage);
    }
    
    const newBarberProfile: BarberInsert = {
        id: userId,
        email: email,
        name: name,
        businessId: businessId,
        workStartTime: '09:00',
        workEndTime: '17:00',
        recurringClosedDays: [0, 6], // Default to Sat/Sun closed
        onLocationDays: [],
        onLocationMode: 'none',
        bookableDaysInAdvance: 30,
        enableWaitlist: true,
        enableWalkinBuffer: true,
        walkinBufferMinutes: 30,
        services: [],
        timeOff: [],
        blockedSlots: [],
        scheduleOverrides: {},
        showPricesOnBooking: true,
        showServicesOnSelector: true,
        allowedLanguages: null,
        avatarUrl: null,
        daily_location_overrides: null,
        phoneNumber: null,
        preferredLanguage: 'nl',
    };
    
    // Cast complex object fields to Json for Supabase.
    const profileForDb = {
        ...newBarberProfile,
        services: newBarberProfile.services as unknown as Json,
        timeOff: newBarberProfile.timeOff as unknown as Json,
        blockedSlots: newBarberProfile.blockedSlots as unknown as Json,
        scheduleOverrides: newBarberProfile.scheduleOverrides as unknown as Json,
        daily_location_overrides: newBarberProfile.daily_location_overrides as unknown as Json,
    };

    return supabase.from('barbers').insert([profileForDb]);
}

export async function updateBarber(id: string, updates: BarberUpdate) {
    // Cast any complex object fields to Json before sending to Supabase.
    const updatesForDb = {
        ...updates,
        ...(updates.services && { services: updates.services as unknown as Json }),
        ...(updates.blockedSlots && { blockedSlots: updates.blockedSlots as unknown as Json }),
        ...(updates.scheduleOverrides && { scheduleOverrides: updates.scheduleOverrides as unknown as Json }),
        ...(updates.timeOff && { timeOff: updates.timeOff as unknown as Json }),
        ...(updates.daily_location_overrides && { daily_location_overrides: updates.daily_location_overrides as unknown as Json }),
    };

    const { error } = await supabase.from('barbers').update(updatesForDb).eq('id', id);
    if (error) throw error;
}

export async function removeBarber(id: string) {
    // Uses an RPC call to a backend function that securely deletes the auth user and their profile.
    return supabase.rpc('delete_barber_user', { user_id_to_delete: id });
}


// --- Appointments API ---
export async function getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) throw error;
    return (data || []) as unknown as Appointment[];
}

export async function addAppointment(appointment: AppointmentInsert) {
    // Cast the services array to Json for Supabase.
    const appointmentForDb = {
        ...appointment,
        services: appointment.services as unknown as Json,
    };
    const { error } = await supabase.from('appointments').insert([appointmentForDb]);
    if (error) throw error;
}

export async function updateAppointment(id: string, updates: AppointmentUpdate) {
     // Cast the services array to Json if it's being updated.
    const updatesForDb = {
        ...updates,
        ...(updates.services && { services: updates.services as unknown as Json }),
    };
    const { error } = await supabase.from('appointments').update(updatesForDb).eq('id', id);
    if (error) throw error;
}

export async function removeAppointment(id: string) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
}

export async function removeAppointmentsForBarber(barberId: string) {
    const { error } = await supabase.from('appointments').delete().eq('barberId', barberId);
    if (error) throw error;
}


// --- AppConfig API ---
export async function getAppConfig(): Promise<AppConfig> {
    const { data, error } = await supabase.from('app_config').select('*').single();
    if (error) throw error;
    return data as unknown as AppConfig;
}

export async function updateAppConfig(newConfig: AppConfigUpdate) {
    const { error } = await supabase.from('app_config').update(newConfig).eq('id', 1); // Assuming config ID is always 1
    if (error) throw error;
}


// --- Expenses API ---
export async function getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*').order('dateAdded', { ascending: false });
    if (error) throw error;
    return (data || []) as Expense[];
}

export async function addExpense(expense: ExpenseInsert) {
    const { error } = await supabase.from('expenses').insert([expense]);
    if (error) throw error;
}

export async function removeExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
}

// --- No-Show & Blocking API ---
export async function isCustomerBlocked(phone: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('blocked_customers')
        .select('is_blocked')
        .eq('customer_phone', phone)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if not found
        console.error("isCustomerBlocked error:", error);
        return false;
    }
    return data?.is_blocked || false;
}

export async function handleNoShowCheck(customerPhone: string, blockLimit: number) {
    // This is a client-side call to a backend function for security and data integrity.
    const { error } = await supabase.rpc('handle_no_show', {
        p_customer_phone: customerPhone,
        p_block_limit: blockLimit,
    });
    if (error) {
        console.error('Error handling no-show check:', error);
        throw error;
    }
}

export async function getBlockedCustomers(): Promise<BlockedCustomer[]> {
    const { data, error } = await supabase.from('blocked_customers').select('*').order('blocked_at', { ascending: false });
    if (error) throw error;
    return (data || []) as BlockedCustomer[];
}

export async function unblockCustomer(phone: string) {
    const { error } = await supabase.from('blocked_customers').update({ is_blocked: false }).eq('customer_phone', phone);
    if (error) throw error;
}

// --- Customer Reports API ---
export async function getCustomerReports(): Promise<CustomerReport[]> {
    const { data, error } = await supabase.from('customer_reports').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as CustomerReport[];
}

export async function addCustomerReport(report: CustomerReportInsert) {
    const { error } = await supabase.from('customer_reports').insert([report]);
    if (error) throw error;
}

export async function updateCustomerReportStatus(id: string, status: ReportStatus) {
    const { error } = await supabase.from('customer_reports').update({ status }).eq('id', id);
    if (error) throw error;
}


// --- Logo Management API ---
export async function uploadBusinessLogo(businessId: string, file: File): Promise<string> {
    const filePath = `${businessId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('business-logos').upload(filePath, file);

    if (uploadError) {
        console.error("Error uploading logo:", uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage.from('business-logos').getPublicUrl(filePath);
    return data.publicUrl;
}

export async function removeBusinessLogo(businessId: string) {
    // This function assumes the business object has the full URL. We need to extract the path.
    // Ideally, this is handled in an Edge Function for security.
    const { data: list, error: listError } = await supabase.storage.from('business-logos').list(businessId);
    if (listError) {
        console.error("Error listing logo files:", listError);
        throw listError;
    }
    if (list && list.length > 0) {
        const filesToRemove = list.map(file => `${businessId}/${file.name}`);
        const { error: removeError } = await supabase.storage.from('business-logos').remove(filesToRemove);
        if (removeError) {
            console.error("Error removing logo:", removeError);
            throw removeError;
        }
    }
}