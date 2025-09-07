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
          noShowBlockLimit: number
        },
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
          noShowBlockLimit?: number
        },
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
          noShowBlockLimit?: number
        }
      },
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
        },
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
        },
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
      },
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
          dailyLocationOverrides: Json | null
          services: Json
          showPricesOnBooking: boolean | null
          showServicesOnSelector: boolean | null
          timeOff: Json
          walkinBufferMinutes: number
          workEndTime: string
          workStartTime: string
        },
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
          dailyLocationOverrides?: Json | null
          services: Json
          showPricesOnBooking?: boolean | null
          showServicesOnSelector?: boolean | null
          timeOff: Json
          walkinBufferMinutes?: number
          workEndTime: string
          workStartTime: string
        },
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
          dailyLocationOverrides?: Json | null
          services?: Json
          showPricesOnBooking?: boolean | null
          showServicesOnSelector?: boolean | null
          timeOff?: Json
          walkinBufferMinutes?: number
          workEndTime?: string
          workStartTime?: string
        }
      },
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
          logoUrl: string | null
        },
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
          logoUrl?: string | null
        },
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
          logoUrl?: string | null
        }
      },
      expenses: {
        Row: {
          amount: number
          dateAdded: string
          id: string
          name: string
          type: "monthly" | "yearly" | "one-time"
        },
        Insert: {
          amount: number
          dateAdded?: string
          id?: string
          name: string
          type: "monthly" | "yearly" | "one-time"
        },
        Update: {
          amount?: number
          dateAdded?: string
          id?: string
          name?: string
          type?: "monthly" | "yearly" | "one-time"
        }
      },
      blocked_customers: {
        Row: {
          id: string
          customerPhone: string
          isBlocked: boolean
          blockedAt: string
          reason: string | null
        },
        Insert: {
          id?: string
          customerPhone: string
          isBlocked?: boolean
          blockedAt?: string
          reason?: string | null
        },
        Update: {
          id?: string
          customerPhone?: string
          isBlocked?: boolean
          blockedAt?: string
          reason?: string | null
        }
      },
      customer_reports: {
        Row: {
            id: string
            createdAt: string
            reportedByCustomerPhone: string
            reportedBarberId: string
            reportMessage: string
            status: "new" | "in_progress" | "resolved"
            businessId: string
        },
        Insert: {
            id?: string
            createdAt?: string
            reportedByCustomerPhone: string
            reportedBarberId: string
            reportMessage: string
            status?: "new" | "in_progress" | "resolved"
            businessId: string
        },
        Update: {
            id?: string
            createdAt?: string
            reportedByCustomerPhone?: string
            reportedBarberId?: string
            // FIX: Made reportMessage optional for update operations.
            reportMessage?: string
            status?: "new" | "in_progress" | "resolved"
            businessId?: string
        }
      },
    },
    Views: {
      [_ in never]: never
    },
    Functions: {
      delete_barber_user: {
        Args: {
          user_id_to_delete: string
        },
        // FIX: The Supabase client's type inference was failing, causing arguments to be typed as `never`.
        // Changing the return type for RPC functions without a return value to `null` resolves this.
        Returns: null
      },
      delete_business_and_dependents: {
        Args: {
          business_id_to_delete: string
        },
        // FIX: The Supabase client's type inference was failing, causing arguments to be typed as `never`.
        // Changing the return type for RPC functions without a return value to `null` resolves this.
        Returns: null
      },
      handle_no_show: {
        Args: {
          p_customer_phone: string
          p_block_limit: number
        },
        // FIX: The Supabase client's type inference was failing, causing arguments to be typed as `never`.
        // Changing the return type for RPC functions without a return value to `null` resolves this.
        Returns: null
      }
    },
    Enums: {
      [_ in never]: never
    },
    CompositeTypes: {
      [_ in never]: never
    }
  }
}