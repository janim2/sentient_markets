import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string | null
          payment_method: "paypal" | "usdt"
          amount: number
          currency: string
          status: "pending" | "completed" | "failed" | "cancelled"
          payment_proof_url: string | null
          paypal_payment_id: string | null
          discord_invite_sent: boolean
          admin_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          payment_method: "paypal" | "usdt"
          amount: number
          currency?: string
          status?: "pending" | "completed" | "failed" | "cancelled"
          payment_proof_url?: string | null
          paypal_payment_id?: string | null
          discord_invite_sent?: boolean
          admin_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          payment_method?: "paypal" | "usdt"
          amount?: number
          currency?: string
          status?: "pending" | "completed" | "failed" | "cancelled"
          payment_proof_url?: string | null
          paypal_payment_id?: string | null
          discord_invite_sent?: boolean
          admin_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          role: "admin" | "super_admin"
          created_at: string
        }
        Insert: {
          id: string
          role?: "admin" | "super_admin"
          created_at?: string
        }
        Update: {
          id?: string
          role?: "admin" | "super_admin"
          created_at?: string
        }
      }
    }
  }
}
