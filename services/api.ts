import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Barber, Appointment, AppConfig, Expense, Business } from '../types';
import { INITIAL_BUSINESSES } from '../constants';
import type { Database, Json } from './db_types';

export type SignUpCredentials = {
    email: string;
    password: string;
    name: string;
}

type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];
type BarberUpdate = Database['public']['Tables']['barbers']['Update'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
type AppConfigUpdate = Database['public']['Tables']['app_config']['Update'];


// For initial setup, we can seed the database if it's empty
export async function seedInitialData() {
    const { count: businessCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
    if (businessCount === 0) {
        console.log("Seeding initial businesses...");
        const { error } = await supabase.from('businesses').insert(INITIAL_BUSINESSES as BusinessInsert[]);
        if (error) console.error("Error seeding businesses:", error);
    }
    
    // Barber and appointment seeding is removed as it's now handled
    // dynamically through the app with real user accounts.
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
    return (data || []) as Business[];
}

export async function addBusiness(business: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) {
    const newBusiness: BusinessInsert = {
        ...business,
        subscriptionStatus: 'trial' as const,
        subscriptionValidUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    };
    const { error } = await supabase.from('businesses').insert([newBusiness]);
    if (error) throw error;
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
    const { error } = await supabase.from('businesses').update(updates as BusinessUpdate).eq('id', id);
    if (error) throw error;
}

export async function removeBusiness(id: string) {
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) throw error;
}

// --- Barbers API ---
export async function getBarbers(): Promise<Barber[]> {
    const { data, error } = await supabase.from('barbers').select('*');
    if (error) throw error;
    return (data || []) as Barber[];
}

export async function updateBarber(id: string, updates: Partial<Barber>) {
    const updatesForDb: BarberUpdate = {
      ...updates,
      ...(updates.services && { services: updates.services as unknown as Json }),
      ...(updates.timeOff && { timeOff: updates.timeOff as unknown as Json }),
      ...(updates.blockedSlots && { blockedSlots: updates.blockedSlots as unknown as Json }),
      ...(updates.scheduleOverrides && { scheduleOverrides: updates.scheduleOverrides as unknown as Json }),
    };
    const { error } = await supabase.from('barbers').update(updatesForDb).eq('id', id);
    if (error) throw error;
}

export async function removeBarber(id: string) {
    // This is a protected admin function. In a real production app, this would
    // be implemented in a secure Supabase Edge Function and called via RPC.
    // Exposing admin functions on the client is a security risk.
    console.warn("Attempting to delete user from client-side. This requires a service_role key and is insecure in production.");
    const { data, error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
        console.error("Failed to delete auth user:", error);
        throw error;
    }
    // The database entry in 'public.barbers' should be deleted automatically
    // by the `ON DELETE CASCADE` constraint in the table definition.
    return data;
}

// --- Appointments API ---
export async function getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) throw error;
    return (data || []) as Appointment[];
}

export async function addAppointment(appointment: Omit<Appointment, 'id'>) {
    const appointmentForDb: AppointmentInsert = {
        ...appointment,
        services: appointment.services as unknown as Json,
    };
    const { error } = await supabase.from('appointments').insert([appointmentForDb]);
    if (error) throw error;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
    const updatesForDb: AppointmentUpdate = {
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
    const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single();
    if (error) {
        console.warn("Could not fetch app_config, using default. Error:", error.message);
        return {
            id: 1,
            appName: 'MReserv',
            showServicesOnSelector: false,
            allowBarberLanguageControl: false,
            defaultSubscriptionPrice: 40,
            contactEmail: '',
            enableWaitlist: false,
            enableWalkinBuffer: false,
            enableCancellationFee: false,
        };
    }
    return data as AppConfig;
}

export async function updateAppConfig(updates: Partial<AppConfig>) {
    const { error } = await supabase.from('app_config').update(updates as AppConfigUpdate).eq('id', 1);
    if (error) throw error;
}

// --- Expenses API ---
export async function getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) throw error;
    return data || [];
}

export async function addExpense(expense: Omit<Expense, 'id' | 'dateAdded'>) {
    const expenseToAdd: ExpenseInsert = {
        ...expense,
        dateAdded: new Date().toISOString().split('T')[0],
    };
    const { error } = await supabase.from('expenses').insert([expenseToAdd]);
    if (error) throw error;
}

export async function removeExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
}