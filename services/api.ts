


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
    CustomerReportInsert,
    Service,
    BlockedSlot,
    TimeOff
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

export async function getBarberProfile(userId: string): Promise<{ data: Barber | null; error: any }> {
    const { data: dbData, error } = await supabase.from('barbers').select('*').eq('id', userId).single();
    if (error || !dbData) {
        return { data: null, error: error };
    }

    // Safely transform the raw DB data to the application-level type
    // @ts-ignore
    const { services, blockedSlots, scheduleOverrides, timeOff, dailyLocationOverrides, ...rest } = dbData as Database['public']['Tables']['barbers']['Row'];
    const profile: Barber = {
        ...rest,
        services: (services as unknown as Service[]) || [],
        blockedSlots: (blockedSlots as unknown as BlockedSlot[]) || [],
        scheduleOverrides: (scheduleOverrides as Record<string, { closed: boolean }>) || {},
        timeOff: (timeOff as unknown as TimeOff[]) || [],
        dailyLocationOverrides: (dailyLocationOverrides as Record<string, 'in-shop-exclusive' | 'on-location-exclusive'> | null) || null,
    };

    return { data: profile, error: null };
}


// --- Businesses API ---
export async function getBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase.from('businesses').select('*');
    if (error) throw error;
    return data || [];
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

// Replaced client-side cascade with a secure RPC call for robustness.
// A corresponding function `delete_business_and_dependents` must be created in the Supabase SQL editor.
export async function removeBusiness(id: string) {
    const { error } = await supabase.rpc('delete_business_and_dependents', { business_id_to_delete: id });
    if (error) {
        console.error("Failed to delete the business via RPC:", error);
        throw error;
    }
}


// --- Barbers API ---
export async function getBarbers(): Promise<Barber[]> {
    const { data: dbData, error } = await supabase.from('barbers').select('*');
    if (error) throw error;
    if (!dbData) return [];
    
    // Safely transform the raw DB data to the application-level Barber type
    return dbData.map(dbBarber => {
        // @ts-ignore
        const { services, blockedSlots, scheduleOverrides, timeOff, dailyLocationOverrides, ...rest } = dbBarber as Database['public']['Tables']['barbers']['Row'];
        return {
            ...rest,
            services: (services as unknown as Service[]) || [],
            blockedSlots: (blockedSlots as unknown as BlockedSlot[]) || [],
            scheduleOverrides: (scheduleOverrides as Record<string, { closed: boolean }>) || {},
            timeOff: (timeOff as unknown as TimeOff[]) || [],
            dailyLocationOverrides: (dailyLocationOverrides as Record<string, 'in-shop-exclusive' | 'on-location-exclusive'> | null) || null,
        };
    });
}

/**
 * Creates a new barber. This single call creates the auth user and relies on a
 * backend trigger to create the public profile. The businessId is passed in
 * the user metadata for the trigger to use.
 */
export async function createBarber(credentials: SignUpCredentials, businessId: string) {
    return supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
            data: {
                name: credentials.name,
                role: 'barber',
                businessId: businessId, // Corrected key to camelCase for the backend trigger
            }
        }
    });
}


export async function updateBarber(id: string, updates: BarberUpdate) {
    // The 'updates' object should already conform to the DB schema,
    // as BarberUpdate is now a direct alias for the DB update type.
    const { error } = await supabase.from('barbers').update(updates).eq('id', id);
    if (error) throw error;
}

export async function removeBarber(id: string) {
    // Uses an RPC call to a backend function that securely deletes the auth user and their profile.
    return supabase.rpc('delete_barber_user', { user_id_to_delete: id });
}


// --- Appointments API ---
export async function getAppointments(): Promise<Appointment[]> {
    const { data: dbData, error } = await supabase.from('appointments').select('*');
    if (error) throw error;
    if (!dbData) return [];

    // Safely transform the `services` JSON column
    return dbData.map(dbApt => {
        const { services, ...rest } = dbApt as Database['public']['Tables']['appointments']['Row'];
        return {
            ...rest,
            services: (services as unknown as Service[]) || [],
        };
    });
}

export async function addAppointment(appointment: AppointmentInsert) {
    const { error } = await supabase.from('appointments').insert([appointment]);
    if (error) throw error;
}

export async function updateAppointment(id: string, updates: AppointmentUpdate) {
    const { error } = await supabase.from('appointments').update(updates).eq('id', id);
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
    // Assuming a single config row, so direct return is safe after a successful fetch.
    return data as AppConfig;
}

export async function updateAppConfig(newConfig: AppConfigUpdate) {
    const { error } = await supabase.from('app_config').update(newConfig).eq('id', 1); // Assuming config ID is always 1
    if (error) throw error;
}


// --- Expenses API ---
export async function getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*').order('dateAdded', { ascending: false });
    if (error) throw error;
    return data || [];
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
        .select('isBlocked')
        .eq('customerPhone', phone)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if not found
        console.error("isCustomerBlocked error:", error);
        return false;
    }
    // @ts-ignore
    return data ? data.isBlocked : false;
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
    const { data, error } = await supabase.from('blocked_customers').select('*').order('blockedAt', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function unblockCustomer(phone: string) {
    const updates: Database['public']['Tables']['blocked_customers']['Update'] = { isBlocked: false };
    const { error } = await supabase.from('blocked_customers').update(updates).eq('customerPhone', phone);
    if (error) throw error;
}

// --- Customer Reports API ---
export async function getCustomerReports(): Promise<CustomerReport[]> {
    const { data, error } = await supabase.from('customer_reports').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function addCustomerReport(report: CustomerReportInsert) {
    const { error } = await supabase.from('customer_reports').insert([report]);
    if (error) throw error;
}

export async function updateCustomerReportStatus(id: string, status: ReportStatus) {
    const updates: Database['public']['Tables']['customer_reports']['Update'] = { status };
    const { error } = await supabase.from('customer_reports').update(updates).eq('id', id);
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