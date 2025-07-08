
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
          enableCancellationFee: boolean
          enableWaitlist: boolean
          enableWalkinBuffer: boolean
          id: number
          showServicesOnSelector: boolean
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
