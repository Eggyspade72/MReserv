
import type { Barber, Business } from './types';
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from './constants';

/**
 * Checks if a barber is effectively closed to new bookings.
 * This considers their schedule, overrides, and the subscription status of their associated business.
 * @param barber The barber object.
 * @param business The business object for the barber.
 * @returns True if the barber should be considered closed, false otherwise.
 */
export const isBarberEffectivelyClosed = (barber: Barber, business: Business | undefined): boolean => {
    // Case 1: Closed due to their own schedule configuration.
    // This happens if they have no working days, no exceptions, and aren't available for on-location bookings.
    const isClosedBySchedule = barber.recurringClosedDays.length === 7 && 
                               Object.keys(barber.scheduleOverrides).length === 0 && 
                               (barber.services.length === 0 && barber.onLocationMode !== 'exclusive');

    // Case 2: Closed due to business-level issues (e.g., subscription).
    if (!business) {
        return true; // A barber cannot operate without being associated with a business.
    }

    const now = new Date();
    const validUntilDate = new Date(business.subscriptionValidUntil);
    const gracePeriodEndDate = new Date(new Date(business.subscriptionValidUntil).setDate(validUntilDate.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS));
    
    // The business subscription is considered invalid if it's 'cancelled', or if it's 'past_due' and the grace period has ended.
    const isClosedBySubscription = business.subscriptionStatus === 'cancelled' || 
                                   (business.subscriptionStatus === 'past_due' && now > gracePeriodEndDate);

    return isClosedBySchedule || isClosedBySubscription;
};