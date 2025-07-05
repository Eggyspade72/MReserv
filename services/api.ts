import { supabase } from './supabase';
import { Barber, Appointment, AppConfig, Expense, Business } from '../types';
import { INITIAL_BUSINESSES, INITIAL_BARBERS, MOCK_APPOINTMENTS } from '../constants';

// For initial setup, we can seed the database if it's empty
export async function seedInitialData() {
    const { count: businessCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
    if (businessCount === 0) {
        console.log("Seeding initial businesses...");
        const { error } = await supabase.from('businesses').insert(INITIAL_BUSINESSES);
        if (error) console.error("Error seeding businesses:", error);
    }

    const { count: barberCount } = await supabase.from('barbers').select('*', { count: 'exact', head: true });
    if (barberCount === 0) {
        console.log("Seeding initial barbers...");
        const { error } = await supabase.from('barbers').insert(INITIAL_BARBERS.map(({ password, ...rest}) => rest)); // Don't insert dev password
        if (error) console.error("Error seeding barbers:", error);
    }
    
    const { count: appointmentCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
    if (appointmentCount === 0) {
        console.log("Seeding mock appointments...");
        const { error } = await supabase.from('appointments').insert(MOCK_APPOINTMENTS as any); // Cast to any because Service[] is not directly assignable to Json
        if (error) console.error("Error seeding appointments:", error);
    }
}

// --- Businesses API ---
export async function getBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase.from('businesses').select('*');
    if (error) throw error;
    return data || [];
}

export async function addBusiness(business: Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil'>) {
    const newBusiness: Omit<Business, 'id'> = {
        ...business,
        subscriptionStatus: 'trial',
        subscriptionValidUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    };
    const { error } = await supabase.from('businesses').insert([newBusiness]);
    if (error) throw error;
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
    const { error } = await supabase.from('businesses').update(updates).eq('id', id);
    if (error) throw error;
}

export async function removeBusiness(id: string) {
    // This would be a cascading delete in a real DB, or handled by backend logic.
    // For now, we delete related items manually.
    const { error: barberError } = await supabase.from('barbers').delete().eq('businessId', id);
    if (barberError) throw barberError;
    const { error: appointmentError } = await supabase.from('appointments').delete().eq('businessId', id);
    if (appointmentError) throw appointmentError;
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) throw error;
}

// --- Barbers API ---
export async function getBarbers(): Promise<Barber[]> {
    const { data, error } = await supabase.from('barbers').select('*');
    if (error) throw error;
    return (data as Barber[]) || [];
}

export async function addBarber(barber: Omit<Barber, 'id'>) {
    const { password, ...barberToInsert } = barber; // Never store plain text password
    const { error } = await supabase.from('barbers').insert([barberToInsert as any]); // Cast to any because of complex Json types
    if (error) throw error;
}

export async function updateBarber(id: string, updates: Partial<Barber>) {
    const { password, ...updatesToApply } = updates; // Don't update password this way
    const { error } = await supabase.from('barbers').update(updatesToApply as any).eq('id', id); // Cast to any because of complex Json types
    if (error) throw error;
}

export async function removeBarber(id: string) {
    const { error } = await supabase.from('barbers').delete().eq('id', id);
    if (error) throw error;
}

export async function getBarberByCredentials(username: string, passwordAttempt: string) {
    // THIS IS INSECURE. For demonstration only. A real app would use Supabase Auth.
    const { data, error } = await supabase
        .from('barbers_with_passwords') // Assumes a separate, secure view/table
        .select('*')
        .eq('username', username)
        .eq('password', passwordAttempt)
        .single();
    return { data: data as Barber | null, error };
}


// --- Appointments API ---
export async function getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) throw error;
    return (data as Appointment[]) || [];
}

export async function addAppointment(appointment: Omit<Appointment, 'id'>) {
    const { error } = await supabase.from('appointments').insert([appointment as any]); // Cast to any because Service[] is not directly assignable to Json
    if (error) throw error;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>) {
    const { error } = await supabase.from('appointments').update(updates as any).eq('id', id); // Cast to any because Service[] is not directly assignable to Json
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
// Using a table 'app_config' with a single row (id=1) is a common pattern for this.
export async function getAppConfig(): Promise<AppConfig> {
    const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single();
    if (error) {
        console.warn("Could not fetch app_config, using default. Error:", error.message);
        return {
            appName: 'MReserv',
            showServicesOnSelector: false,
            allowBarberLanguageControl: false,
            defaultSubscriptionPrice: 40,
            contactEmail: '',
        };
    }
    return data;
}

export async function updateAppConfig(updates: AppConfig) {
    const { error } = await supabase.from('app_config').update(updates).eq('id', 1);
    if (error) throw error;
}

// --- Expenses API ---
export async function getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) throw error;
    return data || [];
}

export async function addExpense(expense: Omit<Expense, 'id' | 'dateAdded'>) {
    const expenseToAdd = {
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
