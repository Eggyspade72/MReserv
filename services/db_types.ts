
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_config: {
        Row: {
          allowBarberLanguageControl: boolean
          appName: string
          contactEmail: string | null
          defaultSubscriptionPrice: number
          enableCancellationFee: boolean
          enableWaitlist: boolean
          enableWalkinBuffer: boolean
          id: number
          showServicesOnSelector: boolean
          no_show_block_limit: number
        }
        Insert: {
          allowBarberLanguageControl?: boolean
          appName?: string
          contactEmail?: string | null
          defaultSubscriptionPrice?: number
          enableCancellationFee?: boolean
          enableWaitlist?: boolean
          enableWalkinBuffer?: boolean
          id?: number
          showServicesOnSelector?: boolean
          no_show_block_limit?: number
        }
        Update: {
          allowBarberLanguageControl?: boolean
          appName?: string
          contactEmail?: string | null
          defaultSubscriptionPrice?: number
          enableCancellationFee?: boolean
          enableWaitlist?: boolean
          enableWalkinBuffer?: boolean
          id?: number
          showServicesOnSelector?: boolean
          no_show_block_limit?: number
        }
      }
      appointments: {
        Row: {
          barberId: string
          businessId: string
          customerName: string
          customerPhone: string
          date: string
          id: string
          services: Json
          slotTime: string
          status: "booked" | "completed" | "cancelled" | "no-show"
          totalDuration: number
          totalPrice: number
          wantsEarlierSlot: boolean | null
        }
        Insert: {
          barberId: string
          businessId: string
          customerName: string
          customerPhone: string
          date: string
          id?: string
          services: Json
          slotTime: string
          status?: "booked" | "completed" | "cancelled" | "no-show"
          totalDuration: number
          totalPrice: number
          wantsEarlierSlot?: boolean | null
        }
        Update: {
          barberId?: string
          businessId?: string
          customerName?: string
          customerPhone?: string
          date?: string
          id?: string
          services?: Json
          slotTime?: string
          status?: "booked" | "completed" | "cancelled" | "no-show"
          totalDuration?: number
          totalPrice?: number
          wantsEarlierSlot?: boolean | null
        }
      }
      barbers: {
        Row: {
          allowedLanguages: string[] | null
          avatarUrl: string | null
          blockedSlots: Json
          bookableDaysInAdvance: number
          businessId: string
          email: string
          enableWaitlist: boolean
          enableWalkinBuffer: boolean
          id: string
          name: string
          onLocationDays: number[]
          onLocationMode: "none" | "optional" | "exclusive"
          phoneNumber: string | null
          preferredLanguage: string | null
          recurringClosedDays: number[]
          scheduleOverrides: Json
          daily_location_overrides: Json | null
          services: Json
          showPricesOnBooking: boolean | null
          showServicesOnSelector: boolean | null
          timeOff: Json
          walkinBufferMinutes: number
          workEndTime: string
          workStartTime: string
        }
        Insert: {
          allowedLanguages?: string[] | null
          avatarUrl?: string | null
          blockedSlots?: Json
          bookableDaysInAdvance?: number
          businessId: string
          email: string
          enableWaitlist?: boolean
          enableWalkinBuffer?: boolean
          id: string
          name: string
          onLocationDays?: number[]
          onLocationMode?: "none" | "optional" | "exclusive"
          phoneNumber?: string | null
          preferredLanguage?: string | null
          recurringClosedDays: number[]
          scheduleOverrides: Json
          daily_location_overrides?: Json | null
          services: Json
          showPricesOnBooking?: boolean | null
          showServicesOnSelector?: boolean | null
          timeOff: Json
          walkinBufferMinutes?: number
          workEndTime: string
          workStartTime: string
        }
        Update: {
          allowedLanguages?: string[] | null
          avatarUrl?: string | null
          blockedSlots?: Json
          bookableDaysInAdvance?: number
          businessId?: string
          email?: string
          enableWaitlist?: boolean
          enableWalkinBuffer?: boolean
          id?: string
          name?: string
          onLocationDays?: number[]
          onLocationMode?: "none" | "optional" | "exclusive"
          phoneNumber?: string | null
          preferredLanguage?: string | null
          recurringClosedDays?: number[]
          scheduleOverrides?: Json
          daily_location_overrides?: Json | null
          services?: Json
          showPricesOnBooking?: boolean | null
          showServicesOnSelector?: boolean | null
          timeOff?: Json
          walkinBufferMinutes?: number
          workEndTime?: string
          workStartTime?: string
        }
      }
      businesses: {
        Row: {
          address: string | null
          cancellationFeeAmount: number
          cancellationFeeHours: number
          customSubscriptionPrice: number | null
          enableCancellationFee: boolean
          id: string
          name: string
          ownerEmail: string | null
          ownerName: string | null
          subscriptionStatus: "active" | "trial" | "past_due" | "cancelled"
          subscriptionValidUntil: string
          suppressGracePeriodWarning: boolean | null
          theme: string | null
          logo_url: string | null
        }
        Insert: {
          address?: string | null
          cancellationFeeAmount?: number
          cancellationFeeHours?: number
          customSubscriptionPrice?: number | null
          enableCancellationFee?: boolean
          id?: string
          name: string
          ownerEmail?: string | null
          ownerName?: string | null
          subscriptionStatus: "active" | "trial" | "past_due" | "cancelled"
          subscriptionValidUntil: string
          suppressGracePeriodWarning?: boolean | null
          theme?: string | null
          logo_url?: string | null
        }
        Update: {
          address?: string | null
          cancellationFeeAmount?: number
          cancellationFeeHours?: number
          customSubscriptionPrice?: number | null
          enableCancellationFee?: boolean
          id?: string
          name?: string
          ownerEmail?: string | null
          ownerName?: string | null
          subscriptionStatus?: "active" | "trial" | "past_due" | "cancelled"
          subscriptionValidUntil?: string
          suppressGracePeriodWarning?: boolean | null
          theme?: string | null
          logo_url?: string | null
        }
      }
      expenses: {
        Row: {
          amount: number
          dateAdded: string
          id: string
          name: string
          type: "monthly" | "yearly" | "one-time"
        }
        Insert: {
          amount: number
          dateAdded?: string
          id?: string
          name: string
          type: "monthly" | "yearly" | "one-time"
        }
        Update: {
          amount?: number
          dateAdded?: string
          id?: string
          name?: string
          type?: "monthly" | "yearly" | "one-time"
        }
      }
      blocked_customers: {
        Row: {
          id: string
          customer_phone: string
          is_blocked: boolean
          blocked_at: string
          reason: string | null
        }
        Insert: {
          id?: string
          customer_phone: string
          is_blocked?: boolean
          blocked_at?: string
          reason?: string | null
        }
        Update: {
          id?: string
          customer_phone?: string
          is_blocked?: boolean
          blocked_at?: string
          reason?: string | null
        }
      }
      customer_reports: {
        Row: {
            id: string
            created_at: string
            reported_by_customer_phone: string
            reported_barber_id: string
            report_message: string
            status: "new" | "in_progress" | "resolved"
            businessId: string
        }
        Insert: {
            id?: string
            created_at?: string
            reported_by_customer_phone: string
            reported_barber_id: string
            report_message: string
            status?: "new" | "in_progress" | "resolved"
            businessId: string
        }
        Update: {
            id?: string
            created_at?: string
            reported_by_customer_phone?: string
            reported_barber_id?: string
            report_message?: string
            status?: "new" | "in_progress" | "resolved"
            businessId?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
