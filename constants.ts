import { Business } from './types';

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const subscriptionValidUntil = futureDate.toISOString().split('T')[0];

export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 7;

export const MONTHLY_SUBSCRIPTION_PRICE = 40;

export const INITIAL_BUSINESSES: Business[] = [
    {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Prime Cuts',
        ownerName: 'Chris Cuts',
        ownerEmail: 'chris@primecuts.com',
        address: '123 Razor Rd, Styleburg, 12345',
        theme: 'default',
        subscriptionStatus: 'active',
        subscriptionValidUntil: subscriptionValidUntil,
        customSubscriptionPrice: 50,
        suppressGracePeriodWarning: false,
        enableCancellationFee: false,
        cancellationFeeHours: 24,
        cancellationFeeAmount: 15,
    }
];

// NOTE: INITIAL_BARBERS and MOCK_APPOINTMENTS have been removed.
// With the move to Supabase Auth, barbers are now created as real users
// via the Super Admin panel. Appointments are created by customers.
// This makes static mock data for them obsolete.