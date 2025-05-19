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
      calls: {
        Row: {
          id: string
          phone_number: string
          call_time: string
          call_duration: number
          call_cost: number
          call_end_reason: string
          call_summary: string
        }
        Insert: {
          id?: string
          phone_number: string
          call_time: string
          call_duration: number
          call_cost: number
          call_end_reason: string
          call_summary: string
        }
        Update: {
          id?: string
          phone_number?: string
          call_time?: string
          call_duration?: number
          call_cost?: number
          call_end_reason?: string
          call_summary?: string
        }
      }
      reservations: {
        Row: {
          id: string
          originating_call_id: string
          phone_number: string
          full_name: string
          reservation_date: string
          reservation_time: string
          guests: number
          special_occasion: string | null
          chefs_table: boolean
          reservation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          originating_call_id: string
          phone_number: string
          full_name: string
          reservation_date: string
          reservation_time: string
          guests: number
          special_occasion?: string | null
          chefs_table?: boolean
          reservation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          originating_call_id?: string
          phone_number?: string
          full_name?: string
          reservation_date?: string
          reservation_time?: string
          guests?: number
          special_occasion?: string | null
          chefs_table?: boolean
          reservation_id?: string | null
          created_at?: string
        }
      }
    }
  }
}