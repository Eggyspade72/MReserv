import { Barber, Appointment, Business } from './types';

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const subscriptionValidUntil = futureDate.toISOString().split('T')[0];

export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 7;

export const MONTHLY_SUBSCRIPTION_PRICE = 40;

export const INITIAL_BUSINESSES: Business[] = [
    {
        id: 'biz_1',
        name: 'Prime Cuts',
        ownerName: 'Chris Cuts',
        ownerEmail: 'chris@primecuts.com',
        address: '123 Razor Rd, Styleburg, 12345',
        theme: 'default',
        subscriptionStatus: 'active',
        subscriptionValidUntil: subscriptionValidUntil,
        customSubscriptionPrice: 50,
        suppressGracePeriodWarning: false,
    }
];

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'barber_1',
    name: 'Chris Cuts',
    username: 'chrisc',
    password: 'password123', // Dev only
    businessId: 'biz_1',
    workStartTime: '09:00',
    workEndTime: '17:00',
    avatarUrl: 'https://picsum.photos/seed/chris/200/200',
    phoneNumber: '555-0101',
    recurringClosedDays: [0, 6], // Sunday, Saturday closed
    scheduleOverrides: {},
    bookableDaysInAdvance: 30,
    timeOff: [],
    services: [
        { id: 's1-1', name: 'Haircut', price: 30, duration: 30 },
        { id: 's1-2', name: 'Beard Trim', price: 15, duration: 15 },
        { id: 's1-3', name: 'Haircut & Beard', price: 40, duration: 45 },
        { id: 's1-4', name: 'Hair Styling', price: 25, duration: 30 },
    ],
    showPricesOnBooking: true,
    showServicesOnSelector: false,
    onLocationMode: 'optional',
    onLocationDays: [6], // Saturday for on-location
    preferredLanguage: 'en',
    allowedLanguages: ['en', 'nl', 'fr', 'es', 'ar'],
  },
  {
    id: 'barber_2',
    name: 'Sam Styles',
    username: 'sams',
    password: 'password456', // Dev only
    businessId: 'biz_1',
    workStartTime: '10:00',
    workEndTime: '18:30',
    avatarUrl: 'https://picsum.photos/seed/sam/200/200',
    phoneNumber: '555-0102',
    recurringClosedDays: [0], // Sunday closed
    scheduleOverrides: {},
    bookableDaysInAdvance: 14,
    timeOff: [],
    services: [
        { id: 's2-1', name: 'Men\'s Cut', price: 25, duration: 30 },
        { id: 's2-2', name: 'Fade', price: 35, duration: 45 },
        { id: 's2-3', name: 'Styling', price: 20, duration: 30 },
    ],
    showPricesOnBooking: true,
    showServicesOnSelector: false,
    onLocationMode: 'none',
    onLocationDays: [],
    preferredLanguage: 'nl',
    allowedLanguages: ['en', 'nl', 'fr', 'es', 'ar'],
  },
];

const getDate = (daysAgo: number = 0, date = new Date()) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - daysAgo);
    return newDate;
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const chrisServices = {
    haircut: { id: 's1-1', name: 'Haircut', price: 30, duration: 30 },
    beardTrim: { id: 's1-2', name: 'Beard Trim', price: 15, duration: 15 },
    haircutAndBeard: { id: 's1-3', name: 'Haircut & Beard', price: 40, duration: 45 },
    hairStyling: { id: 's1-4', name: 'Hair Styling', price: 25, duration: 30 },
};

const samServices = {
    mensCut: { id: 's2-1', name: 'Men\'s Cut', price: 25, duration: 30 },
    fade: { id: 's2-2', name: 'Fade', price: 35, duration: 45 },
    styling: { id: 's2-3', name: 'Styling', price: 20, duration: 30 },
};

export const MOCK_APPOINTMENTS: Appointment[] = [
    // Today's Appointments
    { id: 'apt_1', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(0)), slotTime: '10:00', customerName: 'Alice', customerPhone: '0470000001', services: [chrisServices.haircut], totalDuration: 30, totalPrice: 30, status: 'completed' },
    { id: 'apt_2', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(0)), slotTime: '14:00', customerName: 'Bob', customerPhone: '0470000002', services: [chrisServices.haircutAndBeard], totalDuration: 45, totalPrice: 40, status: 'booked' },
    { id: 'apt_3', barberId: 'barber_2', businessId: 'biz_1', date: formatDate(getDate(0)), slotTime: '11:00', customerName: 'Charlie', customerPhone: '0470000003', services: [samServices.fade], totalDuration: 45, totalPrice: 35, status: 'completed' },
    
    // This Week's Appointments
    { id: 'apt_4', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(2)), slotTime: '11:00', customerName: 'David', customerPhone: '0470000004', services: [chrisServices.haircut], totalDuration: 30, totalPrice: 30, status: 'completed' },
    { id: 'apt_5', barberId: 'barber_2', businessId: 'biz_1', date: formatDate(getDate(3)), slotTime: '15:00', customerName: 'Eve', customerPhone: '0470000005', services: [samServices.mensCut], totalDuration: 30, totalPrice: 25, status: 'no-show' },
    { id: 'apt_6', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(1)), slotTime: '16:00', customerName: 'Frank', customerPhone: '0470000006', services: [chrisServices.beardTrim], totalDuration: 15, totalPrice: 15, status: 'completed' },

    // Last Month's Appointments
    { id: 'apt_7', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(35)), slotTime: '09:30', customerName: 'Grace', customerPhone: '0470000007', services: [chrisServices.haircutAndBeard], totalDuration: 45, totalPrice: 40, status: 'completed' },
    { id: 'apt_8', barberId: 'barber_2', businessId: 'biz_1', date: formatDate(getDate(40)), slotTime: '14:00', customerName: 'Heidi', customerPhone: '0470000008', services: [samServices.fade], totalDuration: 45, totalPrice: 35, status: 'completed' },
    { id: 'apt_9', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(32)), slotTime: '12:00', customerName: 'Ivan', customerPhone: '0470000009', services: [chrisServices.hairStyling], totalDuration: 30, totalPrice: 25, status: 'completed' },
    
    // Previous Months' Appointments
    { id: 'apt_10', barberId: 'barber_2', businessId: 'biz_1', date: formatDate(getDate(70)), slotTime: '10:30', customerName: 'Judy', customerPhone: '0470000010', services: [samServices.mensCut, samServices.styling], totalDuration: 60, totalPrice: 45, status: 'completed' },
    { id: 'apt_11', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(65)), slotTime: '13:00', customerName: 'Mallory', customerPhone: '0470000011', services: [chrisServices.haircut], totalDuration: 30, totalPrice: 30, status: 'completed' },
    { id: 'apt_12', barberId: 'barber_1', businessId: 'biz_1', date: formatDate(getDate(62)), slotTime: '11:00', customerName: 'Niaj', customerPhone: '0470000012', services: [chrisServices.beardTrim], totalDuration: 15, totalPrice: 15, status: 'no-show' },
     { id: 'apt_13', barberId: 'barber_2', businessId: 'biz_1', date: formatDate(getDate(80)), slotTime: '16:00', customerName: 'Olivia', customerPhone: '0470000013', services: [samServices.fade], totalDuration: 45, totalPrice: 35, status: 'completed' },

];