
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
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
          id: number
          showServicesOnSelector: boolean
        }
        Insert: {
          allowBarberLanguageControl?: boolean
          appName?: string
          contactEmail?: string | null
          defaultSubscriptionPrice?: number
          id?: number
          showServicesOnSelector?: boolean
        }
        Update: {
          allowBarberLanguageControl?: boolean
          appName?: string
          contactEmail?: string | null
          defaultSubscriptionPrice?: number
          id?: number
          showServicesOnSelector?: boolean
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
          status: "booked" | "completed" | "cancelled" | "no-show"
          totalDuration: number
          totalPrice: number
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
        }
      }
      barbers: {
        Row: {
          allowedLanguages: string[] | null
          avatarUrl: string | null
          bookableDaysInAdvance: number
          businessId: string
          id: string
          name: string
          onLocationDays: number[]
          onLocationMode: "none" | "optional" | "exclusive"
          phoneNumber: string | null
          preferredLanguage: string | null
          recurringClosedDays: number[]
          scheduleOverrides: Json
          services: Json
          showPricesOnBooking: boolean | null
          showServicesOnSelector: boolean | null
          timeOff: Json
          username: string
          workEndTime: string
          workStartTime: string
        }
        Insert: {
          allowedLanguages?: string[] | null
          avatarUrl?: string | null
          bookableDaysInAdvance: number
          businessId: string
          id?: string
          name: string
          onLocationDays: number[]
          onLocationMode: "none" | "optional" | "exclusive"
          phoneNumber?: string | null
          preferredLanguage?: string | null
          recurringClosedDays: number[]
          scheduleOverrides: Json
          services: Json
          showPricesOnBooking?: boolean | null
          showServicesOnSelector?: boolean | null
          timeOff: Json
          username: string
          workEndTime: string
          workStartTime: string
        }
        Update: {
          allowedLanguages?: string[] | null
          avatarUrl?: string | null
          bookableDaysInAdvance?: number
          businessId?: string
          id?: string
          name?: string
          onLocationDays?: number[]
          onLocationMode?: "none" | "optional" | "exclusive"
          phoneNumber?: string | null
          preferredLanguage?: string | null
          recurringClosedDays?: number[]
          scheduleOverrides?: Json
          services?: Json
          showPricesOnBooking?: boolean | null
          showServicesOnSelector?: boolean | null
          timeOff?: Json
          username?: string
          workEndTime?: string
          workStartTime?: string
        }
      }
      businesses: {
        Row: {
          address: string | null
          customSubscriptionPrice: number | null
          id: string
          name: string
          ownerEmail: string | null
          ownerName: string | null
          subscriptionStatus: "active" | "trial" | "past_due" | "cancelled"
          subscriptionValidUntil: string
          suppressGracePeriodWarning: boolean | null
          theme: string | null
        }
        Insert: {
          address?: string | null
          customSubscriptionPrice?: number | null
          id?: string
          name: string
          ownerEmail?: string | null
          ownerName?: string | null
          subscriptionStatus: "active" | "trial" | "past_due" | "cancelled"
          subscriptionValidUntil: string
          suppressGracePeriodWarning?: boolean | null
          theme?: string | null
        }
        Update: {
          address?: string | null
          customSubscriptionPrice?: number | null
          id?: string
          name?: string
          ownerEmail?: string | null
          ownerName?: string | null
          subscriptionStatus?: "active" | "trial" | "past_due" | "cancelled"
          subscriptionValidUntil?: string
          suppressGracePeriodWarning?: boolean | null
          theme?: string | null
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
          dateAdded: string
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
    }
    Views: {
      barbers_with_passwords: {
        Row: {
          // This is a view, so all columns are potentially nullable
          allowedLanguages: string[] | null
          avatarUrl: string | null
          bookableDaysInAdvance: number | null
          businessId: string | null
          id: string | null
          name: string | null
          onLocationDays: number[] | null
          onLocationMode: "none" | "optional" | "exclusive" | null
          password: string | null
          phoneNumber: string | null
          preferredLanguage: string | null
          recurringClosedDays: number[] | null
          scheduleOverrides: Json | null
          services: Json | null
          showPricesOnBooking: boolean | null
          showServicesOnSelector: boolean | null
          timeOff: Json | null
          username: string | null
          workEndTime: string | null
          workStartTime: string | null
        }
      }
    }
    Functions: {}
  }
}
